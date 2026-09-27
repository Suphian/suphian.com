/**
 * Docked effects: pointer motion layered on top of the chain (physics.js)
 * without touching it, on the docked SUPH and, with the same model, on the
 * hero SUPHIAN (Suphian, 2026-09-27: "Can I have that on the main image as
 * well?"). DOM-free, so it imports in plain Node (tests/dock-effects.test.mjs,
 * tests/hero-hover.test.mjs, tests/dock-hover-film.mjs).
 *
 * Composition. Each letter is two nested groups (Wordmark.jsx):
 *
 *   <g data-letter>      outer: the chain's letterTransform (position, squeeze, lean)
 *     <g data-fx>        inner: this module's transform, in the glyph's own units
 *       <path/>
 *
 * The inner transform draws the glyph at x = 0, because the outer group has
 * already put it in place, so no letter is translated twice. At rest it is ''
 * (no attribute at all), so the docked layout is exactly what the chain draws.
 *
 * Layers. Each effect is a layer with the SAY HELLO sim's interface:
 * advance(dt) -> moved, settled, read() -> per-letter { y, sx, sy, skew } and
 * rest(). Their states combine per letter (lifts and leans add, scales
 * multiply) into one inner transform, and the render loop can sleep once every
 * layer has settled. Today there is one layer, touch: SAY HELLO's hover and
 * press model (src/sayhello/motion.js), used as is with the same HELLO_MOTION
 * and fed S U P H. Later docked layers (a landing bounce, a scroll-reactive
 * jiggle, idle breathing) go in beside it.
 *
 * No rescaling. SAY HELLO was traced at SUPHIAN's cap height, so both words
 * share lettering units, and every HELLO_MOTION value is a ratio, an angle, a
 * time or a length in those units. hoverRadius (300) is about one letter
 * either side in both words: SUPH's letter centres are 205 to 277 apart, SAY
 * HELLO's 163 to 316. The same numbers give the same motion relative to each
 * letter; the docked logo is only drawn smaller.
 *
 * Gating. Input only lands while the effect is enabled and motion is allowed:
 * the dock's while the logo is docked, the hero's while the page is at the
 * top. Disabling lets go of hover and press, and the letters spring back to
 * rest. Reduced motion drops straight to rest and ignores input.
 *
 * Two glyph sets. The dock's is S U P H in compact-viewBox units; the hero's
 * is all seven letters in full-viewBox units. Only the hover distances use
 * those x values: a letter's state is in its own units either way, so on S U
 * P H the two effects' states simply combine (addState) into one transform.
 */
import { LETTERS } from './lettering.js';
import { HELLO_MOTION, createHelloSim, helloTransform } from '../sayhello/motion.js';

/** S U P H, the letters that survive into the docked logo, in compact-viewBox units. */
export const DOCK_GLYPHS = LETTERS.filter((l) => l.compactX != null).map((l) => ({ x: l.compactX, width: l.width }));

/** All seven letters of the hero SUPHIAN, in full-viewBox units (the dotted I is one glyph). */
export const HERO_GLYPHS = LETTERS.map((l) => ({ x: l.x, width: l.width }));

/** Adds one effect's state for a letter onto `into`: lifts and leans add, scales multiply. */
export function addState(into, { y, sx, sy, skew }) {
  into.y += y;
  into.sx *= sx;
  into.sy *= sy;
  into.skew += skew;
  return into;
}

/** SAY HELLO's hover rule: a mouse, on a device that can hover with a fine pointer. */
export const acceptsHover = (event, finePointer) => event.pointerType === 'mouse' && Boolean(finePointer);

/**
 * SAY HELLO's press rule: any pointer, but a mouse only with the primary
 * button. A macOS ctrl+click is button 0 but opens a context menu and may
 * never send pointerup, so it does not start a press.
 */
export const acceptsPress = (event) => !(event.pointerType === 'mouse' && (event.button !== 0 || event.ctrlKey));

/**
 * Inner-group transform of one docked letter: SAY HELLO's helloTransform with
 * the glyph at x = 0 (the chain's outer group owns x). '' at rest: identity.
 */
export function dockFxTransform(width, { y = 0, sx = 1, sy = 1, skew = 0 }) {
  if (y === 0 && sx === 1 && sy === 1 && skew === 0) return '';
  return helloTransform({ x: 0, width }, { y, sx, sy, skew });
}

/**
 * @param {object} [options]
 * @param {{x:number,width:number}[]} [options.glyphs] DOCK_GLYPHS (default) or HERO_GLYPHS
 * @param {typeof HELLO_MOTION} [options.params] the touch layer's values (SAY HELLO's, read live)
 */
export function createDockEffects({ glyphs = DOCK_GLYPHS, params = HELLO_MOTION } = {}) {
  const touch = createHelloSim(glyphs, params); // Hover and press: SAY HELLO's model, unchanged.
  const layers = [touch];
  const out = glyphs.map(() => ({ y: 0, sx: 1, sy: 1, skew: 0 }));
  let enabled = false;
  let reduced = false;

  const live = () => enabled && !reduced;

  /** Release a press. Only when one is held, so a stray pointerup never wakes the loop. */
  function release() {
    if (touch.pressed) touch.press(false);
  }

  /** Let go of hover and press (hover(null) is a no-op when nothing is hovered). */
  function letGo() {
    touch.hover(null);
    release();
  }

  /** Per-letter state of all layers combined. Reuses its objects. */
  function read() {
    for (const o of out) { o.y = 0; o.sx = 1; o.sy = 1; o.skew = 0; }
    for (const layer of layers) {
      const states = layer.read();
      out.forEach((o, i) => addState(o, states[i]));
    }
    return out;
  }

  /** Input lands (true) or not. Turning it off lets go of hover and press. */
  function setEnabled(next) {
    const was = enabled;
    enabled = Boolean(next);
    if (was && !enabled) letGo();
  }

  return {
    glyphs,
    params,
    setEnabled,
    /** The dock's gate: docked in the header (true) or not. */
    setDocked: setEnabled,
    /** prefers-reduced-motion: straight to rest, and input is ignored while it holds. */
    setReduced(next) {
      reduced = Boolean(next);
      if (reduced) layers.forEach((layer) => layer.rest());
    },
    /** Pointer at compact-viewBox x; null when it goes. */
    hover(x) {
      if (live()) touch.hover(x);
    },
    press(down) {
      if (!down) release();
      else if (live()) touch.press(true);
    },
    /** Keyboard activation: SAY HELLO's short press that releases itself. */
    tap() {
      if (live()) touch.tap();
    },
    /** The pointer left the link: let go of hover and press. */
    leave: letGo,
    /**
     * Advance every layer by one wall-clock frame. Returns true if anything moved.
     * @param {number} dt seconds since the last frame (each layer clamps it)
     */
    advance(dt) {
      let moved = false;
      for (const layer of layers) moved = layer.advance(dt) || moved;
      return moved;
    },
    read,
    /** Inner-group transform of each docked letter ('' = identity, no attribute). */
    transforms() {
      return read().map((state, i) => dockFxTransform(glyphs[i].width, state));
    },
    get settled() { return layers.every((layer) => layer.settled); },
    get enabled() { return enabled; },
    /** True while input can move the letters: enabled, and motion allowed. */
    get active() { return live(); },
    get pressed() { return touch.pressed; },
  };
}
