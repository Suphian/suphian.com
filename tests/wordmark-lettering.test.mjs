import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LETTERING_DEFS, LETTERING_MOVING_DEFS, createLogoSvg } from '../src/wordmark/lettering.js';

const css = readFileSync(new URL('../src/wordmark/wordmark.css', import.meta.url), 'utf8');
const gradient = (defs, id) => defs.match(new RegExp(`<linearGradient id="${id}"([^>]*)>([\\s\\S]*?)</linearGradient>`));
const offsets = (body) => [...body.matchAll(/offset="([^"]+)"/g)].map((m) => m[1]);

test('the in-motion fill is letter-red with the same geometry and stops, only shifted in colour', () => {
  const red = gradient(LETTERING_DEFS, 'letter-red');
  const moving = gradient(LETTERING_MOVING_DEFS, 'letter-red-moving');
  assert.ok(red && moving);
  assert.equal(moving[1], red[1], 'same x1 y1 x2 y2 and units');
  assert.deepEqual(offsets(moving[2]), offsets(red[2]));
});

test('wordmark.css swaps in a gradient that exists, with a solid fallback, and drops the filter only in motion', () => {
  const rule = css.match(/\.wordmark\[data-moving\] \.letter-silhouette \{([^}]*)\}/);
  assert.ok(rule, 'the data-moving rule');
  assert.match(rule[1], /filter: none/);
  const [, id] = rule[1].match(/fill: url\(#([\w-]+)\) #[0-9a-f]{6}/) ?? [];
  assert.equal(id, 'letter-red-moving');
  assert.ok(LETTERING_MOVING_DEFS.includes(`id="${id}"`));
});

test('the exported logos keep the grain and never carry the in-motion fill', () => {
  for (const svg of [createLogoSvg(), createLogoSvg({ compact: true })]) {
    assert.ok(!svg.includes('letter-red-moving'));
    assert.match(svg, /filter="url\(#letter-surface\)"/);
  }
});
