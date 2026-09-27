import React, { Suspense, lazy, useLayoutEffect, useRef, useState } from 'react';
import { LETTERS, LETTERING_DEFS, LETTERING_MOVING_DEFS } from './lettering.js';
import { MOTION } from './motion.js';
import { createWordmarkSim, letterTransform, segment } from './physics.js';
import { dockMetrics, dockTransform, heroViewX, homeLinkBox, homeLinkViewX } from './geometry.js';
import { HERO_GLYPHS, acceptsHover, acceptsPress, addState, createDockEffects, dockFxTransform } from './dockfx.js';
import './wordmark.css';

const KEEP = 4; // S U P H survive into the docked logo; I A N are absorbed.
const clamp01 = (n) => Math.max(0, Math.min(1, n));
const px = (n) => `${Math.round(n * 100) / 100}px`;
const idle = () => {};
const NO_INPUT = { move: idle, leave: idle, down: idle, up: idle, tap: idle };
const AT_REST = { y: 0, sx: 1, sy: 1, skew: 0 }; // An inner group's state with no effect on it.

// Dev-only tuning panel. import.meta.env.DEV is false in production builds, so
// this branch and the panel's chunk are dropped from the bundle entirely.
const TuningPanel = import.meta.env.DEV ? lazy(() => import('./TuningPanel.jsx')) : null;

/**
 * The fixed SUPHIAN lettering layer and the docked SUPH home link.
 *
 * Motion: native scroll only sets targets on a small physics sim (physics.js):
 * a soft-body chain of letters squeezed by a piston, and a sprung dock
 * transform. A requestAnimationFrame loop steps the sim and writes SVG
 * attributes while scrolling or unsettled, and stops once everything rests.
 * Scroll itself is never intercepted. Off their exact rest layout, the letters
 * draw a flat fill in place of the grain filter (`data-moving`).
 *
 * Docked, SUPH also answers the pointer like the SAY HELLO sign-off, with the
 * same model and values (dockfx.js): a mouse hovering over it bulges the
 * letters near the cursor and leans their neighbours away, a press squishes
 * them and they pop back on release, and Enter plays a short tap. That motion
 * sits on an inner group inside each letter's group, so it composes with the
 * chain's transform instead of fighting it, and it steps in the same loop,
 * which sleeps once both are at rest. Undocking lets go of hover and press.
 * The hero SUPHIAN answers a hovering mouse the same way, all seven letters,
 * while the page is at the top (Suphian, 2026-09-27); the first scroll lets go
 * and the letters settle as the chain starts to move. No press on the hero,
 * and nothing on touch screens.
 *
 * Page contract:
 * - Measures the element marked `[data-wordmark-hero]` (the opening viewport,
 *   100svh). Without one, or with `docked`, it renders straight into the
 *   header, without animating on mount. If the hero appears, changes or goes
 *   away later (routing), it re-measures and snaps to the matching state.
 * - Writes `--cue-opacity` on the hero, `--header-opacity` on `.header`
 *   (0..1; :root holds the defaults), and
 *   `data-docked` and `data-cue` ("visible" | "hidden") on <html>.
 * - `onHome(event)` runs as soon as the docked SUPH is clicked (the squish
 *   plays while the page scrolls); `label` is its accessible name.
 * - Under prefers-reduced-motion the physics is off: the artwork switches
 *   directly between the hero and the header at 58% of the opening viewport,
 *   and neither the hero nor the docked SUPH moves under the pointer.
 */
export default function Wordmark({ docked: forceDocked = false, homeHref = '/', onHome, label = 'SUPH — back to top' }) {
  const svg = useRef(null);
  const word = useRef(null);
  const homeLink = useRef(null);
  const controls = useRef(null); // Handed to the dev tuning panel.
  const input = useRef(NO_INPUT); // Pointer and keyboard handlers for the docked SUPH, bound by the effect.
  const [tuning] = useState(() => Boolean(TuningPanel) && new URLSearchParams(window.location.search).has('tune'));

  useLayoutEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const groups = [...word.current.querySelectorAll('[data-letter]')];
    const fxGroups = [...word.current.querySelectorAll('[data-fx]')]; // Every letter's inner group.
    const root = document.documentElement;
    const sim = createWordmarkSim({ letters: LETTERS, keep: KEEP, params: MOTION });
    const fx = createDockEffects(); // Hover and press on the docked SUPH: SAY HELLO's model.
    const heroFx = createDockEffects({ glyphs: HERO_GLYPHS }); // The same, on the hero SUPHIAN: hover only.
    const fxStates = fxGroups.map(() => ({ y: 0, sx: 1, sy: 1, skew: 0 }));
    const written = new Map(); // Custom property -> { element, text } last written.
    const fxWritten = fxGroups.map(() => null); // null: the first render writes, whatever is there.
    let metrics;
    let heroHeight = 1;
    let heroless = false;
    let heroElement = null;
    let header = null;
    let raf = 0;
    let staticFrame = 0;
    let last = 0;
    let moving = false;

    const pinned = () => forceDocked || heroless;
    // No chain physics: reduced motion, or pinned to the header. A pinned
    // logo still answers hover and press; reduced motion doesn't.
    const physicsOff = () => preference.matches || pinned();
    const scrollProgress = () => (pinned() ? 1 : clamp01(window.scrollY / (heroHeight * MOTION.travel)));
    // Reduced motion keeps both end states with an instantaneous handoff, so
    // the screen never contains a small second copy of the logo.
    const reducedDocked = () => pinned() || window.scrollY >= heroHeight * 0.58;
    // Where the chain rests while its physics is off.
    const staticProgress = () => (preference.matches && !pinned() ? Number(reducedDocked()) : scrollProgress());

    // Each fade goes on the element whose rules read it, not on <html>: a custom
    // property changed on <html> restyles the whole page (170 elements, 8-10 ms
    // a frame at 4x CPU, measured), on the hero or header just their subtree.
    function setVar(element, name, value) {
      if (!element) return;
      const text = String(Math.round(value * 1000) / 1000);
      const prev = written.get(name);
      if (prev?.element === element && prev.text === text) return;
      written.set(name, { element, text });
      element.style.setProperty(name, text);
    }

    // Off the exact rest layout (moving, or leaning under the cursor), the
    // letters drop the grain filter for its mean colour (wordmark.css). Redrawn
    // every frame, the filter cost WebKit about 30% of its frames and, under a
    // lean (skewX), was resampled and blurred.
    function setMoving(next) {
      if (next === moving) return;
      moving = next;
      if (next) word.current.setAttribute('data-moving', '');
      else word.current.removeAttribute('data-moving');
    }

    function render() {
      if (!metrics) return;
      // Scroll is read before the first write: read after them, it forced a
      // style and layout pass every frame.
      const p = scrollProgress();
      const reduced = preference.matches;
      const reducedDock = reduced && reducedDocked();
      const atTop = window.scrollY < 24;
      const s = sim.read();
      word.current.setAttribute('transform', dockTransform(metrics, s.dock));
      s.letters.forEach((letter, index) => {
        const group = groups[index];
        group.setAttribute('transform', letterTransform(letter));
        if (index >= KEEP) {
          group.setAttribute('opacity', letter.opacity.toFixed(3));
          group.style.visibility = letter.opacity < 0.002 ? 'hidden' : '';
        }
      });
      const move = clamp01(s.dockRaw);
      const docked = pinned() || (reduced ? reducedDock : p >= 0.995 && move >= 0.98);
      const cueFade = pinned() ? 0 : reduced ? Number(atTop) : 1 - segment(p, 0, 0.22);
      setVar(heroElement, '--cue-opacity', cueFade);
      root.dataset.cue = cueFade <= 0.01 ? 'hidden' : 'visible';
      setVar(header, '--header-opacity', segment(move, 0.75, 1));
      homeLink.current.hidden = !docked;
      root.dataset.docked = String(docked);
      fx.setDocked(docked); // Leaving the header lets go of hover and press; the letters spring back.
      heroFx.setEnabled(!pinned() && p < 0.001); // Likewise the first scroll off the top.
      renderFx();
    }

    /** The inner groups, under the chain's transforms: the hero's hover on all seven letters, the dock's on S U P H. */
    function renderFx() {
      const dock = fx.read();
      const hero = heroFx.read();
      fxGroups.forEach((group, index) => {
        const state = addState(Object.assign(fxStates[index], AT_REST), hero[index]);
        if (index < KEEP) addState(state, dock[index]);
        const transform = dockFxTransform(LETTERS[index].width, state);
        if (transform === fxWritten[index]) return;
        fxWritten[index] = transform;
        if (transform) group.setAttribute('transform', transform);
        else group.removeAttribute('transform'); // At rest: no transform at all.
      });
    }

    // Physics off (reduced motion, pinned to the header): jump to the rest state.
    function renderStatic() {
      staticFrame = 0;
      sim.snap(staticProgress());
      render();
      if (fx.settled && heroFx.settled) {
        cancelAnimationFrame(raf); // Nothing is moving: stop the loop.
        raf = 0;
        last = 0;
        setMoving(fxWritten.some(Boolean));
      } else {
        kick(); // Hover or press still playing on a pinned logo.
      }
    }

    function frame(now) {
      raf = 0;
      const dt = last ? (now - last) / 1000 : 1 / 60;
      last = now;
      let chainMoved;
      if (physicsOff()) {
        chainMoved = !sim.settled; // renderStatic keeps the chain at rest; this is a safety net.
        if (chainMoved) sim.snap(staticProgress());
      } else {
        sim.setTarget(scrollProgress());
        chainMoved = sim.advance(dt);
      }
      fx.advance(dt);
      heroFx.advance(dt);
      if (chainMoved) render();
      else renderFx(); // Only the pointer effects moved: the chain's attributes stand.
      const still = sim.settled && fx.settled && heroFx.settled;
      // The grain only draws on the exact rest layout, returning with it in the
      // same frame: moving, or held leaning under a still cursor, it resamples soft.
      setMoving(!still || fxWritten.some(Boolean));
      if (still) last = 0; // Idle: nothing runs until the next scroll or pointer.
      else kick();
    }

    function kick() {
      if (!raf) raf = requestAnimationFrame(frame);
    }

    function onScroll() {
      if (!metrics) return;
      if (physicsOff()) {
        if (!staticFrame) staticFrame = requestAnimationFrame(renderStatic);
        return;
      }
      sim.setTarget(scrollProgress());
      kick();
    }

    /** @param {boolean} snap jump straight to rest (mount, bfcache restore, preference change) */
    function measure(snap) {
      const width = document.documentElement.clientWidth;
      const screenHeight = window.innerHeight;
      // svh is stable while mobile browser chrome opens and closes.
      const hero = document.querySelector('[data-wordmark-hero]');
      heroElement = hero;
      heroless = !hero;
      header = document.querySelector('.header');
      heroHeight = Math.max(1, hero ? hero.getBoundingClientRect().height : screenHeight);
      const styles = getComputedStyle(root);
      metrics = dockMetrics({
        width,
        heroHeight,
        safeTop: parseFloat(styles.getPropertyValue('--safe-top')) || 0,
        safeLeft: parseFloat(styles.getPropertyValue('--safe-left')) || 0,
        safeRight: parseFloat(styles.getPropertyValue('--safe-right')) || 0,
      }, MOTION);
      svg.current.setAttribute('viewBox', `0 0 ${width} ${screenHeight}`);
      svg.current.style.height = `${screenHeight}px`;
      // The link covers the docked SUPH exactly (plus a margin), from the same metrics.
      const box = homeLinkBox(metrics);
      Object.assign(homeLink.current.style, { left: px(box.left), top: px(box.top), width: px(box.width), height: px(box.height) });
      if (snap || physicsOff()) {
        renderStatic();
      } else {
        sim.setTarget(scrollProgress());
        render();
        kick();
      }
    }

    // Pointer and keyboard on the docked SUPH, with SAY HELLO's rules. fx
    // ignores them unless the logo is docked and motion is allowed.
    const wake = () => { if (!fx.settled || !heroFx.settled) kick(); };
    input.current = {
      move(event) {
        if (!acceptsHover(event, finePointer.matches)) return;
        fx.hover(homeLinkViewX(event.clientX, homeLink.current.getBoundingClientRect()));
        wake();
      },
      leave() { fx.leave(); wake(); },
      down(event) {
        if (!acceptsPress(event)) return;
        fx.press(true);
        wake();
      },
      up() { fx.press(false); wake(); },
      tap() { fx.tap(); wake(); },
    };
    // The hero: a hovering mouse anywhere over the word, mapped from the same
    // metrics as the letters (the lettering layer takes no pointer events).
    // heroFx ignores it unless the page is at the top and motion is allowed.
    const onPointerMove = (event) => {
      if (!heroFx.active || !metrics || !acceptsHover(event, finePointer.matches)) return;
      heroFx.hover(heroViewX(event.clientX, event.clientY, metrics));
      wake();
    };
    const onPointerGone = () => { heroFx.leave(); wake(); };

    const onResize = () => measure(false);
    const onRestore = () => measure(true);
    // Reduced motion switched on mid-flight: the docked SUPH and the hero drop straight to rest too.
    const onPreference = () => {
      fx.setReduced(preference.matches);
      heroFx.setReduced(preference.matches);
      measure(true);
    };
    // Routes can mount, swap or remove the hero after this effect runs (lazy
    // pages, client-side navigation). Re-measure, without animating, when it changes.
    const heroWatch = new MutationObserver(() => {
      if (document.querySelector('[data-wordmark-hero]') !== heroElement) measure(true);
    });
    heroWatch.observe(document.body, { childList: true, subtree: true });
    fx.setReduced(preference.matches);
    heroFx.setReduced(preference.matches);
    measure(true);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('pageshow', onRestore);
    window.addEventListener('pointermove', onPointerMove, { passive: true });
    window.addEventListener('blur', onPointerGone);
    root.addEventListener('pointerleave', onPointerGone);
    preference.addEventListener('change', onPreference);
    controls.current = {
      sim,
      /** Re-measure and let the sim re-settle under changed MOTION values. */
      update() {
        measure(false);
        if (!preference.matches && !pinned()) {
          sim.wake();
          kick();
        }
      },
    };
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(staticFrame);
      word.current?.removeAttribute('data-moving');
      controls.current = null;
      input.current = NO_INPUT;
      heroWatch.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pageshow', onRestore);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('blur', onPointerGone);
      root.removeEventListener('pointerleave', onPointerGone);
      preference.removeEventListener('change', onPreference);
    };
  }, [forceDocked]);

  return (
    <>
      <svg ref={svg} className="lettering-layer" viewBox="0 0 1460 900" aria-hidden="true" focusable="false">
        <defs dangerouslySetInnerHTML={{ __html: LETTERING_DEFS + LETTERING_MOVING_DEFS }} />
        <g ref={word} className="wordmark">
          {LETTERS.map((letter, index) => (
            // Outer group: the chain's transform. Inner group: the pointer effects' (dockfx.js).
            <g key={letter.id} data-letter={letter.char} transform={`translate(${letter.x} 0)`}>
              <g data-fx="" dangerouslySetInnerHTML={{ __html: letter.markup }} />
            </g>
          ))}
        </g>
      </svg>
      {/* draggable={false}: a press and hold that drifts a few px would otherwise start a link drag and cancel the squish. */}
      <a ref={homeLink} className="home-link" href={homeHref} aria-label={label} hidden draggable={false}
        onPointerMove={(event) => input.current.move(event)}
        onPointerLeave={() => input.current.leave()}
        onPointerDown={(event) => input.current.down(event)}
        onPointerUp={() => input.current.up()}
        onPointerCancel={() => input.current.up()}
        onClick={(event) => {
          onHome?.(event); // Straight away; the squish plays while the page scrolls.
          if (event.detail === 0) input.current.tap(); // Keyboard (Enter): no pointer press to show.
        }} />
      {tuning && (
        <Suspense fallback={null}>
          <TuningPanel controls={controls} />
        </Suspense>
      )}
    </>
  );
}
