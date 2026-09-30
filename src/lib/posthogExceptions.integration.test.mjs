// End to end in Node, the guard against posthog-js upgrades: the real
// analytics.js, errors.js, posthog-js slim build and posthogExceptions.js under
// a fake browser, with fetch and navigator.sendBeacon recording what would go
// to /ingest. With the analytics-debug flag on, a thrown error goes out as
// exactly one $exception with stack frames; with it off, nothing goes out.
import assert from 'node:assert/strict';
import test from 'node:test';
import { gunzipSync } from 'node:zlib';

// posthog-js keeps timers running (batch flushes, session checks), which would
// keep this test process alive after the tests: its timers are unref'd. The
// test's own waits use the real ones.
const { setTimeout: wait, setInterval: repeat } = globalThis;
const unref = (timer) => {
  timer?.unref?.();
  return timer;
};
globalThis.setTimeout = (...args) => unref(wait(...args));
globalThis.setInterval = (...args) => unref(repeat(...args));
const sleep = (ms) => new Promise((resolve) => wait(resolve, ms));

const store = {};
const requests = [];
const record = (transport) => (url, body) => {
  requests.push({ transport, url: String(url), body });
  return transport === 'fetch' ? Promise.resolve(new Response('{"status":1}', { status: 200 })) : true;
};

// Just enough browser for posthog-js. No console on window: posthog-js's debug
// logging goes to window.console, so the test output stays clean.
const win = new EventTarget();
Object.assign(win, {
  location: new URL('http://127.0.0.1:4174/'),
  localStorage: {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
  },
  sessionStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  navigator: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36',
    language: 'en-US',
    languages: ['en-US'],
    onLine: true,
    sendBeacon: record('sendBeacon'),
  },
  fetch: (url, init) => record('fetch')(url, init?.body),
  requestIdleCallback: (fn) => wait(fn, 0),
  setTimeout: globalThis.setTimeout,
  setInterval: globalThis.setInterval,
  onpagehide: null,
  screen: { width: 1440, height: 900 },
  innerWidth: 1440,
  innerHeight: 900,
});
const doc = new EventTarget();
Object.assign(doc, {
  readyState: 'complete',
  visibilityState: 'visible',
  location: win.location,
  referrer: '',
  title: 'Suphian',
  cookie: '',
  documentElement: { clientHeight: 900, scrollHeight: 900 },
  body: { scrollHeight: 900 },
});
win.window = win;
win.document = doc;
globalThis.window = win;
globalThis.self = win;
globalThis.document = doc;
globalThis.fetch = win.fetch;
// afterFirstPaint waits for a first-contentful-paint entry: report one at once.
globalThis.PerformanceObserver = class {
  constructor(callback) { this.callback = callback; }
  observe() { this.callback({ getEntriesByName: () => [{}] }); }
  disconnect() {}
};

const { default: posthog } = await import('posthog-js/dist/module.slim.js');
const { installErrorTracking } = await import('./errors.js');

async function decode(body) {
  const bytes = body instanceof Blob ? new Uint8Array(await body.arrayBuffer())
    : body instanceof ArrayBuffer ? new Uint8Array(body)
      : ArrayBuffer.isView(body) ? new Uint8Array(body.buffer, body.byteOffset, body.byteLength) : null;
  if (!bytes) return String(body ?? '');
  try {
    return gunzipSync(bytes).toString('utf8');
  } catch {
    return Buffer.from(bytes).toString('utf8');
  }
}

/** Every event in the recorded requests, with the path it went to. */
async function sentEvents() {
  const events = [];
  for (const { url, body } of requests) {
    const parsed = JSON.parse(await decode(body));
    for (const event of Array.isArray(parsed) ? parsed : parsed.batch ?? [parsed]) events.push({ path: new URL(url, win.location).pathname, ...event });
  }
  return events;
}

async function until(condition, ms = 5000) {
  const end = Date.now() + ms;
  while (!condition()) {
    if (Date.now() > end) throw new Error('timed out');
    await sleep(10);
  }
}

// What main.jsx does at startup, then a render that throws.
async function visit(tag) {
  const analytics = await import(`./analytics.js?${tag}`);
  if (analytics.analyticsEnabled) installErrorTracking(analytics.captureException, { target: win, now: () => Date.now() });
  const error = (() => {
    try {
      (function renderStory() {
        throw new TypeError("Cannot read properties of undefined (reading 'title')");
      })();
    } catch (caught) {
      return caught;
    }
  })();
  const fire = (fields) => win.dispatchEvent(Object.assign(new Event('error'), fields));
  // The same uncaught error twice (one is folded), and noise that is dropped.
  fire({ error, message: `Uncaught ${error}`, filename: 'http://127.0.0.1:4174/assets/index.js', lineno: 1, colno: 1 });
  fire({ error, message: `Uncaught ${error}`, filename: 'http://127.0.0.1:4174/assets/index.js', lineno: 1, colno: 1 });
  fire({ message: 'ResizeObserver loop completed with undelivered notifications.' });
  analytics.startAnalytics();
  return analytics;
}

test('with the debug flag off, nothing loads and nothing is sent', async () => {
  delete store['analytics-debug'];
  const analytics = await visit('off');
  assert.equal(analytics.analyticsEnabled, false);
  analytics.captureException(new Error('direct'), { source: 'manual' });
  await sleep(200);
  assert.equal(posthog.__loaded, false, 'posthog-js was never started');
  assert.deepEqual(requests, []);
});

test('with the debug flag on, a thrown error reaches /ingest/e/ as exactly one $exception with stack frames', async () => {
  store['analytics-debug'] = '1';
  const analytics = await visit('on');
  assert.equal(analytics.analyticsEnabled, true);
  await until(() => posthog.__loaded);
  // Leaving the page flushes PostHog's batches (by beacon) instead of waiting for its timer.
  win.dispatchEvent(new Event('pagehide'));
  await until(() => requests.length > 0);
  await sleep(50);

  const events = await sentEvents();
  const exceptions = events.filter((event) => event.event === '$exception');
  assert.equal(exceptions.length, 1, JSON.stringify(events.map((event) => event.event)));
  const [sent] = exceptions;
  assert.equal(sent.path, '/ingest/e/');
  assert.equal(sent.properties.token, analytics.POSTHOG_KEY);
  assert.equal(sent.properties.source, 'error');
  assert.equal(sent.properties.$exception_level, 'error');
  assert.equal(sent.properties.$exception_list.length, 1);
  const [exception] = sent.properties.$exception_list;
  assert.equal(exception.type, 'TypeError');
  assert.equal(exception.value, "Cannot read properties of undefined (reading 'title')");
  assert.equal(exception.mechanism.handled, false, 'an uncaught error is unhandled');
  assert.equal(exception.stacktrace.type, 'raw');
  assert.ok(exception.stacktrace.frames.some((frame) => frame.function === 'renderStory' && /posthogExceptions\.integration\.test\.mjs$/.test(frame.filename)));
  // The $pageview went out too, and the exception's page view is that one.
  const pageview = events.find((event) => event.event === '$pageview');
  assert.ok(pageview, 'the $pageview is sent');
  assert.equal(sent.properties.$session_id, pageview.properties.$session_id);
});
