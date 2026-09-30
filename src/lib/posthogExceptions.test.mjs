import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { initPostHog, posthogConfig } from './analytics.js';
import { PostHogExceptions } from './posthogExceptions.js';

const require = createRequire(import.meta.url);
// posthog-js's readable source, next to its dist.
const sdkSource = (file) => readFileSync(path.join(path.dirname(require.resolve('posthog-js')), '../lib/src', file), 'utf8');

function extension() {
  const calls = [];
  return { calls, exceptions: new PostHogExceptions({ capture: (...args) => calls.push(args) }) };
}

function thrown() {
  try {
    throw new TypeError('x is not a function');
  } catch (error) {
    return error;
  }
}

test('builds $exception_list with type, value, mechanism and parsed stack frames', () => {
  const { exceptions } = extension();
  const properties = exceptions.buildProperties(thrown(), { handled: true, syntheticException: new Error('synthetic') });
  assert.equal(properties.$exception_level, 'error');
  assert.equal(properties.$exception_list.length, 1);
  const [exception] = properties.$exception_list;
  assert.equal(exception.type, 'TypeError');
  assert.equal(exception.value, 'x is not a function');
  assert.equal(exception.mechanism.handled, true);
  assert.equal(exception.stacktrace.type, 'raw');
  assert.ok(exception.stacktrace.frames.length > 0);
  const frame = exception.stacktrace.frames.at(-1);
  assert.equal(frame.function, 'thrown');
  assert.match(frame.filename, /posthogExceptions\.test\.mjs$/);
  assert.equal(typeof frame.lineno, 'number');
  assert.equal(typeof frame.colno, 'number');
});

test('coerces rejection reasons that are not Errors', () => {
  const { exceptions } = extension();
  assert.equal(exceptions.buildProperties('plain string', { handled: true }).$exception_list[0].value, 'plain string');
  assert.equal(exceptions.buildProperties({ code: 42 }, { handled: true }).$exception_list.length, 1);
});

test('sends $exception whole, in its own batch, flagged as from captureException', () => {
  const { calls, exceptions } = extension();
  const properties = { ...exceptions.buildProperties(thrown(), { handled: true }), source: 'manual' };
  exceptions.sendExceptionEvent(properties);
  assert.deepEqual(calls, [['$exception', properties, { _noTruncate: true, _batchKey: 'exceptionEvent', _originatedFromCaptureException: true }]]);
});

test('errors nothing handled go out as unhandled; a deliberate capture stays handled', () => {
  const { calls, exceptions } = extension();
  const error = new Error('outer', { cause: new TypeError('inner') });
  for (const source of ['error', 'unhandledrejection', 'mount', 'react', 'lazy-chunk', 'manual', undefined]) {
    // What posthog.captureException passes: handled true, whatever happened (posthog-core.js:3757).
    exceptions.sendExceptionEvent({ ...exceptions.buildProperties(error, { handled: true }), source });
  }
  const handled = calls.map(([, properties]) => [properties.source, properties.$exception_list.map((exception) => exception.mechanism.handled)]);
  assert.deepEqual(handled, [
    ['error', [false, false]],
    ['unhandledrejection', [false, false]],
    ['mount', [false, false]],
    ['react', [false, false]],
    ['lazy-chunk', [false, false]],
    ['manual', [true, undefined]],
    [undefined, [true, undefined]],
  ]);
  const [[, first]] = calls;
  assert.equal(first.$exception_list[1].mechanism.type, 'chained', 'the rest of the mechanism is kept');
});

test('with posthog-cli sourcemap inject, frames carry chunk ids and the event a release id', (t) => {
  const { calls, exceptions } = extension();
  const error = thrown();
  const file = error.stack.split('\n').find((line) => line.includes('posthogExceptions.test.mjs'));
  // What the injected snippet sets: a stack line from each chunk, mapped to its chunk id.
  globalThis._posthogChunkIds = { [`Error\n${file}`]: 'chunk-123' };
  globalThis._posthogReleaseId = 'release-456';
  t.after(() => {
    delete globalThis._posthogChunkIds;
    delete globalThis._posthogReleaseId;
  });
  exceptions.sendExceptionEvent(exceptions.buildProperties(error, { handled: true }));
  const [[, properties]] = calls;
  assert.equal(properties.$release_id, 'release-456');
  assert.ok(properties.$exception_list[0].stacktrace.frames.some((frame) => frame.chunk_id === 'chunk-123'));
});

test('has every method posthog-js calls on its exceptions extension', () => {
  // lib/src/posthog-core.js: captureException calls this.exceptions.buildProperties
  // and .sendExceptionEvent (3751-3760), set_config calls .onConfigChange (3593),
  // addExceptionStep calls .addExceptionStep (3787).
  const core = sdkSource('posthog-core.js');
  const called = new Set([
    ...[...core.matchAll(/this\.exceptions\.(\w+)\(/g)].map((match) => match[1]),
    ...[...core.matchAll(/\((_\w+) = this\.exceptions\) === null \|\| \1 === void 0 \? void 0 : \1\.(\w+)\(/g)].map((match) => match[2]),
  ]);
  assert.ok(called.has('buildProperties') && called.has('sendExceptionEvent') && called.has('onConfigChange'), [...called].join());
  for (const method of called) assert.equal(typeof PostHogExceptions.prototype[method], 'function', method);
});

// A stand-in posthog-js module: records init.
function fakePostHog() {
  const inits = [];
  return { inits, load: async () => ({ default: { init: (...args) => inits.push(args) } }) };
}

test('initPostHog hands the slim build this extension as __extensionClasses.exceptions, an option posthog-js declares', async () => {
  // The slim bundle has no exceptions extension unless config supplies one
  // (lib/src/posthog-core.js:346-347 and _initExtensions, 867-868), and
  // captureException is a no-op without it (3753).
  const posthog = fakePostHog();
  await initPostHog({ debug: true, loadPostHog: posthog.load });
  const [[key, config]] = posthog.inits;
  assert.match(key, /^phc_/);
  assert.equal(config.__extensionClasses.exceptions, PostHogExceptions, 'the default loader imports ./posthogExceptions.js');
  const { __extensionClasses, ...rest } = config;
  assert.deepEqual(rest, posthogConfig({ debug: true }));
  assert.match(readFileSync(new URL('./analytics.js', import.meta.url), 'utf8'), /loadExceptions = \(\) => import\('\.\/posthogExceptions\.js'\)/);
  // lib/src/types.d.ts:65-66: __extensionClasses?: { exceptions?: ExtensionConstructor<PostHogExceptions> ...
  assert.match(sdkSource('types.d.ts'), /__extensionClasses\?: \{\s+exceptions\?: ExtensionConstructor<PostHogExceptions>;/);
  assert.match(sdkSource('posthog-core.js'), /if \(ext\.exceptions\) \{\s+this\._extensions\.push\(\(this\.exceptions = /);
});

test('if the exceptions chunk fails to load, PostHog still starts, without it', async () => {
  const posthog = fakePostHog();
  const client = await initPostHog({ loadPostHog: posthog.load, loadExceptions: () => Promise.reject(new TypeError('Failed to fetch dynamically imported module')) });
  assert.ok(client, 'the visit still has a client');
  assert.equal(posthog.inits.length, 1);
  assert.deepEqual(posthog.inits[0][1], posthogConfig(), 'no __extensionClasses: captureException becomes a no-op');
});

test('if posthog-js itself fails to load, initPostHog rejects (startAnalytics then empties the queue)', async () => {
  await assert.rejects(initPostHog({ loadPostHog: () => Promise.reject(new TypeError('Failed to fetch dynamically imported module')) }), TypeError);
  const analytics = readFileSync(new URL('./analytics.js', import.meta.url), 'utf8');
  assert.match(analytics, /initPostHog\(\{ debug \}\)\s+\.then\(\(posthog\) => tracker\.ready\(posthog\)\)\s+\.catch\(\(\) => tracker\.ready\(null\)\)/);
});
