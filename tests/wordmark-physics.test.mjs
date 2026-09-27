import test from 'node:test';
import assert from 'node:assert/strict';
import { LETTERS, COMPACT_VIEWBOX, FULL_VIEWBOX } from '../src/wordmark/lettering.js';
import { MOTION } from '../src/wordmark/motion.js';
import { createWordmarkSim, ease, softLimit, MAX_FRAME, STEP } from '../src/wordmark/physics.js';
import { dockMetrics, dockTransform } from '../src/wordmark/geometry.js';

const KEEP = 4;
const SUPH = [0, 1, 2, 3];
const IAN = [4, 5, 6];
const FULL_RIGHT = LETTERS[6].x + LETTERS[6].width; // 1654
const COMPACT_RIGHT = LETTERS[3].x + LETTERS[3].width; // 1040
const PISTON_TRAVEL = FULL_RIGHT - COMPACT_RIGHT;
const OVERSHOOT = 0.06; // Allowed overshoot, as a fraction of the distance travelled.
const SETTLE_BUDGET = 3; // Seconds for a full step change to come completely to rest.

const make = (params = MOTION) => createWordmarkSim({ letters: LETTERS, keep: KEEP, params });

/** Steps like a display at `fps`, calling onFrame(state, t) after each frame. Returns elapsed time at rest. */
function runUntilSettled(sim, { fps = 60, max = 10, onFrame } = {}) {
  const dt = 1 / fps;
  for (let frame = 1; frame <= max * fps; frame++) {
    sim.advance(dt);
    const state = sim.read();
    onFrame?.(state, frame * dt, sim);
    if (sim.settled) return frame * dt;
  }
  return Infinity;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function assertFullLayout(sim) {
  const s = sim.read();
  const nodes = sim.nodes;
  LETTERS.forEach((letter, i) => {
    assert.ok(Math.abs(s.letters[i].x - letter.x) < 0.5, `${letter.char} x ${s.letters[i].x} != ${letter.x}`);
    assert.ok(Math.abs(s.letters[i].sx - 1) < 0.005, `${letter.char} sx ${s.letters[i].sx}`);
    assert.ok(Math.abs(s.letters[i].sy - 1) < 0.005, `${letter.char} sy ${s.letters[i].sy}`);
    assert.equal(s.letters[i].skew, 0);
    assert.equal(s.letters[i].opacity, 1);
  });
  assert.ok(Math.abs(nodes.at(-1) - FULL_RIGHT) < 0.5, `right edge ${nodes.at(-1)}`);
  assert.equal(s.dock, 0);
}

function assertCompactLayout(sim) {
  const s = sim.read();
  for (const i of SUPH) {
    const letter = LETTERS[i];
    assert.ok(Math.abs(s.letters[i].x - letter.compactX) < 0.5, `${letter.char} x ${s.letters[i].x} != ${letter.compactX}`);
    assert.ok(Math.abs(s.letters[i].sx - 1) < 0.005, `${letter.char} sx ${s.letters[i].sx}`);
    assert.ok(Math.abs(s.letters[i].sy - 1) < 0.005, `${letter.char} sy ${s.letters[i].sy}`);
  }
  for (const i of IAN) {
    const width = s.letters[i].sx * LETTERS[i].width;
    assert.ok(width < 0.5, `${LETTERS[i].char} still ${width} units wide`);
    assert.ok(s.letters[i].opacity < 0.01, `${LETTERS[i].char} opacity ${s.letters[i].opacity}`);
  }
  const hRight = s.letters[3].x + s.letters[3].sx * LETTERS[3].width;
  assert.ok(Math.abs(hRight - COMPACT_RIGHT) < 0.5, `H right edge ${hRight}`);
  assert.ok(Math.abs(hRight - LETTERS[0].x - (COMPACT_VIEWBOX.width - 2 * LETTERS[0].x)) < 0.5);
  assert.equal(s.dock, 1);
}

test('layout constants match the traced glyphs', () => {
  assert.equal(FULL_RIGHT + LETTERS[0].x, FULL_VIEWBOX.width);
  assert.equal(COMPACT_RIGHT + LETTERS[0].x, COMPACT_VIEWBOX.width);
  SUPH.forEach((i) => assert.equal(LETTERS[i].compactX, LETTERS[i].x));
});

test('p = 0 at rest is exactly the full SUPHIAN layout', () => {
  const sim = make();
  sim.snap(0);
  assert.ok(sim.settled);
  assertFullLayout(sim);

  // Also reached dynamically, from the docked state.
  const moving = make();
  moving.snap(1);
  moving.setTarget(0);
  assert.ok(Number.isFinite(runUntilSettled(moving)));
  assertFullLayout(moving);
});

test('p = 1 at rest is exactly the compact SUPH layout', () => {
  const sim = make();
  sim.snap(0);
  sim.setTarget(1);
  assert.ok(Number.isFinite(runUntilSettled(sim)));
  assertCompactLayout(sim);

  const snapped = make();
  snapped.snap(1);
  assertCompactLayout(snapped);
});

test('a round trip 0 -> 1 -> 0 settles back to the start', () => {
  const sim = make();
  sim.snap(0);
  sim.setTarget(0.45);
  runUntilSettled(sim, { max: 0.3 }); // Interrupted mid-flight on purpose.
  sim.setTarget(1);
  runUntilSettled(sim);
  sim.setTarget(0);
  assert.ok(Number.isFinite(runUntilSettled(sim)));
  assertFullLayout(sim);
});

test('mid-scroll rest: every letter is squeezed a little, S included, and I A N stay ordered', () => {
  const sim = make();
  sim.snap(0.5);
  const s = sim.read();
  for (const i of SUPH) {
    assert.ok(s.letters[i].sx < 0.99 && s.letters[i].sx > 0.85, `${LETTERS[i].char} sx ${s.letters[i].sx}`);
    assert.ok(s.letters[i].sy > 1, `${LETTERS[i].char} should bulge, sy ${s.letters[i].sy}`);
  }
  assert.ok(s.letters[0].x < LETTERS[0].x, 'the left edge gives a little too');
  const nodes = sim.nodes;
  for (let i = 0; i < nodes.length - 1; i++) assert.ok(nodes[i + 1] >= nodes[i] - 1e-9);
});

function storm(seed, params, seconds = 25) {
  const rand = mulberry32(seed);
  const sim = make(params);
  sim.snap(rand());
  let t = 0;
  let frames = 0;
  while (t < seconds) {
    const roll = rand();
    if (roll < 0.25) sim.setTarget(rand()); // Jump anywhere (keyboard, anchor link).
    else if (roll < 0.35) sim.setTarget(rand() < 0.5 ? 0 : 1);
    else if (roll < 0.8) sim.setTarget(Math.min(1, Math.max(0, sim.target + (rand() - 0.5) * 0.2))); // Wheel ticks.
    const dt = rand() < 0.02 ? 5 + rand() * 30 : rand() < 0.1 ? rand() * 0.25 : 1 / (30 + rand() * 150);
    sim.advance(dt);
    t += Math.min(dt, MAX_FRAME);
    frames++;
    const s = sim.read();
    const nodes = sim.nodes;
    const minSx = params.minScaleX;
    for (let j = 0; j < nodes.length; j++) {
      assert.ok(Number.isFinite(nodes[j]), `node ${j} not finite (frame ${frames})`);
      assert.ok(Number.isFinite(sim.velocities[j]), `velocity ${j} not finite`);
    }
    assert.ok(Number.isFinite(s.dock) && Number.isFinite(s.dockRaw));
    s.letters.forEach((l, i) => {
      for (const key of ['x', 'sx', 'sy', 'skew', 'opacity']) assert.ok(Number.isFinite(l[key]), `${key} of ${i} not finite`);
      assert.ok(nodes[i + 1] - nodes[i] >= -1e-6, `negative width for ${LETTERS[i].char}: ${nodes[i + 1] - nodes[i]}`);
      assert.ok(l.sx >= -1e-9 && l.opacity >= 0 && l.opacity <= 1);
      assert.ok(Math.abs(l.skew) <= params.maxTilt + 1e-9);
      if (i < KEEP) assert.ok(l.sx >= minSx - 1e-6, `${LETTERS[i].char} sx ${l.sx} below clamp ${minSx}`);
    });
  }
  return sim;
}

test('a seeded random scroll storm never produces NaN, negative widths or SUPH below the clamp', () => {
  for (const seed of [1, 7, 42, 1337, 90210]) storm(seed, MOTION);
});

test('the guardrails hold under extreme tuning too', () => {
  const extremes = [
    { stiffness: 100, tailStiffness: 1500, pistonStiffness: 3000, pistonMass: 5, mass: 0.2, damping: 0.2, drag: 0, yieldTime: 0.8, inertia: 0.6 },
    { stiffness: 2000, tailStiffness: 50, anchorStiffness: 2500, pistonStiffness: 100, tailMass: 0.1, damping: 1.2, drag: 15, yieldTime: 0.02 },
    { squeeze: 0.2, stiffness: 100, anchorStiffness: 100, damping: 0.2, drag: 0, dockDamping: 0.3, dockFrequency: 4, tilt: 6, maxTilt: 15 },
  ];
  extremes.forEach((overrides, n) => storm(100 + n, { ...MOTION, ...overrides }, 15));
});

test(`overshoot stays within ${OVERSHOOT * 100}% of the distance after a step change`, () => {
  // Down: hero -> header in one frame (keyboard End).
  const down = make();
  down.snap(0);
  down.setTarget(1);
  let qMax = -Infinity;
  let dockMax = -Infinity;
  const minSx = SUPH.map(() => Infinity);
  const reboundSx = SUPH.map(() => 0);
  runUntilSettled(down, {
    onFrame: (s) => {
      qMax = Math.max(qMax, s.dockRaw);
      dockMax = Math.max(dockMax, s.dock);
      SUPH.forEach((i) => {
        if (s.letters[i].sx < minSx[i]) { minSx[i] = s.letters[i].sx; reboundSx[i] = s.letters[i].sx; }
        reboundSx[i] = Math.max(reboundSx[i], s.letters[i].sx);
      });
    },
  });
  assert.ok(qMax > 1, 'the dock spring should overshoot a little');
  assert.ok(qMax <= 1 + OVERSHOOT, `dock overshoot ${qMax}`);
  assert.ok(dockMax <= 1 + MOTION.dockOvershoot + 1e-9, `rendered dock overshoot ${dockMax}`);
  SUPH.forEach((i) => {
    assert.ok(minSx[i] < 0.95, `${LETTERS[i].char} should visibly squash on a step (min sx ${minSx[i]})`);
    assert.ok(reboundSx[i] <= 1 + OVERSHOOT, `${LETTERS[i].char} rebound ${reboundSx[i]}`);
  });

  // Up: header -> hero in one frame.
  const up = make();
  up.snap(1);
  up.setTarget(0);
  let qMin = Infinity;
  let dockMin = Infinity;
  let pistonMax = -Infinity;
  const upMax = SUPH.map(() => 0);
  runUntilSettled(up, {
    onFrame: (s, t, sim) => {
      qMin = Math.min(qMin, s.dockRaw);
      dockMin = Math.min(dockMin, s.dock);
      pistonMax = Math.max(pistonMax, sim.nodes.at(-1));
      SUPH.forEach((i) => { upMax[i] = Math.max(upMax[i], s.letters[i].sx); });
    },
  });
  assert.ok(qMin >= -OVERSHOOT, `dock overshoot ${qMin}`);
  assert.ok(dockMin >= -MOTION.dockOvershoot, `rendered dock overshoot ${dockMin}`);
  assert.ok(pistonMax <= FULL_RIGHT + OVERSHOOT * PISTON_TRAVEL, `piston flew to ${pistonMax}`);
  SUPH.forEach((i) => assert.ok(upMax[i] <= 1 + OVERSHOOT, `${LETTERS[i].char} stretched to ${upMax[i]}`));
});

test(`a step change comes completely to rest within ${SETTLE_BUDGET}s`, () => {
  for (const [from, to] of [[0, 1], [1, 0], [0, 0.5], [0.5, 1]]) {
    const sim = make();
    sim.snap(from);
    sim.setTarget(to);
    const elapsed = runUntilSettled(sim);
    assert.ok(elapsed <= SETTLE_BUDGET, `${from} -> ${to} took ${elapsed}s`);
    assert.equal(sim.advance(1 / 60), false, 'a settled sim does no work');
  }
});

test('fast flicks squash harder than slow scrolling', () => {
  const minSuph = (duration) => {
    const sim = make();
    sim.snap(0);
    let min = Infinity;
    for (let t = 0; t < duration + 2; t += 1 / 60) {
      sim.setTarget(ease(Math.min(1, t / duration)));
      sim.advance(1 / 60);
      const s = sim.read();
      for (const i of SUPH) min = Math.min(min, s.letters[i].sx);
    }
    return min;
  };
  const slow = minSuph(3);
  const flick = minSuph(0.2);
  assert.ok(slow > 0.9 && slow < 0.98, `slow scroll squeeze ${slow}`);
  assert.ok(flick < slow - 0.1, `flick ${flick} should squash well past slow ${slow}`);
});

function trajectory(fps, targetAt, seconds = 3) {
  const sim = make();
  sim.snap(0);
  const samples = [];
  const frames = Math.round(seconds * fps);
  const every = fps / 12; // Sample on a 1/12 s grid both rates land on exactly.
  for (let k = 0; k < frames; k++) {
    sim.setTarget(targetAt(k / fps));
    sim.advance(1 / fps);
    if ((k + 1) % every === 0) {
      const s = sim.read();
      samples.push({ nodes: sim.nodes, q: s.dockRaw, opacity: s.letters.map((l) => l.opacity), sx: s.letters.map((l) => l.sx) });
    }
  }
  return samples;
}

function compare(a, b, tol) {
  let worst = 0;
  a.forEach((sa, n) => {
    const sb = b[n];
    sa.nodes.forEach((x, j) => { worst = Math.max(worst, Math.abs(x - sb.nodes[j])); });
    assert.ok(Math.abs(sa.q - sb.q) <= tol.q, `dock differs at sample ${n}: ${sa.q} vs ${sb.q}`);
    sa.sx.forEach((v, j) => assert.ok(Math.abs(v - sb.sx[j]) <= tol.sx, `sx ${j} differs at sample ${n}`));
    sa.opacity.forEach((v, j) => assert.ok(Math.abs(v - sb.opacity[j]) <= tol.opacity, `opacity ${j} differs at sample ${n}`));
  });
  assert.ok(worst <= tol.x, `positions differ by up to ${worst} units`);
}

test('60 Hz and 144 Hz displays produce the same motion', () => {
  // Scroll changes on frame boundaries both rates share: bit-for-bit identical
  // physics, because the sim runs whole fixed steps whatever the display does.
  const stepped = (t) => {
    const twelfths = Math.floor(t * 12 + 1e-9);
    return twelfths < 1 ? 0 : twelfths < 6 ? 0.4 : twelfths < 18 ? 1 : 0;
  };
  compare(trajectory(60, stepped), trajectory(144, stepped), { x: 1e-9, q: 1e-12, sx: 1e-9, opacity: 1e-9 });

  // A continuous scroll read at each display's own frames. The physics is the
  // same; a 60 Hz display just sees each scroll position up to 16.7 ms later,
  // so during a fast 0.6 s scroll the trails differ by a few units (~1% of
  // the word) and converge again.
  const smooth = (t) => ease(Math.min(1, Math.max(0, (t - 0.1) / 0.6))) * (t < 1.6 ? 1 : 1 - ease(Math.min(1, (t - 1.6) / 0.5)));
  compare(trajectory(60, smooth), trajectory(144, smooth), { x: 25, q: 0.02, sx: 0.05, opacity: 0.06 });
});

test('a huge frame (tab switch) is clamped and nothing explodes', () => {
  const sim = make();
  sim.snap(0);
  sim.setTarget(1);
  sim.advance(1 / 60);
  const before = sim.time;
  sim.advance(45); // 45 s in a background tab.
  assert.ok(sim.time - before <= MAX_FRAME + STEP, `simulated ${sim.time - before}s in one frame`);
  for (const x of sim.nodes) assert.ok(Number.isFinite(x));
  sim.advance(Number.NaN);
  sim.advance(-3);
  sim.advance(Infinity);
  for (const x of sim.nodes) assert.ok(Number.isFinite(x));
  assert.ok(Number.isFinite(runUntilSettled(sim)));
  assertCompactLayout(sim);
});

test('non-finite targets are ignored safely', () => {
  const sim = make();
  sim.snap(Number.NaN);
  assertFullLayout(sim);
  sim.setTarget(Infinity);
  runUntilSettled(sim);
  for (const x of sim.nodes) assert.ok(Number.isFinite(x));
});

test('dock geometry lands exactly on the header position measure() computes', () => {
  const metrics = dockMetrics({ width: 1440, heroHeight: 900 });
  assert.equal(dockTransform(metrics, 1), `translate(${metrics.endX} ${metrics.endY}) scale(${Math.round(metrics.endScale * 1e6) / 1e6})`);
  assert.equal(metrics.endX, 1440 - 32 - MOTION.logoWidth);
  const mobile = dockMetrics({ width: 390, heroHeight: 844 });
  assert.equal(mobile.logoWidth, MOTION.mobileLogoWidth);
  assert.equal(softLimit(1, 0.01, 0.0025), 1);
  assert.equal(softLimit(0, 0.01, 0.0025), 0);
  assert.ok(softLimit(1.5, 0.01, 0.0025) <= 1.01);
  assert.ok(softLimit(-0.5, 0.01, 0.0025) >= -0.0025);
});
