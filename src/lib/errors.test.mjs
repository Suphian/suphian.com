import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mock, test } from 'node:test';
import { createTracker } from './analytics.js';
import { boundaryReport, importWithRetry, installErrorTracking, isNoise, markChunkError, normalizeErrorEvent } from './errors.js';

// installErrorTracking on a fake window (a plain EventTarget) with a mocked clock.
function setup(capture) {
  mock.timers.enable({ apis: ['Date'] });
  const target = new EventTarget();
  const captured = [];
  const remove = installErrorTracking(capture ?? ((input, props) => captured.push({ input, props })), {
    target,
    now: () => Date.now(),
  });
  // ErrorEvent and PromiseRejectionEvent are browser-only: an Event with their fields.
  const fire = (type, fields) => target.dispatchEvent(Object.assign(new Event(type), fields));
  const throwError = (error, fields) => fire('error', { error, message: error?.message ?? '', ...fields });
  const reject = (reason) => fire('unhandledrejection', { reason });
  return { captured, fire, throwError, reject, remove };
}

// An Error whose stack is fixed, so dedupe keys are predictable.
function errorWithStack(message, stack = `Error: ${message}\n    at render (https://suphian.com/assets/index-abc.js:1:100)`) {
  const error = new Error(message);
  error.stack = stack;
  return error;
}

test('an uncaught error is captured with its Error and source', (t) => {
  t.after(() => mock.timers.reset());
  const { captured, throwError } = setup();
  const error = errorWithStack('boom');
  throwError(error, { filename: 'https://suphian.com/assets/index-abc.js' });
  assert.deepEqual(captured, [{ input: error, props: { source: 'error' } }]);
});

test('an error event with no Error object is captured as the event, for PostHog to build a location stack', (t) => {
  t.after(() => mock.timers.reset());
  const { captured, fire } = setup();
  fire('error', { message: 'Uncaught TypeError: x is not a function', filename: 'https://suphian.com/assets/index-abc.js', lineno: 1, colno: 9 });
  assert.equal(captured.length, 1);
  assert.equal(captured[0].input.type, 'error');
  assert.equal(captured[0].input.message, 'Uncaught TypeError: x is not a function');
});

test('an unhandled rejection is captured with its reason, Error or not', (t) => {
  t.after(() => mock.timers.reset());
  const { captured, reject } = setup();
  const error = errorWithStack('fetch failed');
  reject(error);
  reject('plain string reason');
  reject({ code: 42 });
  assert.deepEqual(captured, [
    { input: error, props: { source: 'unhandledrejection' } },
    { input: 'plain string reason', props: { source: 'unhandledrejection' } },
    { input: { code: 42 }, props: { source: 'unhandledrejection' } },
  ]);
});

test('noise is dropped: ResizeObserver loops, stackless cross-origin Script error., extension frames', (t) => {
  t.after(() => mock.timers.reset());
  const { captured, fire, throwError } = setup();
  fire('error', { message: 'ResizeObserver loop limit exceeded' });
  fire('error', { message: 'ResizeObserver loop completed with undelivered notifications.' });
  fire('error', { message: 'Script error.', filename: '', lineno: 0, colno: 0 });
  fire('error', { message: 'Script error', error: null });
  throwError(errorWithStack('ext', 'Error: ext\n    at x (chrome-extension://abcdef/content.js:1:1)'));
  throwError(errorWithStack('ext', 'Error: ext\n    at x (https://suphian.com/assets/index-abc.js:1:1)\n    at y (moz-extension://1234/inject.js:2:2)'));
  fire('error', { message: 'Uncaught Error: injected', filename: 'chrome-extension://abcdef/inject.js', lineno: 3 });
  // Safari's extension frames, as posthog-js's stack parser writes them.
  throwError(errorWithStack('safari', 'Error: safari\n    at x (safari-extension:(//com.example.ext/abc/content.js):1:1)'));
  throwError(errorWithStack('safari web', 'Error: safari web\n    at x (safari-web-extension://ABC-123/content.js:1:1)'));
  fire('error', { message: 'Uncaught Error: injected', filename: 'safari-web-extension://ABC-123/inject.js', lineno: 3 });
  assert.deepEqual(captured, []);

  // A "Script error." that does carry a stack is this site's, and is kept.
  throwError(errorWithStack('Script error.'));
  assert.equal(captured.length, 1);
});

test('the same message and stack is sent once per 60 s, then again after', (t) => {
  t.after(() => mock.timers.reset());
  const { captured, throwError } = setup();
  throwError(errorWithStack('boom'));
  throwError(errorWithStack('boom'));
  mock.timers.tick(59_999);
  throwError(errorWithStack('boom'));
  assert.equal(captured.length, 1, 'repeats inside the minute are folded');

  throwError(errorWithStack('boom', 'Error: boom\n    at other (https://suphian.com/assets/index-abc.js:2:5)'));
  throwError(errorWithStack('bang'));
  assert.equal(captured.length, 3, 'a different stack or message is a different error');

  mock.timers.tick(1);
  throwError(errorWithStack('boom'));
  assert.equal(captured.length, 4, 'allowed again 60 s after it was sent');
});

test('a page sends at most 10', (t) => {
  t.after(() => mock.timers.reset());
  const { captured, throwError, reject } = setup();
  for (let i = 0; i < 15; i += 1) throwError(errorWithStack(`error ${i}`));
  reject(errorWithStack('late rejection'));
  assert.equal(captured.length, 10);
  assert.equal(captured.at(-1).input.message, 'error 9');
  mock.timers.tick(10 * 60_000);
  throwError(errorWithStack('much later'));
  assert.equal(captured.length, 10, 'the cap is per page, not per minute');
});

test('the listeners come off', (t) => {
  t.after(() => mock.timers.reset());
  const { captured, throwError, remove } = setup();
  remove();
  throwError(errorWithStack('after remove'));
  assert.deepEqual(captured, []);
});

test('a throwing capture never escapes the listener', (t) => {
  t.after(() => mock.timers.reset());
  const { throwError } = setup(() => {
    throw new Error('capture broke');
  });
  assert.doesNotThrow(() => throwError(errorWithStack('boom')));
});

test('errors before PostHog loads wait in the queue and reach captureException once, after load', (t) => {
  t.after(() => mock.timers.reset());
  const tracker = createTracker({ enabled: true });
  const { throwError, reject } = setup(tracker.captureException);
  const error = errorWithStack('early');
  throwError(error);
  reject('early rejection');
  tracker.track('say_hello_clicked');
  assert.equal(tracker.queued, 3);

  const calls = [];
  const posthog = {
    capture: (...args) => calls.push(['capture', ...args]),
    captureException: (...args) => calls.push(['captureException', ...args]),
  };
  tracker.ready(posthog);
  tracker.ready(posthog);
  assert.equal(tracker.queued, 0);
  assert.deepEqual(calls.map(([method, first, props]) => [method, first, props]), [
    ['captureException', error, { source: 'error' }],
    ['captureException', 'early rejection', { source: 'unhandledrejection' }],
    ['capture', 'say_hello_clicked', {}],
  ]);

  throwError(errorWithStack('after load'));
  assert.equal(calls.length, 4, 'after load, exceptions go straight out');
  assert.equal(calls[3][0], 'captureException');
});

test('off the production host (a disabled tracker) nothing queues or sends', (t) => {
  t.after(() => mock.timers.reset());
  const tracker = createTracker({ enabled: false });
  const { throwError } = setup(tracker.captureException);
  throwError(errorWithStack('preview'));
  const calls = [];
  tracker.ready({ capture: () => calls.push('capture'), captureException: () => calls.push('captureException') });
  assert.equal(tracker.queued, 0);
  assert.deepEqual(calls, []);
});

test('if PostHog fails to load, queued exceptions are dropped quietly', (t) => {
  t.after(() => mock.timers.reset());
  const tracker = createTracker({ enabled: true });
  const { throwError } = setup(tracker.captureException);
  throwError(errorWithStack('early'));
  tracker.ready(null);
  assert.equal(tracker.queued, 0);
  assert.doesNotThrow(() => throwError(errorWithStack('later')));
});

test('normalizeErrorEvent and isNoise read message, stack and file', () => {
  const error = errorWithStack('boom');
  assert.deepEqual(normalizeErrorEvent({ type: 'error', error, message: 'Uncaught Error: boom', filename: 'https://suphian.com/a.js' }), {
    input: error,
    message: 'boom',
    stack: error.stack,
    filename: 'https://suphian.com/a.js',
    source: 'error',
  });
  assert.equal(normalizeErrorEvent({ type: 'unhandledrejection', reason: undefined }).message, 'undefined');
  assert.equal(isNoise({ message: 'boom', stack: error.stack, filename: '' }), false);
  assert.equal(isNoise({ message: 'Script error.', stack: '', filename: '' }), true);
});

test('a $pageview queued before an exception is delivered first, so the exception carries its page view', () => {
  const tracker = createTracker({ enabled: true });
  tracker.trackOnce('$pageview');
  tracker.captureException(new Error('mount failed'), { source: 'mount' });
  const calls = [];
  tracker.ready({
    capture: (event) => calls.push(event),
    captureException: (error, props) => calls.push(`captureException ${props.source}`),
  });
  assert.deepEqual(calls, ['$pageview', 'captureException mount']);
});

test("main.jsx's mount failure starts analytics before it captures", () => {
  const main = readFileSync(new URL('../main.jsx', import.meta.url), 'utf8');
  assert.match(main, /startAnalytics\(\);\s*captureException\(error, \{ source: 'mount' \}\);/);
});

test('importWithRetry retries once, and marks a chunk that still fails so boundaries report lazy-chunk', async () => {
  const waits = [];
  const wait = async (ms) => { waits.push(ms); };
  let attempts = 0;
  const flaky = () => (attempts++ === 0 ? Promise.reject(new TypeError('Failed to fetch dynamically imported module')) : Promise.resolve('chunk'));
  assert.equal(await importWithRetry(flaky, { wait }), 'chunk');
  assert.deepEqual(waits, [1500]);

  const failure = new TypeError('Failed to fetch dynamically imported module: /assets/SayHello-abc.js');
  let calls = 0;
  const error = await importWithRetry(() => { calls += 1; return Promise.reject(failure); }, { wait }).catch((caught) => caught);
  assert.equal(error, failure);
  assert.equal(calls, 2);
  assert.deepEqual(boundaryReport(error, { componentStack: '\n    at SayHelloSlot' }), [failure, { source: 'lazy-chunk', componentStack: '\n    at SayHelloSlot' }]);
});

test('boundaryReport says react for render errors, and survives a missing info or a thrown primitive', () => {
  const error = new Error('render failed');
  assert.deepEqual(boundaryReport(error, { componentStack: '\n    at Home' }), [error, { source: 'react', componentStack: '\n    at Home' }]);
  assert.deepEqual(boundaryReport(error), [error, { source: 'react', componentStack: undefined }]);
  assert.equal(markChunkError('a string'), 'a string');
  assert.deepEqual(boundaryReport('a string', null), ['a string', { source: 'react', componentStack: undefined }]);
});
