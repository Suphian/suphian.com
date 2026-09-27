import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COMPACT_VIEWBOX, FULL_VIEWBOX, LETTERS, LETTERING_DEFS, LETTERING_MOVING_DEFS, createLogoSvg } from '../src/wordmark/lettering.js';
import { flattenPath } from './lib/raster.mjs';

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

/** Closest horizontal approach of two neighbours' ink, row by row, at their LETTERS x. */
function closestApproach(a, b) {
  const extent = (letter, y) => {
    const xs = [];
    for (const poly of flattenPath(letter.path, 32)) {
      poly.forEach(([x1, y1], i) => {
        const [x2, y2] = poly[(i + 1) % poly.length];
        if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) xs.push(letter.x + x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
      });
    }
    return xs.length ? [Math.min(...xs), Math.max(...xs)] : null;
  };
  let min = Infinity;
  for (let y = 0; y <= FULL_VIEWBOX.height; y += 1) {
    const ea = extent(a, y);
    const eb = extent(b, y);
    if (ea && eb) min = Math.min(min, eb[0] - ea[1]);
  }
  return min;
}

test('SUPH sit exactly where the trace put them, so the docked logo is unchanged', () => {
  assert.deepEqual(LETTERS.slice(0, 4).map((l) => [l.x, l.compactX]), [[4, 4], [300, 300], [554, 554], [738, 738]]);
  assert.equal(COMPACT_VIEWBOX.width, 1044);
  assert.ok(LETTERS.slice(4).every((l) => l.compactX == null));
});

test('I A N sit a little closer to SUPH (Suphian): H to I is the tightest seam but never touches', () => {
  const approach = LETTERS.slice(0, -1).map((l, i) => closestApproach(l, LETTERS[i + 1]));
  const hi = approach[3];
  const others = approach.filter((_, i) => i !== 3);
  assert.ok(hi < Math.min(...others) - 2, `H-I ${hi.toFixed(1)} vs the others' ${Math.min(...others).toFixed(1)}`);
  assert.ok(hi > 1, `H and I must not fuse (${hi.toFixed(1)})`);
  assert.deepEqual(LETTERS.slice(4).map((l) => l.x), [1002, 1109, 1300], 'I A N move together, keeping their own spacing');
  assert.equal(FULL_VIEWBOX.width, LETTERS[6].x + LETTERS[6].width + LETTERS[0].x);
});
