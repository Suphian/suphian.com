/**
 * SAY HELLO motion model tests (node:test, no DOM):
 *   node --test src/sayhello/
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { LETTERS } from './lettering.js';
import { HELLO_MOTION, createHelloSim, helloTransform, landDelays, wordStarts } from './motion.js';

const REST = LETTERS.map((l) => `translate(${l.x} 0)`);
const transforms = (sim) => LETTERS.map((_, i) => sim.transform(i));

/** Runs the sim at a fixed display rate until it settles (or the time limit). Returns samples. */
function run(sim, { fps = 60, seconds = 6, onFrame } = {}) {
  const samples = [];
  const frames = Math.round(seconds * fps);
  for (let f = 1; f <= frames; f++) {
    sim.advance(1 / fps);
    samples.push({ t: f / fps, letters: sim.read().map((l) => ({ ...l })) });
    onFrame?.(f / fps, sim);
    if (sim.settled) break;
  }
  return samples;
}

const entrance = () => {
  const sim = createHelloSim(LETTERS);
  sim.arm();
  sim.land();
  return sim;
};

test('the static layout is exactly the markup layout', () => {
  const sim = createHelloSim(LETTERS);
  assert.equal(sim.settled, true);
  assert.deepEqual(transforms(sim), REST);
  assert.equal(helloTransform(LETTERS[0], { y: 0, sx: 1, sy: 1, skew: 0 }), REST[0]);
});

test('entrance settles to the exact rest layout', () => {
  const sim = entrance();
  const samples = run(sim);
  assert.equal(sim.settled, true, 'settled within 6 s');
  assert.ok(samples.at(-1).t < 2.6, `settles in ${samples.at(-1).t.toFixed(2)} s`);
  assert.deepEqual(transforms(sim), REST);
  assert.ok(sim.read().every((l) => l.opacity === 1));
  assert.equal(sim.advance(1 / 60), false, 'sleeps once settled');
});

test('overshoot is bounded and nothing goes non-finite', () => {
  const P = HELLO_MOTION;
  const sim = entrance();
  let maxY = 0;
  let minSy = Infinity;
  let maxSyAfterLanding = 0;
  let maxSkew = 0;
  run(sim, {
    onFrame(t, s) {
      const landed = s.landedAt;
      s.read().forEach((l, i) => {
        for (const v of Object.values(l)) assert.ok(Number.isFinite(v), `finite at t=${t}`);
        assert.ok(l.y >= 0);
        maxY = Math.max(maxY, l.y);
        minSy = Math.min(minSy, l.sy);
        if (landed[i] >= 0 && l.y === 0) maxSyAfterLanding = Math.max(maxSyAfterLanding, l.sy);
        maxSkew = Math.max(maxSkew, Math.abs(l.skew));
        assert.ok(Math.abs(l.sx * l.sy - 1) < 0.1 || l.sy === 1 / P.maxBulge, 'area is kept (within the bulge cap)');
      });
    },
  });
  assert.ok(maxY <= P.dropHeight + 1e-9, 'never above the drop point');
  assert.ok(minSy >= 1 / P.maxBulge - 1e-9, `squash capped (${minSy.toFixed(3)})`);
  // The approved landing bottoms out at sy 0.921; this only catches a landing that lost its squash.
  assert.ok(minSy < 0.93, `landing visibly squashes (${minSy.toFixed(3)})`);
  assert.ok(maxSyAfterLanding < 1.1, `rebound overshoot under 10% (${maxSyAfterLanding.toFixed(3)})`);
  assert.ok(maxSkew <= P.maxTilt + 1e-9, `lean capped (${maxSkew.toFixed(2)} deg)`);

  // Hostile frame times never break it.
  const rough = entrance();
  for (const dt of [NaN, -1, Infinity, 5, 0, 1e-9, 0.5]) rough.advance(dt);
  run(rough);
  assert.equal(rough.settled, true);
  assert.deepEqual(transforms(rough), REST);
});

test('letters land in reading order, SAY before HELLO', () => {
  assert.deepEqual(wordStarts(LETTERS), [3], 'one word break, before H');
  const delays = landDelays(LETTERS);
  const sim = entrance();
  run(sim);
  const landed = sim.landedAt;
  assert.ok(landed.every((t) => t > 0));
  for (let i = 1; i < landed.length; i++) assert.ok(landed[i] > landed[i - 1], `${LETTERS[i].char} lands after ${LETTERS[i - 1].char}`);
  const within = delays[2] - delays[1];
  const across = delays[3] - delays[2];
  assert.ok(across > within * 1.8, 'a clear pause between the words');
  assert.ok(landed[3] > landed[2] + 0.1, 'Y is down before H lands');
  // A letter still waiting its turn is invisible; nothing pops in mid-air.
  const early = entrance();
  early.advance(0.05);
  assert.equal(early.read()[7].opacity, 0);
  assert.ok(early.read()[0].opacity < 0.5);
});

test('frame-rate independent: 60 Hz and 144 Hz agree', () => {
  const at60 = entrance();
  const at144 = entrance();
  // Compare at times both rates reach exactly: k/12 s is 5k frames at 60 Hz and
  // 12k frames at 144 Hz. Advance by whole frame counts, not accumulated time,
  // so neither sim overshoots the probe (mid-fall, 4 ms is several units of y).
  const probe = [1, 3, 5, 7, 11, 16];
  let f60 = 0;
  let f144 = 0;
  for (const k of probe) {
    const t = k / 12;
    for (; f60 < k * 5; f60++) at60.advance(1 / 60);
    for (; f144 < k * 12; f144++) at144.advance(1 / 144);
    const a = at60.read();
    const b = at144.read();
    a.forEach((l, i) => {
      assert.ok(Math.abs(l.y - b[i].y) < 2, `y at ${t}s`);
      assert.ok(Math.abs(l.sy - b[i].sy) < 0.01, `sy at ${t}s`);
      assert.ok(Math.abs(l.skew - b[i].skew) < 0.15, `skew at ${t}s`);
    });
  }
  assert.deepEqual(at60.landedAt.map((t) => Math.round(t * 480)), at144.landedAt.map((t) => Math.round(t * 480)));
});

test('press squishes, release pops past rest, then back to the exact rest layout', () => {
  const sim = createHelloSim(LETTERS);
  sim.press(true);
  run(sim, { seconds: 1.5 });
  const held = sim.read();
  held.forEach((l) => {
    assert.ok(Math.abs(l.sy - HELLO_MOTION.pressDepth) < 0.01, 'held at press depth');
    assert.ok(l.sx > 1.05, 'widens while squashed');
  });
  assert.equal(sim.settled, true, 'a held press settles at press depth, so the render loop sleeps');
  assert.equal(sim.advance(1 / 60), false, 'nothing moves while held still');
  sim.press(false);
  assert.equal(sim.settled, false, 'release wakes it');
  let peak = 0;
  run(sim, { onFrame: (t, s) => { peak = Math.max(peak, s.read()[0].sy); } });
  assert.ok(peak > 1.02 && peak < 1.1, `pops past rest (${peak.toFixed(3)})`);
  assert.equal(sim.settled, true);
  assert.deepEqual(transforms(sim), REST);

  const tapped = createHelloSim(LETTERS);
  tapped.tap();
  let deepest = 1;
  run(tapped, { onFrame: (t, s) => { deepest = Math.min(deepest, s.read()[0].sy); } });
  assert.ok(deepest < 0.93, 'a keyboard tap visibly squishes');
  assert.equal(tapped.settled, true);
  assert.deepEqual(transforms(tapped), REST);
});

test('hover bulges and leans letters away from the cursor, then lets go', () => {
  const sim = createHelloSim(LETTERS);
  const e = LETTERS[4];
  sim.hover(e.x + e.width / 2); // Right over the E.
  run(sim);
  assert.equal(sim.settled, true, 'rests while the cursor is still');
  const s = sim.read();
  assert.ok(s[4].sy > 1.03 && Math.abs(s[4].skew) < 0.3, 'E bulges upright');
  assert.ok(s[3].skew > 1, 'H leans left, away');
  assert.ok(s[5].skew < -1, 'L leans right, away');
  assert.ok(Math.abs(s[0].sy - 1) < 0.005, 'S barely notices');
  sim.hover(null);
  run(sim);
  assert.equal(sim.settled, true);
  assert.deepEqual(transforms(sim), REST);
});
