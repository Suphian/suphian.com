/**
 * Docked effects: motion that plays on the docked SUPH only, layered on top of
 * the chain (physics.js) without touching it. DOM-free, so it imports in plain
 * Node (tests/dock-effects.test.mjs, tests/dock-hover-film.mjs).
 *
 * Composition. Each kept letter is two nested groups (Wordmark.jsx):
 *
 *   <g data-letter>      outer: the chain's letterTransform (position, squeeze, lean)
 *     <g data-dock-fx>   inner: this module's transform, in the glyph's own units
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
 * Gating. Input only lands while the logo is docked and motion is allowed.
 * Undocking lets go of hover and press, and the letters spring back to rest.
 * Reduced motion drops straight to rest and ignores input.
 */
import { LETTERS } from './lettering.js';
import { HELLO_MOTION, createHelloSim, helloTransform } from '../sayhello/motion.js';

/** S U P H, the letters that survive into the docked logo, in compact-viewBox units. */
export const DOCK_GLYPHS = LETTERS.filter((l) => l.compactX != null).map((l) => ({ x: l.compactX, width: l.width }));

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
 * @param {{x:number,width:number}[]} [options.glyphs] docked letters, compact-viewBox units
 * @param {typeof HELLO_MOTION} [options.params] the touch layer's values (SAY HELLO's, read live)
 */
export function createDockEffects({ glyphs = DOCK_GLYPHS, params = HELLO_MOTION } = {}) {
  const touch = createHelloSim(glyphs, params); // Hover and press: SAY HELLO's model, unchanged.
  const layers = [touch];
  const out = glyphs.map(() => ({ y: 0, sx: 1, sy: 1, skew: 0 }));
  let docked = false;
  let reduced = false;

  const live = () => docked && !reduced;

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
      out.forEach((o, i) => {
        const s = states[i];
        o.y += s.y;
        o.sx *= s.sx;
        o.sy *= s.sy;
        o.skew += s.skew;
      });
    }
    return out;
  }

  return {
    glyphs,
    params,
    /** Docked in the header (true) or not. Leaving it lets go of hover and press. */
    setDocked(next) {
      const was = docked;
      docked = Boolean(next);
      if (was && !docked) letGo();
    },
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
    get docked() { return docked; },
    /** True while input can move the letters: docked, and motion allowed. */
    get active() { return live(); },
    get pressed() { return touch.pressed; },
  };
}
