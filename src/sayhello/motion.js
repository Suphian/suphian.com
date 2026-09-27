/**
 * SAY HELLO motion: a pure, DOM-free model in the wordmark's idiom. It imports
 * in plain Node: src/sayhello/motion.test.mjs, and the QA filmstrip
 * src/sayhello/film.mjs (node src/sayhello/film.mjs -> qa/say-hello-film-*.png).
 *
 * Model. Each letter is a small soft body sitting on the baseline:
 * - Height y above the baseline, with velocity. During the entrance it falls
 *   under gravity, hits the baseline, and the impact is handed to the body as
 *   squash. A small restitution gives one short, heavy hop.
 * - Vertical scale s, a damped spring toward its target (1 at rest). Rendering
 *   is the wordmark's: area-preserving squash and stretch anchored at the
 *   baseline (sx = sy^-squash), scaled about the letter's centre so a
 *   squashed letter spreads both ways, capped by maxBulge.
 * - Lean, a damped spring in degrees toward its target (0 at rest), capped by
 *   the wordmark's maxTilt.
 *
 * Inputs only set targets or give impulses; the springs decide the motion:
 * - land(): the one-time entrance. Letters drop in S to O, SAY then HELLO,
 *   stretching as they fall, squashing on contact, rebounding.
 * - hover(x): a pointer at viewBox x. Letters near it bulge slightly and lean
 *   away from it. hover(null) lets them go.
 * - press(true / false): every letter squishes like a button, then pops back
 *   past rest on release. tap() is a press with an automatic release, for
 *   keyboard activation.
 *
 * Integration is the wordmark's: fixed 480 Hz semi-implicit Euler, wall-clock
 * frames clamped to MAX_FRAME and turned into whole steps by an accumulator,
 * so results do not depend on the display's frame rate. When everything is
 * within tolerance of its targets the sim snaps exactly onto them and reports
 * settled, so the render loop can sleep (a held press settles too, squished at
 * pressDepth); with no pointer involved that is the exact static layout
 * (transform `translate(x 0)`).
 */
import { MOTION } from '../wordmark/motion.js';
import { STEP, MAX_FRAME, BASELINE, letterTransform } from '../wordmark/physics.js';

export { BASELINE };
export const CAP = 566.67; // Median cap height in lettering units (shared with SUPHIAN).

export const HELLO_MOTION = {
  // Body: the wordmark's material.
  stiffness: MOTION.stiffness, // Squash spring, 1/s². The wordmark's S U P H rate (about 3.9 Hz).
  damping: 0.5, // Damping ratio. Between the wordmark's 0.62 and bouncy: one clear rebound, then still.
  squash: MOTION.squash, // sx = sy^-squash (0.5 keeps area constant).
  maxBulge: MOTION.maxBulge, // Cap on sy and 1 / sy (and so on sx).
  leanStiffness: 420, // Lean spring, 1/s². The wordmark's softer I A N rate, so the lean trails the squash.
  leanDamping: 0.55,
  maxTilt: MOTION.maxTilt, // Lean cap, degrees.

  // Entrance (once, on scroll into view).
  dropHeight: 240, // Units above the baseline each letter falls from (about 0.42 cap heights).
  fallTime: 0.24, // Seconds from release to contact. Short fall = heavy.
  fadeIn: 0.45, // Fraction of the drop over which a letter fades in (it never pops in mid-air).
  fallStretch: 0.07, // Vertical stretch at full fall speed, eased in by the spring.
  impactSquash: 1.5, // Impact speed (in cap heights per second) handed to the squash spring.
  impactLean: 7, // Lean kick per cap height per second of impact, degrees/s; top keeps going left to right.
  restitution: 0.14, // Hop after contact as a fraction of impact speed.
  letterStagger: 0.07, // Seconds between letters within a word.
  wordGap: 0.16, // Extra pause before HELLO, so SAY lands and then HELLO does.

  // Hover (fine pointers only).
  hoverRadius: 300, // Units; roughly one letter either side of the cursor feels it.
  hoverBulge: 0.045, // Extra height of the letter right under the cursor.
  hoverLean: 3.2, // Peak lean away from the cursor, degrees.

  // Press.
  pressDepth: 0.86, // sy while held (sx widens to keep the area).
  tapHold: 0.09, // Seconds a keyboard tap is held before it pops.
};

const clamp = (n, lo, hi) => (n < lo ? lo : n > hi ? hi : n);
const num = (n) => (Math.abs(n) < 1e-6 ? '0' : String(Math.round(n * 1e4) / 1e4));

/** Index of the first letter of each word after the first (largest gaps between glyph boxes). */
export function wordStarts(letters) {
  const gaps = letters.slice(1).map((l, i) => ({ at: i + 1, gap: l.x - (letters[i].x + letters[i].width) }));
  const widest = Math.max(...gaps.map((g) => g.gap));
  // A word break is a gap clearly wider than the usual (overlapping) letter spacing.
  return gaps.filter((g) => g.gap > 0 && g.gap > widest * 0.5).map((g) => g.at);
}

/** Entrance start delay of each letter, seconds after land(). */
export function landDelays(letters, params = HELLO_MOTION) {
  const breaks = new Set(wordStarts(letters));
  let t = 0;
  return letters.map((_, i) => {
    if (i > 0) t += params.letterStagger + (breaks.has(i) ? params.wordGap : 0);
    return t;
  });
}

/** SVG transform of one letter. Exactly the static markup's `translate(x 0)` at rest. */
export function helloTransform(glyph, { y = 0, sx = 1, sy = 1, skew = 0 }) {
  if (y === 0 && sx === 1 && sy === 1 && skew === 0) return `translate(${glyph.x} 0)`;
  const x = glyph.x + (glyph.width * (1 - sx)) / 2; // Scale about the letter's centre.
  const lift = y ? `translate(0 ${num(-y)}) ` : '';
  return lift + letterTransform({ x, sx, sy, skew });
}

/**
 * @param {{x:number,width:number}[]} letters glyph table in reading order
 * @param {typeof HELLO_MOTION} params read live every step
 */
export function createHelloSim(letters, params = HELLO_MOTION) {
  const count = letters.length;
  const centres = letters.map((l) => l.x + l.width / 2);
  const bodies = letters.map(() => ({
    phase: 'rest', // rest | hidden | waiting | falling
    wait: 0, // Seconds left before a waiting letter is released.
    y: 0, vy: 0, // Height above the baseline (units) and its velocity (up is +).
    s: 1, sv: 0, // Vertical scale and its velocity.
    k: 0, kv: 0, // Lean (degrees, + = top leans left, SVG skewX sign) and its velocity.
    landedAt: -1, // Sim time of first contact, for tests and the filmstrip.
  }));
  const out = letters.map(() => ({ y: 0, sx: 1, sy: 1, skew: 0, opacity: 1 }));

  let pointer = null; // Hover x in viewBox units, or null.
  let pressed = false;
  let tapLeft = 0; // Seconds until a keyboard tap releases itself.
  let acc = 0;
  let time = 0;
  let settled = true;

  const gravity = () => (2 * Math.max(1, params.dropHeight)) / Math.max(0.05, params.fallTime) ** 2;
  const impactRef = () => gravity() * Math.max(0.05, params.fallTime); // Contact speed of a full drop.

  /** Hover and press targets for letter i: [scale, lean]. */
  function targets(i) {
    let s = 1;
    let k = 0;
    if (pointer !== null) {
      const d = (centres[i] - pointer) / Math.max(1, params.hoverRadius);
      const w = Math.exp(-d * d);
      s += params.hoverBulge * w;
      // d * e^(-d²) peaks at d = 1/√2; normalise that peak to hoverLean. Letters
      // right of the cursor lean right (negative skewX), left ones lean left.
      k = -params.hoverLean * d * w * Math.sqrt(2 * Math.E);
    }
    if (pressed) s *= params.pressDepth;
    return [s, k];
  }

  function step(h) {
    time += h;
    if (tapLeft > 0) {
      tapLeft -= h;
      if (tapLeft <= 0) { tapLeft = 0; pressed = false; }
    }
    const g = gravity();
    const vRef = impactRef();
    const ks = Math.max(1, params.stiffness);
    const cs = 2 * Math.max(0, params.damping) * Math.sqrt(ks);
    const kl = Math.max(1, params.leanStiffness);
    const cl = 2 * Math.max(0, params.leanDamping) * Math.sqrt(kl);
    const cap = Math.max(1, params.maxBulge) ** 2; // Raw scale limit; rendering caps tighter.

    for (let i = 0; i < count; i++) {
      const b = bodies[i];
      if (b.phase === 'hidden') continue;
      if (b.phase === 'waiting') {
        b.wait -= h;
        if (b.wait > 0) continue;
        b.phase = 'falling';
        b.y = Math.max(0, params.dropHeight);
        b.vy = 0;
      }
      let [sT, kT] = targets(i);

      if (b.phase === 'falling') {
        b.vy -= g * h;
        b.y += b.vy * h;
        if (b.vy < 0) sT *= 1 + Math.max(0, params.fallStretch) * Math.min(1, -b.vy / vRef);
        if (b.y <= 0) {
          const impact = -b.vy;
          b.y = 0;
          b.sv -= (params.impactSquash * impact) / CAP;
          b.kv -= (params.impactLean * impact) / CAP; // Top carries on in reading direction.
          if (b.landedAt < 0) b.landedAt = time;
          b.vy = impact * clamp(params.restitution, 0, 0.9);
          if (b.vy < 60) { b.vy = 0; b.phase = 'rest'; } // Too small to leave the ground.
        }
      }

      b.sv += (-ks * (b.s - sT) - cs * b.sv) * h;
      b.s = clamp(b.s + b.sv * h, 1 / cap, cap);
      b.kv += (-kl * (b.k - kT) - cl * b.kv) * h;
      b.k += b.kv * h;

      if (![b.y, b.vy, b.s, b.sv, b.k, b.kv].every(Number.isFinite)) {
        Object.assign(b, { phase: 'rest', y: 0, vy: 0, s: 1, sv: 0, k: 0, kv: 0 });
      }
    }
  }

  function checkSettled() {
    // A tap releases itself on a timer, so it must stay awake. A held press
    // settles onto pressDepth like any other target; press(false) and hover()
    // wake it again, so a lost pointerup never leaves the render loop spinning.
    if (tapLeft > 0) return false;
    for (let i = 0; i < count; i++) {
      const b = bodies[i];
      if (b.phase === 'hidden') continue;
      if (b.phase !== 'rest') return false;
      const [sT, kT] = targets(i);
      if (Math.abs(b.s - sT) > 5e-4 || Math.abs(b.sv) > 5e-3 || Math.abs(b.k - kT) > 0.02 || Math.abs(b.kv) > 0.1) return false;
    }
    for (let i = 0; i < count; i++) {
      const b = bodies[i];
      if (b.phase === 'hidden') continue;
      [b.s, b.k] = targets(i); // Land exactly on the targets (the static layout when idle).
      b.sv = 0; b.kv = 0; b.y = 0; b.vy = 0;
    }
    acc = 0;
    return true;
  }

  const wake = () => { settled = false; };

  return {
    params,
    /** Hide every letter until land() (before the section scrolls into view). */
    arm() {
      bodies.forEach((b) => Object.assign(b, { phase: 'hidden', y: 0, vy: 0, s: 1, sv: 0, k: 0, kv: 0, landedAt: -1 }));
    },
    /** The entrance: letters drop in one after another, SAY then HELLO. */
    land() {
      const delays = landDelays(letters, params);
      bodies.forEach((b, i) => Object.assign(b, { phase: 'waiting', wait: delays[i], y: 0, vy: 0, landedAt: -1 }));
      wake();
    },
    /** Pointer at viewBox x, or null when it leaves. */
    hover(x) {
      const next = Number.isFinite(x) ? x : null;
      if (next === pointer) return;
      pointer = next;
      wake();
    },
    press(down) {
      pressed = Boolean(down);
      tapLeft = 0;
      wake();
    },
    /** Keyboard activation: a short press that releases itself. */
    tap() {
      pressed = true;
      tapLeft = Math.max(STEP, params.tapHold);
      wake();
    },
    /** Jump to the exact static layout (reduced motion, unmount). */
    rest() {
      pointer = null;
      pressed = false;
      tapLeft = 0;
      acc = 0;
      bodies.forEach((b) => Object.assign(b, { phase: 'rest', wait: 0, y: 0, vy: 0, s: 1, sv: 0, k: 0, kv: 0 }));
      settled = true;
    },
    /**
     * Advance by one wall-clock frame. Returns true if anything moved.
     * @param {number} dt seconds since the last frame (clamped to MAX_FRAME)
     */
    advance(dt) {
      if (settled) return false;
      acc += clamp(Number.isFinite(dt) ? dt : 0, 0, MAX_FRAME);
      const steps = Math.floor(acc / STEP + 1e-9);
      acc = Math.max(0, acc - steps * STEP);
      for (let n = 0; n < steps; n++) step(STEP);
      if (steps && checkSettled()) settled = true;
      return steps > 0;
    },
    /** Per-letter render state. Reuses its objects; copy them to keep history. */
    read() {
      const bulge = Math.max(1, params.maxBulge);
      const tilt = Math.max(0, params.maxTilt);
      const fade = Math.max(1e-3, params.fadeIn * params.dropHeight);
      for (let i = 0; i < count; i++) {
        const b = bodies[i];
        const o = out[i];
        const sy = clamp(b.s, 1 / bulge, bulge);
        o.y = b.y;
        o.sy = sy;
        o.sx = sy === 1 ? 1 : clamp(sy ** -Math.max(0, params.squash), 1 / bulge, bulge);
        o.skew = clamp(b.k, -tilt, tilt);
        o.opacity = b.phase === 'hidden' || b.phase === 'waiting' ? 0
          : b.phase === 'falling' && b.landedAt < 0 ? clamp((params.dropHeight - b.y) / fade, 0, 1) : 1;
      }
      return out;
    },
    /** SVG transform for letter i from the current state. */
    transform(i) {
      return helloTransform(letters[i], this.read()[i]);
    },
    get settled() { return settled; },
    get time() { return time; },
    get pressed() { return pressed; },
    /** Sim time each letter first touched the baseline (-1 if it hasn't). */
    get landedAt() { return bodies.map((b) => b.landedAt); },
  };
}
