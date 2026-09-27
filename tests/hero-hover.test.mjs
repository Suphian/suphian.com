/**
 * Hero SUPHIAN hover (Suphian, 2026-09-27: "Can I have that on the main image
 * as well?"): the docked SUPH's touch layer (src/wordmark/dockfx.js, SAY
 * HELLO's model) fed all seven letters in full-viewBox units, gated to the
 * hero, and the pointer mapped onto it from the dock metrics. node:test, no DOM.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { FULL_VIEWBOX, LETTERS } from '../src/wordmark/lettering.js';
import { HELLO_MOTION, createHelloSim } from '../src/sayhello/motion.js';
import { HOME_LINK_PAD, dockMetrics, heroViewX } from '../src/wordmark/geometry.js';
import { DOCK_GLYPHS, HERO_GLYPHS, addState, createDockEffects, dockFxTransform } from '../src/wordmark/dockfx.js';

const REST = LETTERS.map(() => '');
const centre = (i) => HERO_GLYPHS[i].x + HERO_GLYPHS[i].width / 2;

function run(fx, { fps = 60, seconds = 6 } = {}) {
  for (let f = 1; f <= Math.round(seconds * fps); f++) {
    fx.advance(1 / fps);
    if (fx.settled) return f / fps;
  }
  return Infinity;
}

function heroFx() {
  const fx = createDockEffects({ glyphs: HERO_GLYPHS });
  fx.setEnabled(true);
  return fx;
}

test('the hero glyph set is all seven letters in full-viewBox units, the dotted I as one glyph', () => {
  assert.deepEqual(HERO_GLYPHS, LETTERS.map((l) => ({ x: l.x, width: l.width })));
  assert.equal(HERO_GLYPHS.length, 7);
  const i = LETTERS.findIndex((l) => l.char === 'I');
  assert.equal((LETTERS[i].path.match(/M /g) ?? []).length, 2, 'dot and stem are two contours of one glyph');
  assert.equal(HERO_GLYPHS.at(-1).x + HERO_GLYPHS.at(-1).width + HERO_GLYPHS[0].x, FULL_VIEWBOX.width);
  // The docked set is unchanged: S U P H in compact units.
  assert.deepEqual(DOCK_GLYPHS, LETTERS.slice(0, 4).map((l) => ({ x: l.compactX, width: l.width })));
});

test('a pointer over the hero word maps onto the full viewBox from the same metrics as the letters', () => {
  for (const [width, heroHeight] of [[1440, 900], [1280, 800], [1920, 1080], [1024, 768], [390, 844]]) {
    const m = dockMetrics({ width, heroHeight });
    const top = m.startY + (FULL_VIEWBOX.height * m.startScale) / 2; // Mid-height of the word.
    const at = `${width}x${heroHeight}`;
    // Every glyph centre on screen lands on that glyph's own x.
    HERO_GLYPHS.forEach((g, i) => {
      const x = heroViewX(m.margin + centre(i) * m.startScale, top, m);
      assert.ok(Math.abs(x - centre(i)) < 1e-6, `${LETTERS[i].char} at ${at}: ${x}`);
    });
    // The word's edges are the viewBox's.
    assert.ok(Math.abs(heroViewX(m.margin, top, m)) < 1e-9);
    assert.ok(Math.abs(heroViewX(m.margin + FULL_VIEWBOX.width * m.startScale, top, m) - FULL_VIEWBOX.width) < 1e-6);
    // Within HOME_LINK_PAD px of the word still counts; further off is nothing.
    assert.notEqual(heroViewX(m.margin - HOME_LINK_PAD + 0.5, top, m), null);
    assert.equal(heroViewX(m.margin - HOME_LINK_PAD - 1, top, m), null, `left of the word at ${at}`);
    assert.equal(heroViewX(m.margin + 10, m.startY - HOME_LINK_PAD - 1, m), null, `above the word at ${at}`);
    assert.equal(heroViewX(m.margin + 10, m.startY + FULL_VIEWBOX.height * m.startScale + HOME_LINK_PAD + 1, m), null, `below at ${at}`);
  }
  assert.equal(heroViewX(Number.NaN, 10, dockMetrics({ width: 1440, heroHeight: 900 })), null);
});

test('the hero layer is the docked SUPH\'s, fed seven letters: SAY HELLO\'s model, frame for frame', () => {
  const fx = heroFx();
  assert.equal(fx.params, HELLO_MOTION, 'the same values, not rescaled');
  const hello = createHelloSim(HERO_GLYPHS, HELLO_MOTION);
  for (let f = 1; f <= 150; f++) {
    const x = -80 + ((centre(6) + 80) * Math.min(f, 90)) / 90; // Sweep S -> N, then rest on N's centre.
    fx.hover(x);
    hello.hover(x);
    fx.advance(1 / 60);
    hello.advance(1 / 60);
    const a = fx.read();
    hello.read().forEach((h, i) => {
      // === rather than assert.equal: a lean of -0 (cursor dead on a centre) combines to 0.
      for (const key of ['y', 'sx', 'sy', 'skew']) assert.ok(a[i][key] === h[key], `${key} of ${LETTERS[i].char} at frame ${f}: ${a[i][key]} vs ${h[key]}`);
    });
  }
  const s = fx.read();
  const n = LETTERS.length - 1;
  assert.ok(s[n].sy > 1.03, `N bulges under the cursor (${s[n].sy.toFixed(3)})`);
  assert.ok(s[n - 1].skew > 1, `A leans away (${s[n - 1].skew.toFixed(2)})`);
});

test('hover moves the hero letters only while enabled; disabling (a scroll) lets go and settles to exact rest', () => {
  const fx = createDockEffects({ glyphs: HERO_GLYPHS });
  fx.hover(centre(3));
  assert.equal(fx.settled, true, 'not enabled: ignored, the loop stays asleep');
  assert.deepEqual(fx.transforms(), REST);

  fx.setEnabled(true);
  fx.hover(centre(3));
  assert.equal(fx.settled, false);
  run(fx, { seconds: 0.2 });
  assert.notDeepEqual(fx.transforms(), REST);
  fx.setEnabled(false); // The page started to scroll.
  assert.equal(fx.settled, false, 'springs back');
  const t = run(fx);
  assert.ok(t < 2, `settles in ${t.toFixed(2)} s`);
  assert.deepEqual(fx.transforms(), REST);
  fx.hover(centre(3));
  assert.equal(fx.settled, true, 'scrolled: input stays ignored');

  const reduced = heroFx();
  reduced.setReduced(true);
  reduced.hover(centre(2));
  assert.equal(reduced.settled, true, 'reduced motion: nothing moves');
  assert.deepEqual(reduced.transforms(), REST);
});

test('hero and dock states for the same letter compose into one inner transform', () => {
  const rest = { y: 0, sx: 1, sy: 1, skew: 0 };
  assert.equal(dockFxTransform(317, addState(addState({ ...rest }, rest), rest)), '', 'both at rest: no attribute');
  const a = { y: 2, sx: 0.98, sy: 1.04, skew: 1.5 };
  const b = { y: 1, sx: 1.02, sy: 0.9, skew: -0.5 };
  const c = addState(addState({ ...rest }, a), b);
  assert.deepEqual(c, { y: 3, sx: 0.98 * 1.02, sy: 1.04 * 0.9, skew: 1 });
  assert.equal(dockFxTransform(317, c), dockFxTransform(317, { y: 3, sx: 0.98 * 1.02, sy: 1.04 * 0.9, skew: 1 }));
});
