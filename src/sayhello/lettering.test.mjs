/**
 * SAY HELLO lettering tests (node:test, no DOM): the in-motion fill that
 * stands in for the grain while the letters move.
 *   node --test src/sayhello/
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { LETTERING_MOVING_DEFS as WORDMARK_MOVING_DEFS } from '../wordmark/lettering.js';
import { ID_PREFIX, LETTERS, LETTERING_DEFS, LETTERING_MOVING_DEFS, createSayHelloSvg, prefixIds } from './lettering.js';

const css = readFileSync(new URL('./sayhello.css', import.meta.url), 'utf8');

test('the in-motion fill is the wordmark\'s, re-id\'d beside the grain it stands in for', () => {
  assert.equal(LETTERING_MOVING_DEFS, prefixIds(WORDMARK_MOVING_DEFS, ID_PREFIX));
  assert.match(LETTERING_MOVING_DEFS, /id="sh-letter-red-moving"/);
  assert.match(LETTERING_DEFS, /id="sh-letter-surface"/);
});

test('sayhello.css drops the grain only off rest, for a gradient that exists, with a solid fallback', () => {
  const rule = css.match(/\.say-hello-lettering \[data-moving\] \.letter-silhouette \{([^}]*)\}/);
  assert.ok(rule, 'the data-moving rule');
  assert.match(rule[1], /filter: none/);
  const [, id] = rule[1].match(/fill: url\(#([\w-]+)\) #[0-9a-f]{6}/) ?? [];
  assert.ok(id && LETTERING_MOVING_DEFS.includes(`id="${id}"`), `#${id} is defined`);
  for (const letter of LETTERS) assert.match(letter.markup, /class="letter-silhouette"[^>]*filter="url\(#sh-letter-surface\)"/, letter.id);
});

test('the standalone SAY HELLO SVG keeps the grain and never carries the in-motion fill', () => {
  const svg = createSayHelloSvg();
  assert.ok(!svg.includes('letter-red-moving'));
  assert.match(svg, /filter="url\(#letter-surface\)"/);
});
