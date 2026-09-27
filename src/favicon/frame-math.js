/**
 * Pure, deterministic frame math for the SUPH favicon. No DOM, no clock:
 * every function maps (time, strength, params) to letter poses, so the browser
 * module, the Node icon renderer and the tests all agree frame for frame.
 *
 * Variants. A burst plays one of four motions, chosen by name (MOTIONS). The
 * site plays DEFAULT_VARIANT, and initFavicon({ variant }) overrides it. Every
 * variant starts and ends exactly on the rest pose and lasts the same 1.16 s,
 * so switching variants never changes the timing:
 *   wave   S -> H squash-and-stretch ripple (the original).
 *   hop    the whole word crouches, hops about 2 px, lands with a squash and
 *          a little rebound.
 *   jelly  the word rocks side to side about its middle, like jelly, each
 *          swing smaller, and settles.
 *   puff   the word inflates like a balloon in two breaths, lets the air out
 *          past rest, and wobbles back.
 * hop, jelly and puff each move the word as one piece, which keeps SUPH
 * readable at 16 px. The wave deforms each letter in turn.
 *
 * Poses. Each letter's pose is { sx, sy, skew, x, y }: a scale and a lean
 * (skewX degrees; positive tips the top left) about the letter's baseline
 * centre, then an offset in lettering units (x right, y up). See letterMatrix
 * in layout.js.
 *
 * Wave model: each letter is a damped spring kicked at t = index * stagger (S,
 * U, P, H in order). Its displacement u is the spring's normalised impulse
 * response (0 at the kick, first peak = amplitude, then overshoot and settle),
 * shaped by a short attack and a tail taper so every burst starts and ends
 * exactly at rest. Height is driven directly (sy = 1 - amplitude * u, squashing
 * onto the baseline first), because at 16 px the letters have vertical headroom
 * but no spare width; width answers with sx = sy^-bulge (1 would keep area
 * constant; 0.5 keeps neighbours from merging into one blob). A lean follows
 * the spring's velocity so the top of each letter lags its base, which is what
 * makes the S -> H stagger read as a wave at favicon size.
 */

export const LETTER_COUNT = 4; // S U P H
export const ORDER = ['S', 'U', 'P', 'H'];

export const JIGGLE = {
  variant: 'wave',
  fps: 30, // Frames per second while a burst plays (Chromium, Safari; see GECKO_JIGGLE).
  offset: 0, // Time of the first moving frame in seconds (0 = one frame in).
  frequency: 2.6, // Spring frequency in Hz (undamped).
  damping: 0.2, // Damping ratio: low enough for two visible overshoots.
  amplitude: 0.24, // First-peak height loss at strength 1 (0.24 = squashed to 76% tall).
  stagger: 0.07, // Seconds between S, U, P and H being kicked.
  ring: 0.95, // Seconds each letter rings before it is exactly at rest.
  attack: 0.035, // Seconds to ease in, so the first frame is the rest pose.
  taper: 0.35, // Fraction of `ring` over which the residual wobble is faded to zero.
  bulge: 0.5, // sx = sy^-bulge: how much letters widen as they squash (1 = constant area).
  maxBulge: 1.3, // Cap on scale change either way.
  lean: 6, // Peak lean in degrees at strength 1.
  maxStrength: 1.6, // jiggle(strength) is clamped to [0, maxStrength].
};

/**
 * Firefox sampling of the same motion. Firefox doesn't show every <link
 * rel=icon> change: its FaviconLoader batches them in a DeferredTask (100 ms,
 * then an idle wait of up to 3 s) and cancels a load still in flight, so it
 * loads the newest icon at most about 10 times a second, and a 30 fps burst
 * shows as roughly 11 of 36 frames, unevenly spaced. For Gecko the burst is
 * sampled at 8 fps instead, so each frame is set 125 ms or more after the
 * previous one and gets its own load cycle (frames can still merge if the main
 * thread stays busy past Firefox's idle wait). The 132 ms offset places the
 * frames near the spring's peaks: every letter shows at least 77% of both its
 * squash and its stretch (the tests check it). Only the sampling changes; the
 * motion and duration are JIGGLE's. Every variant has a GECKO_ twin like this
 * one, with its own offset.
 */
export const GECKO_JIGGLE = Object.freeze({ ...JIGGLE, fps: 8, offset: 0.132 });

/**
 * hop: the word crouches, jumps, lands with a squash, rebounds once and
 * settles. All four letters move together.
 */
export const HOP = Object.freeze({
  variant: 'hop',
  fps: 30,
  offset: 0,
  duration: 1.16, // The wave's beat.
  crouch: 0.13, // Height lost crouching before take-off at strength 1 (0.13 = 87% tall).
  crouchTime: 0.12, // Seconds sinking into the crouch.
  launchTime: 0.03, // Seconds from the deepest crouch to lift-off, stretching up.
  airTime: 0.41, // Seconds off the ground: close to SAY HELLO's gravity for this height (0.38 s), and it puts the crouch, the top and the landing squash on Firefox's 8 fps grid.
  height: 150, // Peak lift in lettering units at strength 1. The ink is 579 tall, so this is about 2 px at 16 px.
  maxHeight: 170, // Lift cap for strengths above 1, so the word never rises out of the tile.
  stretch: 0.1, // Extra height at take-off and touchdown speed. None at the top of the hop.
  impact: 0.04, // Seconds the falling stretch takes to give way at touchdown.
  land: 0.22, // Touchdown squash: height lost at the landing spring's first dip.
  landFrequency: 3, // Landing spring, Hz.
  landDamping: 0.25, // Landing spring damping ratio: one clear rebound, then still.
  rebound: 0.25, // The little second hop, as a fraction of the first.
  reboundStart: 0.09, // Seconds after touchdown that the rebound leaves the ground, as the squash lets go.
  reboundTime: 0.16, // Seconds the rebound is in the air.
  taper: 0.35, // Seconds over which the last wobble fades to exactly zero.
  bulge: 0.5, // sx = sy^-bulge, as in the wave.
  maxBulge: 1.3, // Cap on scale change either way.
  maxStrength: 1.6,
});

/**
 * jelly: the word rocks side to side and settles. The letters lean about the
 * middle of the ink, not the baseline, so the outer letters never swing out of
 * the tile. They sink a little at the far end of each swing, and each letter
 * lags the one before it slightly, so it reads as soft rather than rigid.
 */
export const JELLY = Object.freeze({
  variant: 'jelly',
  fps: 30,
  offset: 0,
  duration: 1.16, // The wave's beat.
  lean: 13, // First swing in degrees at strength 1. The top of each letter moves about 1 px at 16 px.
  maxLean: 15, // Lean cap for strengths above 1.
  frequency: 2, // Sway in Hz. At 2 Hz, Firefox's 8 fps frames can land on every peak.
  damping: 0.13, // Each swing is about two thirds of the one before.
  stagger: 0.02, // Seconds each letter lags the one before, a slight S -> H ripple.
  pivot: 288, // Height above the baseline the letters rock about, in lettering units (the middle of the ink).
  bob: 0.14, // Height lost at the far end of each swing: the word sinks as it leans, which is what reads as jelly at 16 px.
  attack: 0.03, // Seconds to ease in.
  taper: 0.46, // Seconds over which the sway fades to exactly zero.
  bulge: 0.25, // sx = sy^-bulge: half the wave's widening, so the sinking word keeps clear of the tile's sides.
  maxStrength: 1.6,
});

/**
 * puff: SUPH fills up like a balloon in two breaths, holds, lets the air out
 * so fast that it shrinks past rest, and wobbles back. All four letters grow
 * together about the middle of the ink: a third taller and a little fatter,
 * so the gaps between them survive at 16 px.
 */
export const PUFF = Object.freeze({
  variant: 'puff',
  fps: 30,
  offset: 0,
  duration: 1.16, // The wave's beat.
  grow: 0.34, // Extra height at full inflation, strength 1.
  widen: 0.07, // Extra width of each letter at full inflation. Kept small so the letters don't fill their gaps at 16 px.
  inflateTime: 0.36, // Seconds to fill up.
  holdTime: 0.09, // Seconds held full.
  deflateTime: 0.09, // Seconds to let the air out.
  undershoot: 0.42, // How far past rest it shrinks, as a fraction of full inflation.
  frequency: 2.6, // Wobble back to rest, Hz.
  damping: 0.28,
  pivot: 288, // Height above the baseline it grows about, in lettering units (the middle of the ink).
  taper: 0.3, // Seconds over which the wobble fades to exactly zero.
  maxScale: 1.4, // Cap on scale either way.
  maxStrength: 1.6,
});

// Firefox (8 fps) twins, as GECKO_JIGGLE is for the wave. Each offset puts the
// samples near the motion's extremes, and the tests check what share of each
// extreme survives: hop keeps 87% of its crouch and 94% or more of its lift,
// landing squash and rebound; jelly keeps 92% or more of every letter's first
// three swings; puff keeps its fullest frame and 84% of its emptiest and of
// the overshoot after it. Offsets stay between 125 and 160 ms, so the first
// and the last moving frames are also 125 ms or more from the rest frames.
// Every twin has 10 frames, like GECKO_JIGGLE.
export const GECKO_HOP = Object.freeze({ ...HOP, fps: 8, offset: 0.125 });
export const GECKO_JELLY = Object.freeze({ ...JELLY, fps: 8, offset: 0.148 });
export const GECKO_PUFF = Object.freeze({ ...PUFF, fps: 8, offset: 0.153 });

/** Every variant by name, as the browser samples it (30 fps). */
export const MOTIONS = Object.freeze({ wave: JIGGLE, hop: HOP, jelly: JELLY, puff: PUFF });
/** The same variants sampled for Firefox (8 fps). */
export const GECKO_MOTIONS = Object.freeze({ wave: GECKO_JIGGLE, hop: GECKO_HOP, jelly: GECKO_JELLY, puff: GECKO_PUFF });
export const VARIANT_NAMES = Object.freeze(Object.keys(MOTIONS));

/**
 * The variant the site plays. Change this one name to switch the favicon
 * ('wave', 'hop', 'jelly' or 'puff'), or pass initFavicon({ variant }).
 */
export const DEFAULT_VARIANT = 'hop';

/** Params of a variant by name, sampled for Firefox when `gecko` is true. Throws on an unknown name. */
export function motionFor(variant = DEFAULT_VARIANT, { gecko = false } = {}) {
  if (!VARIANT_NAMES.includes(variant)) {
    throw new RangeError(`Unknown favicon variant "${variant}" (expected ${VARIANT_NAMES.join(', ')})`);
  }
  return (gecko ? GECKO_MOTIONS : MOTIONS)[variant];
}

export const REST_POSE = Object.freeze({ sx: 1, sy: 1, skew: 0, x: 0, y: 0 });
const rest = () => ({ ...REST_POSE });

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const smooth = (t) => t * t * (3 - 2 * t);
const ease = (t) => smooth(clamp(t, 0, 1));
const mix = (a, b, t) => a + (b - a) * t;
/** Parabolic arc: 0 at a and b, 1 halfway between. */
const arc = (t, a, b) => (t <= a || t >= b ? 0 : (4 * (t - a) * (b - t)) / ((b - a) * (b - a)));
/** 1 until `from`, easing to exactly 0 at `to`. */
const fadeOut = (t, from, to) => (t <= from ? 1 : t >= to ? 0 : 1 - smooth((t - from) / (to - from)));
const DEG = Math.PI / 180;

export function clampStrength(strength = 1, params = JIGGLE) {
  const s = Number(strength);
  return Number.isFinite(s) ? clamp(s, 0, params.maxStrength) : 1;
}

/** Seconds from the start of a burst to the moment every letter is exactly at rest. */
export function burstDuration(params = JIGGLE) {
  return params.duration ?? (LETTER_COUNT - 1) * params.stagger + params.ring;
}

/**
 * Sample times (seconds) of every frame in a burst: the rest frame at 0, the
 * moving frames one step (1 / fps) apart starting at `offset` (default: one
 * step in), and the rest frame again at exactly burstDuration. A moving frame
 * closer than half a step to the end is dropped, since it would only flash
 * before the rest frame (and Firefox would coalesce it away).
 */
export function frameTimes(params = JIGGLE) {
  const end = burstDuration(params);
  const first = params.offset > 0 ? params.offset : 1 / params.fps;
  const times = [0];
  for (let k = 0; ; k++) {
    const t = first + k / params.fps;
    if (t >= end - 0.5 / params.fps - 1e-9) break;
    times.push(t);
  }
  times.push(end);
  return times;
}

/** Number of frames in a burst, including the rest frame at each end. */
export function frameCount(params = JIGGLE) {
  return frameTimes(params).length;
}

function springConstants(frequency, damping) {
  const omega = 2 * Math.PI * frequency;
  const decay = damping * omega;
  const omegaD = omega * Math.sqrt(1 - damping * damping);
  // First peak of e^(-decay t) sin(omegaD t), used to normalise it to 1.
  const tPeak = Math.atan2(omegaD, decay) / omegaD;
  const peak = Math.exp(-decay * tPeak) * Math.sin(omegaD * tPeak);
  return { decay, omegaD, peak, tPeak };
}

/** e^(-decay tau) sin(omegaD tau), normalised so its first peak is 1, and its velocity divided by omegaD. */
function dampedSine(tau, frequency, damping) {
  if (tau <= 0) return { u: 0, v: 0 };
  const { decay, omegaD, peak } = springConstants(frequency, damping);
  const e = Math.exp(-decay * tau);
  const u = (e * Math.sin(omegaD * tau)) / peak;
  const v = (e * (omegaD * Math.cos(omegaD * tau) - decay * Math.sin(omegaD * tau))) / peak / omegaD;
  return { u, v };
}

/** Wave envelope: 0 before the kick, eases in over `attack`, and fades to exactly 0 at `ring`. */
export function envelope(tau, params = JIGGLE) {
  if (tau <= 0 || tau >= params.ring) return 0;
  const attack = params.attack > 0 ? smooth(clamp(tau / params.attack, 0, 1)) : 1;
  const taperStart = params.ring * (1 - params.taper);
  const tail = tau <= taperStart ? 1 : 1 - smooth((tau - taperStart) / (params.ring - taperStart));
  return attack * tail;
}

/**
 * Normalised wave spring displacement and velocity at `tau` seconds after the
 * kick: u rises to +1 at the first peak (squash: shorter and wider), swings
 * negative (stretch: taller and thinner), and decays. v is du/dt divided by the
 * angular frequency, so both are unitless and of order 1.
 */
export function spring(tau, params = JIGGLE) {
  return dampedSine(tau, params.frequency, params.damping);
}

// ---------- the four motions: (t, letter index, clamped strength > 0, params) -> pose ----------
function wavePose(t, index, s, p) {
  const tau = t - index * p.stagger;
  const env = envelope(tau, p);
  if (env === 0) return rest();
  const { u, v } = spring(tau, p);
  const sy = clamp(1 - p.amplitude * s * u * env, 1 / p.maxBulge, p.maxBulge);
  const sx = clamp(sy ** -p.bulge, 1 / p.maxBulge, p.maxBulge);
  // Lean: the top trails the spring's motion. Negative skewX tips the top left.
  const skew = clamp(-p.lean * s * v * env, -p.lean * p.maxStrength, p.lean * p.maxStrength);
  return { sx, sy, skew: Math.abs(skew) < 1e-9 ? 0 : skew, x: 0, y: 0 };
}

function hopPose(t, index, s, p) {
  const lift = Math.min(p.height * s, p.maxHeight);
  const takeOff = p.crouchTime + p.launchTime;
  const touchdown = takeOff + p.airTime;
  let sy;
  let y = 0;
  if (t < p.crouchTime) {
    sy = 1 - p.crouch * s * smooth(t / p.crouchTime);
  } else if (t < takeOff) {
    sy = mix(1 - p.crouch * s, 1 + p.stretch * s, smooth((t - p.crouchTime) / p.launchTime));
  } else if (t < touchdown) {
    const u = (t - takeOff) / p.airTime; // 0 at lift-off, 1 at touchdown.
    y = lift * 4 * u * (1 - u);
    sy = 1 + p.stretch * s * Math.abs(1 - 2 * u) ** 1.5; // Stretched while fast, round at the top.
  } else {
    const tau = t - touchdown;
    const settle = fadeOut(t, p.duration - p.taper, p.duration);
    const falling = 1 - ease(tau / p.impact);
    sy = 1 + p.stretch * s * falling - p.land * s * dampedSine(tau, p.landFrequency, p.landDamping).u * settle;
    y = lift * p.rebound * arc(tau, p.reboundStart, p.reboundStart + p.reboundTime);
  }
  sy = clamp(sy, 1 / p.maxBulge, p.maxBulge);
  return { sx: clamp(sy ** -p.bulge, 1 / p.maxBulge, p.maxBulge), sy, skew: 0, x: 0, y };
}

function jellyPose(t, index, s, p) {
  const tau = t - index * p.stagger;
  if (tau <= 0) return rest();
  const env = ease(tau / p.attack) * fadeOut(t, p.duration - p.taper, p.duration);
  const sway = dampedSine(tau, p.frequency, p.damping).u * env; // -1..1: +1 is the first swing, tops to the left.
  const skew = clamp(p.lean * s * sway, -p.maxLean, p.maxLean);
  const sy = 1 - p.bob * Math.min(s, 1) * sway * sway;
  // Lean about the pivot height, not the baseline: shift the base the other way.
  return { sx: sy ** -p.bulge, sy, skew, x: Math.tan(skew * DEG) * p.pivot * sy, y: 0 };
}

/** Puff inflation at time t: 0 at rest, 1 when full, negative while it has let out too much air. */
export function puffAmount(t, p = PUFF) {
  if (!(t > 0) || t >= p.duration) return 0;
  const full = p.inflateTime;
  const held = full + p.holdTime;
  const empty = held + p.deflateTime;
  // Two breaths: 55% of the air in the first, the rest after a short pause.
  if (t < full) return 0.55 * ease(t / (0.45 * full)) + 0.45 * ease((t - 0.5 * full) / (0.5 * full));
  if (t < held) return 1;
  if (t < empty) return mix(1, -p.undershoot, smooth((t - held) / p.deflateTime));
  // Wobble back from the undershoot: the spring starts at its first peak, where it has no speed.
  const { tPeak } = springConstants(p.frequency, p.damping);
  return -p.undershoot * dampedSine(t - empty + tPeak, p.frequency, p.damping).u * fadeOut(t, p.duration - p.taper, p.duration);
}

function puffPose(t, index, s, p) {
  const a = puffAmount(t, p) * s;
  const sy = clamp(1 + p.grow * a, 1 / p.maxScale, p.maxScale);
  const sx = clamp(1 + p.widen * a, 1 / p.maxScale, p.maxScale);
  // Grow about the pivot height: move the baseline down by as much as the pivot rose.
  return { sx, sy, skew: 0, x: 0, y: (1 - sy) * p.pivot };
}

const POSES = { wave: wavePose, hop: hopPose, jelly: jellyPose, puff: puffPose };

/** Pose of one letter (index 0..3 = S U P H) at time t in the burst. */
export function letterPose(t, index, strength = 1, params = JIGGLE) {
  const pose = POSES[params.variant ?? 'wave'];
  if (!pose) throw new RangeError(`Unknown favicon variant "${params.variant}"`);
  const s = clampStrength(strength, params);
  if (s === 0 || !(t > 0) || t >= burstDuration(params)) return rest();
  return pose(t, index, s, params);
}

/** Poses of S, U, P, H at time t. */
export function framePoses(t, strength = 1, params = JIGGLE) {
  return Array.from({ length: LETTER_COUNT }, (_, i) => letterPose(t, i, strength, params));
}

/** Every frame of a burst: [{ t, poses }]. */
export function burstFrames(strength = 1, params = JIGGLE) {
  return frameTimes(params).map((t) => ({ t, poses: framePoses(t, strength, params) }));
}

/** Frame index to show `elapsed` seconds into a burst: the last frame whose time has come (the final one is the rest frame). */
export function frameIndexAt(elapsed, params = JIGGLE, times = frameTimes(params)) {
  if (!(elapsed > 0)) return 0;
  let i = 0;
  while (i + 1 < times.length && times[i + 1] <= elapsed + 1e-6) i++;
  return i;
}

export const isRest = (pose) => pose.sx === 1 && pose.sy === 1 && pose.skew === 0 && (pose.x ?? 0) === 0 && (pose.y ?? 0) === 0;
