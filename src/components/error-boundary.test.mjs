// Render errors never reach window's error event in production: React 18 hands
// them to the nearest error boundary's componentDidCatch and only logs them. So
// ErrorBoundary (App's two) and SayHelloSlot's KeepBox report to Error Tracking
// themselves. These load the real components (JSX compiled with Vite's esbuild)
// with analytics.js swapped for a recorder, and call React's boundary hook.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import module from 'node:module';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { transformWithEsbuild } from 'vite';
import { importWithRetry } from '../lib/errors.js';

// Stands in for analytics.js in the two components: records captureException calls.
const RECORDER = `data:text/javascript,${encodeURIComponent('export const calls = []; export function captureException(...args) { calls.push(args); }')}`;

const compiled = new Map();
for (const name of ['ErrorBoundary.jsx', 'SayHelloSlot.jsx']) {
  const url = new URL(`./${name}`, import.meta.url).href;
  const { code } = await transformWithEsbuild(readFileSync(new URL(url), 'utf8'), fileURLToPath(url), { loader: 'jsx', jsx: 'automatic' });
  compiled.set(url, code);
}
module.registerHooks({
  resolve(specifier, context, next) {
    if (specifier === '../lib/analytics.js' && compiled.has(context.parentURL)) return { url: RECORDER, shortCircuit: true };
    return next(specifier, context);
  },
  load(url, context, next) {
    if (compiled.has(url)) return { format: 'module', source: compiled.get(url), shortCircuit: true };
    if (url.endsWith('.css')) return { format: 'module', source: '', shortCircuit: true };
    return next(url, context);
  },
});

const { calls } = await import(RECORDER);
const { default: ErrorBoundary } = await import('./ErrorBoundary.jsx');
const { KeepBox } = await import('./SayHelloSlot.jsx');

const info = { componentStack: '\n    at Home\n    at ErrorBoundary\n    at main' };

test('ErrorBoundary shows its fallback and reports the render error as react, with the component stack', (t) => {
  calls.length = 0;
  const logged = t.mock.method(console, 'error', () => {});
  const error = new TypeError("Cannot read properties of undefined (reading 'title')");
  assert.deepEqual(ErrorBoundary.getDerivedStateFromError(error), { error });
  new ErrorBoundary({}).componentDidCatch(error, info);
  assert.deepEqual(calls, [[error, { source: 'react', componentStack: info.componentStack }]]);
  assert.equal(logged.mock.callCount(), 1, 'still logged for the console');
});

test('ErrorBoundary reports a lazy chunk that failed twice (ContactSheet) as lazy-chunk', async (t) => {
  calls.length = 0;
  t.mock.method(console, 'error', () => {});
  const error = await importWithRetry(() => Promise.reject(new TypeError('Failed to fetch dynamically imported module')), { wait: async () => {} }).catch((caught) => caught);
  new ErrorBoundary({}).componentDidCatch(error, info);
  assert.deepEqual(calls, [[error, { source: 'lazy-chunk', componentStack: info.componentStack }]]);
});

test("KeepBox keeps SAY HELLO's empty box and reports what it caught: lazy-chunk for the chunk, react otherwise", async () => {
  calls.length = 0;
  assert.deepEqual(KeepBox.getDerivedStateFromError(new Error('x')), { failed: true });
  const chunk = await importWithRetry(() => Promise.reject(new TypeError('Importing a module script failed.')), { wait: async () => {} }).catch((caught) => caught);
  const render = new Error('SayHello broke');
  new KeepBox({}).componentDidCatch(chunk, info);
  new KeepBox({}).componentDidCatch(render, info);
  assert.deepEqual(calls.map(([error, props]) => [error, props.source]), [
    [chunk, 'lazy-chunk'],
    [render, 'react'],
  ]);
});

test('UIProvider and SayHelloSlot load their lazy chunks through importWithRetry', () => {
  for (const file of ['./UIProvider.jsx', './SayHelloSlot.jsx']) {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8');
    assert.match(source, /lazy\(\(\) => importWithRetry\(/, file);
  }
});
