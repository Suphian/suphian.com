/**
 * Wordmark physics: a pure, DOM-free 1-D soft body. It imports in plain Node.
 *
 * Model
 * - Chain. Letters are segments of a chain of nodes b0..bN (8 nodes for
 *   SUPHIAN). Each segment is a damped spring whose natural length is that
 *   letter's advance (x[i+1] - x[i]); the last letter's is its width. Glyphs
 *   overlap, so drawing each letter from its left node with its width scaled
 *   by the same ratio keeps the overlaps proportional.
 * - Scroll sets targets, never positions. Scroll progress p drives:
 *   1. the rest lengths of the absorbed letters (I A N), which shrink to 0,
 *      staggered from the right so the collapse travels leftward;
 *   2. the piston, a tether pulling the right node to where the chain should
 *      end, minus a mid-scroll squeeze so it pushes slightly ahead of the
 *      absorption and SUPH carry a visible compression;
 *   3. the dock progress q (the hero-to-header transform), itself a spring.
 * - I A N give way at a limited speed (`yieldTime`). A slow scroll never
 *   outruns it, so SUPH only feel the scroll-set squeeze. A flick drives the
 *   piston into letters that haven't yielded yet: the pressure wave reaches
 *   H, P, U and S in turn, and when I A N finally give, SUPH spring back and
 *   overshoot. Nothing scripts that; it's momentum.
 * - The piston pushes hard but pulls gently. On the way back up it retreats
 *   and I A N re-inflate into the space, pushing the chain open themselves.
 * - Spring rates follow a material law, k = E / rest, so a letter being
 *   absorbed stiffens as it shrinks, like a crushed balloon, and passes the
 *   push on to its neighbours.
 * - The left edge is tethered too, so S is pushed and squashes when the wave
 *   arrives. The chain also feels the dock's acceleration (`inertia`): as the
 *   logo decelerates into the header, the letters pile into the right edge
 *   and wobble.
 *
 * Integration: fixed 480 Hz semi-implicit Euler. Wall-clock frame time is
 * clamped and turned into whole steps through an accumulator, so results do
 * not depend on the display's frame rate. Guards keep S U P H at least
 * `minScaleX` wide, keep every width non-negative, cap springs for stability
 * and reset to equilibrium if anything turns non-finite.
 */
import { MOTION } from './motion.js';

export const STEP = 1 / 480; // Fixed simulation step, seconds.
export const MAX_FRAME = 0.1; // Longest wall-clock frame simulated (a tab switch is clamped to this).
export const MAX_STEPS = Math.ceil(MAX_FRAME / STEP) + 1;
export const BASELINE = 584; // Glyph baseline in viewBox units; letters squash and lean about it.
const REF = 250; // Stiffness params are quoted for a letter this long.
const R_MIN = 20; // Floor on the rest length used for stiffness (stops k = E/r from blowing up).
const K_CAP = 0.25 * (1.4 / STEP) ** 2; // Per unit mass: keeps omega * STEP under ~1.4 for stability.
const FADE_FLOOR = 0.06; // I A N width fraction at which they are fully transparent.

const clamp = (n, lo, hi) => (n < lo ? lo : n > hi ? hi : n);
const clamp01 = (n) => clamp(n, 0, 1);
export const ease = (t) => t * t * (3 - 2 * t);
export const segment = (p, a, b) => ease(clamp01((p - a) / (b - a)));
export const mix = (a, b, t) => a + (b - a) * t;

const num = (n) => (Math.abs(n) < 1e-6 ? '0' : String(Math.round(n * 1e4) / 1e4));

/**
 * SVG transform for one letter group: move to its left edge on the baseline,
 * lean, then scale about that baseline point, so letters squash downward
 * onto the baseline and bulge upward.
 */
export function letterTransform({ x, sx, sy, skew }) {
  const lean = skew ? ` skewX(${num(skew)})` : '';
  return `translate(${num(x)} ${BASELINE})${lean} scale(${num(sx)} ${num(sy)}) translate(0 -${BASELINE})`;
}

/** Smoothly limits x beyond [0, 1]: identity inside, asymptote at 1 + hi / -lo outside. */
export function softLimit(x, hi, lo) {
  if (x > 1) return hi > 0 ? 1 + hi * Math.tanh((x - 1) / hi) : 1;
  if (x < 0) return lo > 0 ? -lo * Math.tanh(-x / lo) : 0;
  return x;
}

/**
 * Chain geometry from glyph metrics.
 * @param {{x:number,width:number}[]} letters in reading order
 * @param {number} keep how many leading letters survive into the compact logo
 */
export function chainLayout(letters, keep) {
  const count = letters.length;
  const advance = letters.map((l, i) => (i < count - 1 ? letters[i + 1].x - l.x : l.width));
  const left = letters[0].x;
  const keptLength = advance.slice(0, keep).reduce((a, b) => a + b, 0);
  const lastKept = keep - 1;
  return {
    count,
    keep,
    left,
    advance,
    widths: letters.map((l) => l.width),
    keptLength,
    // The last surviving letter's slot grows from its advance to its full
    // width as the letter overlapping it (I over H) is absorbed.
    lastKeptWidth: letters[lastKept].width,
    fullRight: left + advance.reduce((a, b) => a + b, 0),
    compactRight: letters[lastKept].x + letters[lastKept].width,
    fullX: letters.map((l) => l.x),
  };
}

export function createWordmarkSim({ letters, keep, params = MOTION } = {}) {
  const layout = chainLayout(letters, keep);
  const { count, left, advance: advances, keptLength, lastKeptWidth } = layout;
  const lastKept = keep - 1;
  const nodes = count + 1;
  const pivot = layout.fullRight; // The dock's motion pivots roughly about the word's right edge.

  const x = new Float64Array(nodes);
  const v = new Float64Array(nodes);
  const m = new Float64Array(nodes);
  const force = new Float64Array(nodes);
  const alpha = new Float64Array(count).fill(1); // 1 = letter present, 0 = absorbed.
  const alphaT = new Float64Array(count).fill(1);
  const natural = new Float64Array(count);
  const rest = new Float64Array(count);
  const eqAlpha = new Float64Array(count);
  const eqNatural = new Float64Array(count);
  const eqRest = new Float64Array(count);
  const eqX = new Float64Array(nodes);
  const rigid = new Uint8Array(count);

  let target = 0; // Scroll progress target.
  let q = 0; // Dock progress (sprung).
  let qv = 0;
  let qa = 0;
  let acc = 0;
  let time = 0;
  let settled = true;
  let quiet = 0;
  let timeScale = 1;

  const state = {
    p: 0,
    dock: 0, // Soft-limited dock progress, ready for rendering.
    dockRaw: 0,
    settled: true,
    letters: Array.from({ length: count }, () => ({ x: 0, sx: 1, sy: 1, skew: 0, opacity: 1 })),
  };

  function massesFromParams() {
    for (let j = 0; j < nodes; j++) {
      m[j] = j === count ? params.pistonMass : j <= keep ? params.mass : params.tailMass;
      if (!(m[j] > 0.01)) m[j] = 0.01;
    }
  }

  /** Where each absorbed letter's presence wants to be at progress p. */
  function alphaTargets(p, out) {
    const tails = count - keep;
    const stagger = Math.max(0, params.tailStagger);
    for (let i = 0; i < count; i++) {
      if (i < keep) { out[i] = 1; continue; }
      const rank = count - 1 - i; // 0 for the letter touching the piston.
      const start = params.tailStart + rank * stagger;
      const end = Math.max(start + 0.01, params.tailEnd - (tails - 1 - rank) * stagger);
      out[i] = 1 - segment(p, start, end);
    }
  }

  function naturals(a, out) {
    for (let i = 0; i < count; i++) out[i] = advances[i];
    if (keep < count) out[lastKept] = mix(advances[lastKept], lastKeptWidth, 1 - a[keep]);
  }

  function rests(a, nat, out) {
    for (let i = 0; i < count; i++) out[i] = nat[i] * (i < keep ? 1 : a[i]);
  }

  const squeezeAt = (p) => Math.max(0, params.squeeze) * keptLength * Math.sin(Math.PI * clamp01(p)) ** 2;

  /** Piston target: the end of the chain as scroll wants it, pushed in by the squeeze. */
  function pistonTarget(p) {
    alphaTargets(p, eqAlpha);
    naturals(eqAlpha, eqNatural);
    rests(eqAlpha, eqNatural, eqRest);
    let sum = left;
    for (let i = 0; i < count; i++) sum += eqRest[i];
    return sum - squeezeAt(p);
  }

  /**
   * Spring rate of letter i at rest length r. Material law k = E / r, so a
   * letter crushed toward nothing stiffens and passes the push on. An absorbed
   * letter being pulled back open (L > r) keeps its natural softness instead:
   * a crushed balloon re-inflates, it doesn't yank its neighbours.
   */
  function springRate(i, r, L = r) {
    const rate = Math.max(1, (i < keep ? params.stiffness : params.tailStiffness) * REF);
    const mu = (m[i] * m[i + 1]) / (m[i] + m[i + 1]);
    if (i >= keep && L > r) {
      // In tension, a deflated letter can barely pull: stiffness grows with presence.
      return Math.min((rate / advances[i]) * Math.max(0.15, alpha[i]), K_CAP * mu);
    }
    return Math.min(rate / Math.max(r, R_MIN), K_CAP * mu);
  }

  const minLength = (i, nat) => (i < keep ? Math.max(0, params.minScaleX) * nat : 0);
  const maxLength = (i, nat) => (i < keep ? (2 - Math.max(0, params.minScaleX)) * nat : Infinity);

  /**
   * Static equilibrium for progress p, in positions (written to eqX). Solves
   * the chain as springs in series between the left tether and the piston
   * tether, treating any letter that would be crushed past its floor as rigid.
   */
  function equilibrium(p, out = eqX) {
    massesFromParams();
    const T = pistonTarget(p); // Also fills eqAlpha / eqNatural / eqRest.
    const kA = Math.min(params.anchorStiffness * m[0], K_CAP * m[0]);
    const kP = Math.min(params.pistonStiffness * m[count], K_CAP * m[count]);
    rigid.fill(0);
    let F = 0;
    for (let pass = 0; pass <= count; pass++) {
      let span = left;
      let compliance = 1 / Math.max(kA, 1e-9) + 1 / Math.max(kP, 1e-9);
      for (let i = 0; i < count; i++) {
        if (rigid[i]) span += minLength(i, eqNatural[i]);
        else { span += eqRest[i]; compliance += 1 / springRate(i, eqRest[i]); }
      }
      F = (span - T) / compliance; // > 0 means the chain is compressed.
      let changed = false;
      for (let i = 0; i < count; i++) {
        if (rigid[i]) {
          if (F < 0) { rigid[i] = 0; changed = true; }
        } else if (eqRest[i] - F / springRate(i, eqRest[i]) < minLength(i, eqNatural[i]) - 1e-9) {
          rigid[i] = 1; changed = true;
        }
      }
      if (!changed) break;
    }
    out[0] = left - F / Math.max(kA, 1e-9);
    for (let i = 0; i < count; i++) {
      out[i + 1] = out[i] + (rigid[i] ? minLength(i, eqNatural[i]) : eqRest[i] - F / springRate(i, eqRest[i]));
    }
    return out;
  }

  /** Jump straight to rest at progress p (mount, bfcache restore, reduced motion). */
  function snap(p) {
    target = clamp01(Number.isFinite(p) ? p : 0);
    equilibrium(target, x);
    alphaTargets(target, alpha);
    v.fill(0);
    q = ease(target);
    qv = 0;
    qa = 0;
    acc = 0;
    quiet = 0;
    settled = true;
  }

  /** Keeps widths inside their floors and ceilings, removing closing velocity (inelastic). */
  function constrain() {
    for (let pass = 0; pass < 6; pass++) {
      let fixed = false;
      for (let i = 0; i < count; i++) {
        const L = x[i + 1] - x[i];
        const lo = minLength(i, natural[i]);
        const hi = maxLength(i, natural[i]);
        if (L >= lo && L <= hi) continue;
        const goal = L < lo ? lo : hi;
        const wi = 1 / m[i];
        const wj = 1 / m[i + 1];
        const d = goal - L;
        x[i] -= (d * wi) / (wi + wj);
        x[i + 1] += (d * wj) / (wi + wj);
        const closing = v[i + 1] - v[i];
        if ((L < lo && closing < 0) || (L > hi && closing > 0)) {
          const shared = (m[i] * v[i] + m[i + 1] * v[i + 1]) / (m[i] + m[i + 1]);
          v[i] = shared;
          v[i + 1] = shared;
        }
        fixed = true;
      }
      if (!fixed) return;
    }
    // Anything left after the relaxation passes: settle it exactly, left to right.
    for (let i = 0; i < count; i++) {
      const L = x[i + 1] - x[i];
      const lo = minLength(i, natural[i]);
      const hi = maxLength(i, natural[i]);
      if (L < lo) x[i + 1] = x[i] + lo;
      else if (L > hi) x[i + 1] = x[i] + hi;
    }
  }

  function step() {
    const h = STEP;
    massesFromParams();

    // Targets. I A N give way (or re-inflate) toward their scroll-set presence,
    // but no faster than one full collapse per `yieldTime`.
    alphaTargets(target, alphaT);
    const maxYield = params.yieldTime > 0 ? h / params.yieldTime : 1;
    for (let i = keep; i < count; i++) alpha[i] += clamp(alphaT[i] - alpha[i], -maxYield, maxYield);
    naturals(alpha, natural);
    rests(alpha, natural, rest);
    const T = pistonTarget(target);

    // Dock spring.
    const w = 2 * Math.PI * Math.max(0.05, params.dockFrequency);
    const zd = Math.max(0, params.dockDamping);
    qa = w * w * (ease(target) - q) - 2 * zd * w * qv;
    qv += qa * h;
    q += qv * h;

    // Forces.
    const zeta = Math.max(0, params.damping);
    force.fill(0);
    const kA = Math.min(params.anchorStiffness * m[0], K_CAP * m[0]);
    force[0] -= kA * (x[0] - left) + 2 * zeta * Math.sqrt(kA * m[0]) * v[0];
    // The piston pushes at full strength but pulls only gently (`pistonPull`),
    // so on the way back up I A N re-inflate into the gap instead of being yanked.
    const kPush = Math.min(params.pistonStiffness * m[count], K_CAP * m[count]);
    const kP = x[count] > T ? kPush : kPush * clamp01(params.pistonPull ?? 1);
    force[count] -= kP * (x[count] - T) + 2 * zeta * Math.sqrt(kP * m[count]) * v[count];

    const soft = Math.max(0, params.minScaleX) + 0.2; // Kept letters firm up below this width.
    for (let i = 0; i < count; i++) {
      const L = x[i + 1] - x[i];
      const k = springRate(i, rest[i], L);
      const mu = (m[i] * m[i + 1]) / (m[i] + m[i + 1]);
      let f = k * (L - rest[i]) + 2 * zeta * Math.sqrt(k * mu) * (v[i + 1] - v[i]);
      if (i < keep) {
        const d = soft - L / natural[i];
        if (d > 0) f -= 15 * k * natural[i] * d * d; // Progressive stiffening before the hard floor.
      }
      force[i] += f;
      force[i + 1] -= f;
    }

    const drag = Math.max(0, params.drag);
    const inertia = params.inertia || 0;
    for (let j = 0; j < nodes; j++) {
      force[j] -= m[j] * (drag * v[j] + inertia * qa * (pivot - x[j]));
      v[j] += (force[j] / m[j]) * h;
      x[j] += v[j] * h;
    }

    constrain();
    time += h;

    let finite = Number.isFinite(q) && Number.isFinite(qv);
    for (let j = 0; j < nodes && finite; j++) finite = Number.isFinite(x[j]) && Number.isFinite(v[j]);
    if (!finite) snap(target);
  }

  function checkSettled(elapsed) {
    const qTarget = ease(target);
    if (Math.abs(q - qTarget) > 1e-4 || Math.abs(qv) > 1e-3) { quiet = 0; return; }
    alphaTargets(target, alphaT);
    for (let i = keep; i < count; i++) if (Math.abs(alpha[i] - alphaT[i]) > 1e-4) { quiet = 0; return; }
    let maxV = 0;
    for (let j = 0; j < nodes; j++) maxV = Math.max(maxV, Math.abs(v[j]));
    equilibrium(target);
    let maxDx = 0;
    for (let j = 0; j < nodes; j++) maxDx = Math.max(maxDx, Math.abs(x[j] - eqX[j]));
    if (maxDx < 0.05 && maxV < 1) {
      snap(target); // Lands exactly on the rest layout.
      return;
    }
    // Fallback for extreme tuning where the rest state is outside the linear model.
    quiet = maxV < 0.05 ? quiet + elapsed : 0;
    if (quiet > 0.3) { settled = true; v.fill(0); q = qTarget; qv = 0; }
  }

  /**
   * Advance by a wall-clock frame. Returns true if anything moved.
   * @param {number} dt seconds since the last frame (clamped to MAX_FRAME)
   */
  function advance(dt) {
    if (settled) return false;
    const frame = clamp(Number.isFinite(dt) ? dt : 0, 0, MAX_FRAME) * timeScale;
    acc += frame;
    let steps = Math.floor(acc / STEP + 1e-9);
    if (steps > MAX_STEPS) { steps = MAX_STEPS; acc = 0; } else acc = Math.max(0, acc - steps * STEP);
    for (let s = 0; s < steps && !settled; s++) step();
    if (!settled && steps) checkSettled(steps * STEP);
    return steps > 0;
  }

  function setTarget(p) {
    const next = clamp01(Number.isFinite(p) ? p : 0);
    if (Math.abs(next - target) > 1e-7) {
      target = next;
      settled = false;
      quiet = 0;
    }
  }

  /** Per-letter render state. Reuses one object; copy it if you need history. */
  function read() {
    const P = params;
    naturals(alpha, natural);
    const squash = Math.max(0, P.squash);
    const bulge = Math.max(1, P.maxBulge);
    const lean = P.tilt / 1000;
    const maxLean = Math.max(0, P.maxTilt);
    for (let i = 0; i < count; i++) {
      const out = state.letters[i];
      const width = Math.max(0, x[i + 1] - x[i]);
      const sx = width / advances[i];
      out.x = x[i];
      // The last kept letter's slot widens as I is absorbed; its glyph doesn't.
      out.sx = i === lastKept ? width / natural[i] : sx;
      if (i < keep) {
        out.sy = clamp(Math.max(out.sx, 1e-3) ** -squash, 1 / bulge, bulge);
      } else {
        // Absorbed letters bulge only from being squeezed faster than they
        // give way (width over their current rest), and deflate onto the
        // baseline as they go.
        const r = advances[i] * alpha[i];
        const strain = r > 1 ? width / r : 1;
        out.sy = clamp(Math.max(strain, 1e-3) ** -squash, 1 / bulge, bulge) * (1 - clamp01(P.tailSink) * (1 - alpha[i]));
      }
      out.skew = clamp(lean * 0.5 * (v[i] + v[i + 1]), -maxLean, maxLean);
      out.opacity = i < keep ? 1 : clamp01((sx - FADE_FLOOR) / (1 - FADE_FLOOR)) ** Math.max(0.1, P.fadePower);
    }
    state.p = target;
    state.dockRaw = q;
    state.dock = softLimit(q, Math.max(0, P.dockOvershoot), Math.max(0, P.dockOvershoot) * 0.25);
    state.settled = settled;
    return state;
  }

  massesFromParams();
  snap(0);

  return {
    layout,
    params,
    setTarget,
    advance,
    step,
    snap,
    read,
    equilibrium: (p) => Array.from(equilibrium(p, new Float64Array(nodes))),
    /** Wake after params change (tuning), so the chain re-settles under the new values. */
    wake() { settled = false; quiet = 0; },
    get target() { return target; },
    get settled() { return settled; },
    get time() { return time; },
    get timeScale() { return timeScale; },
    set timeScale(s) { timeScale = clamp(Number(s) || 1, 0.05, 4); },
    /** Raw state, for tests and the filmstrip. */
    get nodes() { return Array.from(x); },
    get velocities() { return Array.from(v); },
    get presence() { return Array.from(alpha); },
    get dockRaw() { return q; },
  };
}
