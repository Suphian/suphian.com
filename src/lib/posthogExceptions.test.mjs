import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
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
  const properties = { ...exceptions.buildProperties(thrown(), { handled: true }), source: 'error' };
  exceptions.sendExceptionEvent(properties);
  assert.deepEqual(calls, [['$exception', properties, { _noTruncate: true, _batchKey: 'exceptionEvent', _originatedFromCaptureException: true }]]);
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

test('analytics.js hands it to the slim build as __extensionClasses.exceptions, an option posthog-js declares', () => {
  // The slim bundle has no exceptions extension unless config supplies one
  // (lib/src/posthog-core.js:346-347 and _initExtensions, 867-868), and
  // captureException is a no-op without it (3753).
  const analytics = readFileSync(new URL('./analytics.js', import.meta.url), 'utf8');
  assert.match(analytics, /__extensionClasses: \{ exceptions: PostHogExceptions \}/);
  assert.match(analytics, /import\('\.\/posthogExceptions\.js'\)/);
  // lib/src/types.d.ts:65-66: __extensionClasses?: { exceptions?: ExtensionConstructor<PostHogExceptions> ...
  assert.match(sdkSource('types.d.ts'), /__extensionClasses\?: \{\s+exceptions\?: ExtensionConstructor<PostHogExceptions>;/);
  assert.match(sdkSource('posthog-core.js'), /if \(ext\.exceptions\) \{\s+this\._extensions\.push\(\(this\.exceptions = /);
});
