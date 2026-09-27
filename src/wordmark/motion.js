/**
 * MOTION: the single place to tune the wordmark. It is re-exported from
 * Wordmark.jsx and kept in this DOM-free module so the node tests can use the
 * same defaults. Every value is read live each simulation step, so the dev
 * tuning panel (`?tune`) can change them without a reload.
 *
 * Units: progress values are fractions of the scroll travel (0 = hero,
 * 1 = docked). Lengths are lettering viewBox units (the full word is 1661
 * wide). Stiffness values are spring rates in 1/s² for a 250-unit letter of
 * mass 1, so sqrt(stiffness) is roughly that letter's bounce in rad/s.
 */
export const MOTION = {
  // Scroll mapping
  travel: 0.88, // Scroll distance of the whole handoff, in opening viewport heights.
  logoWidth: 104, // Docked SUPH width in px.
  mobileLogoWidth: 86, // Docked SUPH width in px below 640px.

  // Choreography. Scroll only sets these targets; the springs decide the motion.
  tailStart: 0.06, // Progress at which the piston starts absorbing N.
  tailEnd: 0.56, // Progress by which I, the last absorbed letter, wants to be gone.
  tailStagger: 0.08, // Delay between N, A and I giving way, so the collapse travels leftward.
  squeeze: 0.075, // Mid-scroll piston pressure as a fraction of SUPH's width. 0 = SUPH only move on flicks.

  // Soft-body chain: 8 nodes, one damped spring per letter, a tether at each end.
  stiffness: 600, // S U P H spring rate. Higher = firmer letters, quicker wobble.
  tailStiffness: 420, // I A N spring rate. Soft, so they squash before SUPH does.
  anchorStiffness: 700, // Tether holding the left edge of S to its slot.
  pistonStiffness: 1000, // Tether pulling the right-hand piston to its scroll target. Lower = laggier push.
  pistonPull: 0.1, // Piston strength when pulling back out, relative to pushing in.
  mass: 1, // Mass of each S U P H node.
  tailMass: 0.55, // Mass of each I A N node.
  pistonMass: 1.3, // Mass of the piston node. Heavier = more momentum into SUPH on a flick.
  damping: 0.62, // Damping ratio of every spring (0.55 bouncy, 0.75 calm).
  drag: 4, // Damping of each node against the page, per second. Settles the slowest wobble.
  yieldTime: 0.26, // Fastest I A N can fully give way or re-inflate, in seconds. Scrolls faster than this squash SUPH.
  inertia: 0.12, // How much letters lag the dock's acceleration (the landing squish). 0 = off.

  // Rendering of the simulated widths
  squash: 0.5, // Height response to width: sy = sx^-squash (0.5 keeps volume constant).
  maxBulge: 1.2, // Cap on vertical bulge; 1 / maxBulge caps thinning when stretched.
  tilt: 1.5, // Lean in degrees per 1000 units/s of letter speed (the top lags the baseline).
  maxTilt: 6, // Lean cap in degrees.
  minScaleX: 0.55, // Guardrail: S U P H never render narrower than this.
  fadePower: 1.5, // I A N opacity follows width: ((sx - 0.06) / 0.94)^fadePower.
  tailSink: 0.3, // Height I A N lose as they're absorbed (they deflate onto the baseline).

  // Dock spring: the global translate + scale from the hero to the header.
  dockFrequency: 1.5, // Hz.
  dockDamping: 0.74, // Damping ratio of the dock spring.
  dockOvershoot: 0.01, // Soft cap on how far past the header the logo can fly, as a fraction of its travel.
};
