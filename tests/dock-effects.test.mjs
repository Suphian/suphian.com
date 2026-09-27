/**
 * Docked SUPH hover and press (src/wordmark/dockfx.js), node:test, no DOM:
 *   node --test tests/
 * The touch layer is SAY HELLO's model (src/sayhello/motion.js, covered by its
 * own tests) used unchanged; these cover how it is fed, gated, and composed
 * under the chain, and the home link box it is driven from.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { LETTERS, COMPACT_VIEWBOX } from '../src/wordmark/lettering.js';
import { MOTION } from '../src/wordmark/motion.js';
import { createWordmarkSim, letterTransform } from '../src/wordmark/physics.js';
import { HOME_LINK_PAD, dockMetrics, homeLinkBox, homeLinkViewX } from '../src/wordmark/geometry.js';
import { DOCK_GLYPHS, acceptsHover, acceptsPress, createDockEffects, dockFxTransform } from '../src/wordmark/dockfx.js';
import { HELLO_MOTION, createHelloSim, helloTransform } from '../src/sayhello/motion.js';
import { compose, flattenPath, parseTransform } from './lib/raster.mjs';

const REST = ['', '', '', '']; // No transform attribute on any inner group.
const [S, U, P, H] = [0, 1, 2, 3];
const centre = (i) => DOCK_GLYPHS[i].x + DOCK_GLYPHS[i].width / 2;
const close = (a, b, tol) => a.every((v, i) => Math.abs(v - b[i]) <= tol);

/** Steps like a display at `fps` until settled (or the time limit). Returns the elapsed time at rest. */
function run(fx, { fps = 60, seconds = 6, onFrame } = {}) {
  for (let f = 1; f <= Math.round(seconds * fps); f++) {
    fx.advance(1 / fps);
    onFrame?.(f / fps);
    if (fx.settled) return f / fps;
  }
  return Infinity;
}

function dockedFx() {
  const fx = createDockEffects();
  fx.setDocked(true);
  return fx;
}

/** Outer transforms of S U P H with the chain at its docked rest (p = 1). */
function dockedChain() {
  const sim = createWordmarkSim({ letters: LETTERS, keep: 4, params: MOTION });
  sim.snap(1);
  return sim.read().letters.slice(0, 4).map((l) => letterTransform(l));
}

test('the touch layer is fed S U P H in compact-viewBox units, with SAY HELLO\'s approved values', () => {
  assert.deepEqual(LETTERS.slice(0, 4).map((l) => l.char), ['S', 'U', 'P', 'H']);
  assert.deepEqual(DOCK_GLYPHS, LETTERS.slice(0, 4).map((l) => ({ x: l.compactX, width: l.width })));
  assert.equal(createDockEffects().params, HELLO_MOTION, 'the same object: not copied, not rescaled');
});

test('at rest the inner transform is identity, so the docked layout is exactly the chain\'s', () => {
  const fx = createDockEffects();
  assert.deepEqual(fx.transforms(), REST);
  assert.equal(dockFxTransform(317, { y: 0, sx: 1, sy: 1, skew: 0, opacity: 1 }), '');
  const outer = dockedChain();
  outer.forEach((t, i) => {
    // The chain alone draws the compact layout: translate(x 0).
    assert.ok(close(parseTransform(t), [1, 0, 0, 1, DOCK_GLYPHS[i].x, 0], 1e-9), `${'SUPH'[i]} docked at x ${DOCK_GLYPHS[i].x}`);
    // An inner group with no transform composes to exactly that.
    assert.ok(close(compose(parseTransform(t), parseTransform(fx.transforms()[i])), parseTransform(t), 0));
  });

  // After hover, press and let go it lands on exactly nothing again.
  const used = dockedFx();
  used.hover(centre(P));
  used.press(true);
  run(used, { seconds: 0.3 });
  assert.notDeepEqual(used.transforms(), REST);
  used.leave();
  assert.ok(Number.isFinite(run(used)));
  assert.deepEqual(used.transforms(), REST);
});

test('hover and press compose under the chain: SAY HELLO\'s transform, nothing translated twice', () => {
  const fx = dockedFx();
  fx.hover(centre(U));
  fx.press(true);
  run(fx, { seconds: 0.12 }); // Mid-motion: lifted, squashed and leaning at once.
  const states = fx.read().map((s) => ({ ...s }));
  const inner = fx.transforms();
  dockedChain().forEach((outer, i) => {
    assert.notEqual(inner[i], '');
    const composed = compose(parseTransform(outer), parseTransform(inner[i]));
    // What SAY HELLO itself would draw for this letter at its docked x (helloTransform rounds to 1e-4).
    const hello = parseTransform(helloTransform(DOCK_GLYPHS[i], states[i]));
    assert.ok(close(composed, hello, 1e-3), `${'SUPH'[i]}: ${composed} vs ${hello}`);
  });
});

test('hover moves the letters only while docked', () => {
  const fx = createDockEffects();
  fx.hover(centre(U));
  fx.press(true);
  fx.tap();
  assert.equal(fx.settled, true, 'undocked: input is ignored and the loop stays asleep');
  assert.equal(fx.advance(1 / 60), false);
  assert.equal(fx.pressed, false);
  assert.deepEqual(fx.transforms(), REST);

  fx.setDocked(true);
  assert.equal(fx.settled, true, 'docking alone moves nothing');
  fx.hover(centre(U));
  assert.equal(fx.settled, false, 'docked: hover wakes it');
  run(fx);
  assert.equal(fx.settled, true, 'rests while the cursor is still, so the loop can sleep');
  const s = fx.read();
  assert.ok(s[U].sy > 1.03 && Math.abs(s[U].skew) < 0.3, `U bulges upright under the cursor (${s[U].sy.toFixed(3)})`);
  assert.ok(s[S].skew > 1, `S leans left, away (${s[S].skew.toFixed(2)})`);
  assert.ok(s[P].skew < -1, `P leans right, away (${s[P].skew.toFixed(2)})`);
  assert.ok(s[H].sy < s[P].sy && Math.abs(s[H].skew) < Math.abs(s[P].skew), 'H, further off, feels it less');
});

test('the touch layer is SAY HELLO\'s model: identical input gives identical motion', () => {
  const fx = dockedFx();
  const hello = createHelloSim(DOCK_GLYPHS, HELLO_MOTION);
  const both = (fn) => { fn(fx); fn(hello); };
  const left = -60;
  const right = COMPACT_VIEWBOX.width + 60;
  for (let f = 1; f <= 240; f++) {
    const t = f / 60;
    if (t <= 1.2) both((sim) => sim.hover(left + ((right - left) * t) / 1.2)); // Sweep S -> H.
    if (f === 80) both((sim) => sim.hover(null));
    if (f === 100) both((sim) => sim.press(true));
    if (f === 140) both((sim) => sim.press(false));
    fx.advance(1 / 60);
    hello.advance(1 / 60);
    const a = fx.read();
    hello.read().forEach((h, i) => {
      for (const key of ['y', 'sx', 'sy', 'skew']) assert.equal(a[i][key], h[key], `${key} of ${'SUPH'[i]} at frame ${f}`);
    });
    assert.equal(fx.settled, hello.settled);
  }
});

test('undocking lets go of hover and press, and the letters settle to the exact rest', () => {
  const fx = dockedFx();
  fx.hover(centre(P));
  fx.press(true);
  run(fx, { seconds: 0.25 });
  assert.equal(fx.pressed, true);
  fx.setDocked(false); // Scrolled back up, or the click scrolled the page to the top.
  assert.equal(fx.pressed, false, 'the press is released');
  assert.equal(fx.settled, false, 'and the letters spring back');
  const t = run(fx);
  assert.ok(t < 2, `settles in ${t.toFixed(2)} s`);
  assert.deepEqual(fx.transforms(), REST);
  assert.equal(fx.advance(1 / 60), false, 'then sleeps');

  fx.hover(centre(U));
  fx.press(true);
  fx.tap();
  assert.equal(fx.settled, true, 'undocked input stays ignored');
  fx.setDocked(true);
  assert.equal(fx.settled, true, 're-docking starts from rest');

  // A keyboard tap cut short by the scroll it started settles too.
  const tapped = dockedFx();
  tapped.tap();
  tapped.advance(1 / 60);
  tapped.setDocked(false);
  assert.ok(Number.isFinite(run(tapped)));
  assert.deepEqual(tapped.transforms(), REST);
});

test('press squishes, release pops past rest and returns to the exact rest; a keyboard tap too', () => {
  const fx = dockedFx();
  fx.press(true);
  run(fx, { seconds: 1.5 });
  fx.read().forEach((l) => {
    assert.ok(Math.abs(l.sy - HELLO_MOTION.pressDepth) < 0.01, 'held at press depth');
    assert.ok(l.sx > 1.05, 'widens while squashed');
  });
  assert.equal(fx.settled, true, 'a held press settles, so the loop sleeps while held');
  assert.equal(fx.advance(1 / 60), false);
  fx.press(false);
  assert.equal(fx.settled, false, 'release wakes it');
  let peak = 0;
  run(fx, { onFrame: () => { peak = Math.max(peak, fx.read()[S].sy); } });
  assert.ok(peak > 1.02 && peak < 1.1, `pops past rest (${peak.toFixed(3)})`);
  assert.equal(fx.settled, true);
  assert.deepEqual(fx.transforms(), REST);

  const tapped = dockedFx();
  tapped.tap();
  let deepest = 1;
  run(tapped, { onFrame: () => { deepest = Math.min(deepest, tapped.read()[S].sy); } });
  assert.ok(deepest < 0.93, `a keyboard tap visibly squishes (${deepest.toFixed(3)})`);
  assert.deepEqual(tapped.transforms(), REST);

  const idle = dockedFx();
  idle.press(false);
  idle.leave();
  assert.equal(idle.settled, true, 'a stray pointerup or leave does not wake the loop');
});

test('pointer rules are SAY HELLO\'s: hover for a fine mouse, press for the primary button', () => {
  const mouse = (extra = {}) => ({ pointerType: 'mouse', button: 0, ctrlKey: false, ...extra });
  assert.equal(acceptsHover(mouse(), true), true);
  assert.equal(acceptsHover(mouse(), false), false, 'no fine, hovering pointer');
  assert.equal(acceptsHover({ pointerType: 'touch' }, true), false);
  assert.equal(acceptsHover({ pointerType: 'pen' }, true), false);
  assert.equal(acceptsPress(mouse()), true);
  assert.equal(acceptsPress(mouse({ button: 1 })), false, 'middle button');
  assert.equal(acceptsPress(mouse({ button: 2 })), false, 'right button');
  assert.equal(acceptsPress(mouse({ ctrlKey: true })), false, 'macOS ctrl+click');
  assert.equal(acceptsPress({ pointerType: 'touch', button: 0 }), true);
  assert.equal(acceptsPress({ pointerType: 'pen', button: 0 }), true);
});

test('reduced motion: no hover or press motion', () => {
  const fx = dockedFx();
  fx.setReduced(true);
  assert.equal(fx.active, false);
  fx.hover(centre(U));
  fx.press(true);
  fx.tap();
  assert.equal(fx.settled, true);
  assert.equal(fx.advance(1 / 60), false);
  assert.deepEqual(fx.transforms(), REST);

  // Switched on mid-motion: straight to rest.
  const moving = dockedFx();
  moving.hover(centre(U));
  moving.press(true);
  run(moving, { seconds: 0.2 });
  moving.setReduced(true);
  assert.equal(moving.settled, true);
  assert.equal(moving.pressed, false);
  assert.deepEqual(moving.transforms(), REST);
  moving.setReduced(false);
  moving.hover(centre(P));
  assert.equal(moving.settled, false, 'allowed again: hover works');
});

test('the home link box covers the docked SUPH at every width and maps the pointer onto the letters', () => {
  const ink = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity };
  LETTERS.slice(0, 4).forEach((l) => flattenPath(l.path).flat().forEach(([x, y]) => {
    ink.minX = Math.min(ink.minX, l.compactX + x);
    ink.maxX = Math.max(ink.maxX, l.compactX + x);
    ink.minY = Math.min(ink.minY, y);
    ink.maxY = Math.max(ink.maxY, y);
  }));
  const insets = [{}, { safeTop: 47, safeLeft: 44, safeRight: 44 }];
  for (const width of [320, 360, 390, 414, 600, 639, 640, 656, 768, 1024, 1280, 1440, 1920, 2560]) {
    for (const inset of insets) {
      const m = dockMetrics({ width, heroHeight: 900, ...inset });
      const box = homeLinkBox(m);
      const at = `${width}px${inset.safeTop ? ' with safe-area insets' : ''}`;
      assert.ok(box.left <= m.endX + ink.minX * m.endScale, `left edge covers S at ${at}`);
      assert.ok(box.left + box.width >= m.endX + ink.maxX * m.endScale, `right edge covers H at ${at}`);
      assert.ok(box.top <= m.endY + ink.minY * m.endScale, `top covers the cap height at ${at}`);
      assert.ok(box.top + box.height >= m.endY + ink.maxY * m.endScale, `bottom covers the baseline at ${at}`);
      assert.ok(box.left + box.width <= width - (inset.safeRight ?? 0) && box.top >= (inset.safeTop ?? 0), `on screen at ${at}`);
      // Pointer x: the logo's edges land on the compact viewBox's, each glyph centre on itself.
      assert.ok(Math.abs(homeLinkViewX(m.endX, box)) < 1e-9);
      assert.ok(Math.abs(homeLinkViewX(m.endX + m.logoWidth, box) - COMPACT_VIEWBOX.width) < 1e-6);
      DOCK_GLYPHS.forEach((g, i) => {
        const x = homeLinkViewX(m.endX + centre(i) * m.endScale, box);
        assert.ok(Math.abs(x - centre(i)) < 1e-6, `${'SUPH'[i]} centre maps to ${centre(i)} at ${at}`);
      });
    }
  }
  assert.equal(homeLinkBox(dockMetrics({ width: 1440, heroHeight: 900 })).width, MOTION.logoWidth + 2 * HOME_LINK_PAD);
  assert.equal(homeLinkBox(dockMetrics({ width: 390, heroHeight: 844 })).width, MOTION.mobileLogoWidth + 2 * HOME_LINK_PAD);
  assert.equal(homeLinkViewX(10, { left: 0, width: 2 * HOME_LINK_PAD }), null, 'a collapsed box gives no x');
});
