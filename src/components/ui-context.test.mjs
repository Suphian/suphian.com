// Guards the fix for "useUI must be used within UIProvider" crashing the page when
// the contact sheet opened in dev. Hot reload re-instantiated UIProvider.jsx (a new
// ?t= URL) for the lazily loaded ContactSheet -> ContactForm chain, which created a
// second React context, so the form looked for a provider that wasn't mounted.
// The context now lives in a module of its own that consumers import directly,
// so every copy of UIProvider.jsx shares one context object.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import test from 'node:test';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const sources = (dir) => readdirSync(new URL(dir, import.meta.url))
  .filter((name) => /\.(jsx|js)$/.test(name) && !name.includes('.test.'))
  .map((name) => [`${dir}${name}`, read(`${dir}${name}`)]);

test('the UI context is created in its own module, and only there', () => {
  assert.match(read('./uiContext.js'), /export const UIContext = createContext\(null\)/);
  for (const [path, src] of [...sources('./'), ...sources('../hooks/'), ...sources('../story/'), ...sources('../pages/')]) {
    if (path.endsWith('uiContext.js')) continue;
    assert.doesNotMatch(src, /createContext\(/, `${path} must not create its own UI context`);
  }
});

test('useUI lives in hooks/useUI.js and reads the shared context', () => {
  const hook = read('../hooks/useUI.js');
  assert.match(hook, /from '\.\.\/components\/uiContext\.js'/);
  assert.match(hook, /export function useUI\(/);
});

test('no consumer imports UIProvider.jsx for the hook (that import cycle split the context)', () => {
  for (const [path, src] of [...sources('./'), ...sources('../story/'), ...sources('../pages/')]) {
    if (/UIProvider\.jsx$/.test(path)) continue;
    assert.doesNotMatch(src, /import \{[^}]*\buseUI\b[^}]*\} from '[^']*UIProvider\.jsx'/, `${path} imports useUI from UIProvider.jsx`);
  }
});

test('UIProvider.jsx exports only the provider component (Fast Refresh safe)', () => {
  const src = read('./UIProvider.jsx');
  assert.match(src, /from '\.\/uiContext\.js'/);
  assert.doesNotMatch(src, /export function useUI\(/);
});
