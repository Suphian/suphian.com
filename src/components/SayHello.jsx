import React, { useLayoutEffect, useRef } from 'react';
import { contact } from '../content.js';
import { useSectionViewed } from '../hooks/useSectionViewed.js';
import { useUI } from '../hooks/useUI.js';
import { track } from '../lib/analytics.js';
import { LETTERS, LETTERING_DEFS, VIEWBOX } from '../sayhello/lettering.js';
import { createHelloSim, helloTransform } from '../sayhello/motion.js';
import '../sayhello/sayhello.css';

const idle = () => {};

/**
 * The SAY HELLO sign-off, built like the SUPHIAN wordmark: traced vector
 * letters (src/sayhello/lettering.js) in the wordmark's red and grain, one SVG
 * group per letter, transforms written by a requestAnimationFrame loop that
 * runs only while the springs (src/sayhello/motion.js) are moving.
 *
 * - Entrance, once, when it scrolls into view: letters drop in S to O, SAY
 *   then HELLO, squashing on contact and rebounding. They are hidden until
 *   then (set before first paint, so they never flash in place first).
 * - Hover (mouse on a fine pointer): letters near the cursor bulge and lean away.
 * - Press: everything squishes like a button and pops back on release; a
 *   keyboard activation plays a short tap. The click opens the contact sheet
 *   straight away; the motion never delays it.
 * - prefers-reduced-motion: static letters, no physics.
 * Without JavaScript, the generated homepage provides the same work copy
 * and an email link. The animated sign-off is an enhancement.
 */
export default function SayHello() {
  const { openContact } = useUI();
  const wrap = useRef(null);
  const button = useRef(null);
  const svg = useRef(null);
  const word = useRef(null);
  const input = useRef({ move: idle, leave: idle, down: idle, up: idle, cancel: idle, tap: idle });
  useSectionViewed(wrap, 'say_hello');

  useLayoutEffect(() => {
    const node = button.current;
    const groups = [...word.current.querySelectorAll('[data-letter]')];
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
    const sim = createHelloSim(LETTERS);
    const written = groups.map(() => ({ transform: '', opacity: '' }));
    let raf = 0;
    let last = 0;
    let observer = null;

    function render() {
      const state = sim.read();
      groups.forEach((group, i) => {
        const transform = helloTransform(LETTERS[i], state[i]);
        const opacity = state[i].opacity >= 1 ? '' : state[i].opacity.toFixed(3);
        if (transform !== written[i].transform) group.setAttribute('transform', transform);
        if (opacity !== written[i].opacity) {
          if (opacity) group.setAttribute('opacity', opacity);
          else group.removeAttribute('opacity');
        }
        written[i].transform = transform;
        written[i].opacity = opacity;
      });
    }

    function frame(now) {
      raf = 0;
      const dt = last ? (now - last) / 1000 : 1 / 60;
      last = now;
      sim.advance(dt);
      render();
      if (sim.settled) last = 0; // Sleep until the next input.
      else raf = requestAnimationFrame(frame);
    }
    const kick = () => { if (!raf && !sim.settled) raf = requestAnimationFrame(frame); };
    const still = () => reduced.matches;

    // Touch (Suphian's pick, option a): wait a beat before squishing, so a finger
    // that starts a scroll on SAY HELLO never plays a false press. A quick tap still
    // gets the squish-and-pop; a finger that travels, or a touch the browser takes
    // for scrolling (pointercancel), gets nothing.
    const TOUCH_PRESS_DELAY = 80; // ms
    const TOUCH_SLOP = 10; // px of finger travel that means "this is a scroll"
    let touchTimer = 0;
    let touchStart = null;
    let touchPressing = false;
    function endTouch(release) {
      clearTimeout(touchTimer);
      touchTimer = 0;
      touchStart = null;
      if (touchPressing && release) { sim.press(false); kick(); }
      touchPressing = false;
    }

    const viewX = (event) => {
      const rect = svg.current.getBoundingClientRect();
      return rect.width ? ((event.clientX - rect.left) / rect.width) * VIEWBOX.width : null;
    };
    input.current = {
      move(event) {
        if (event.pointerType === 'touch') {
          if (touchStart && Math.hypot(event.clientX - touchStart.x, event.clientY - touchStart.y) > TOUCH_SLOP) endTouch(true);
          return;
        }
        if (still() || event.pointerType !== 'mouse' || !finePointer.matches) return;
        sim.hover(viewX(event));
        kick();
      },
      leave() { sim.hover(null); sim.press(false); kick(); },
      down(event) {
        // Primary button only. A macOS ctrl+click is button 0 but opens a context
        // menu and may never send pointerup, so it does not start a press.
        if (still() || (event.pointerType === 'mouse' && (event.button !== 0 || event.ctrlKey))) return;
        if (event.pointerType === 'touch') {
          endTouch(false);
          touchStart = { x: event.clientX, y: event.clientY };
          touchTimer = setTimeout(() => {
            touchTimer = 0;
            touchPressing = true;
            sim.press(true);
            kick();
          }, TOUCH_PRESS_DELAY);
          return;
        }
        sim.press(true);
        kick();
      },
      up(event) {
        if (event?.pointerType === 'touch') {
          const quickTap = touchTimer !== 0; // lifted before the delayed press began
          const pressing = touchPressing;
          endTouch(false);
          if (pressing) sim.press(false);
          else if (quickTap && !still()) sim.tap();
          kick();
          return;
        }
        sim.press(false);
        kick();
      },
      cancel() {
        // The browser claimed the touch for scrolling: never squish for a scroll.
        endTouch(true);
        sim.press(false);
        kick();
      },
      tap() { if (!still()) { sim.tap(); kick(); } },
    };

    function start() {
      cancelAnimationFrame(raf);
      raf = 0;
      last = 0;
      observer?.disconnect();
      observer = null;
      sim.rest();
      if (!still() && 'IntersectionObserver' in window) {
        sim.arm(); // Hidden until the entrance, before first paint.
        observer = new IntersectionObserver(([entry]) => {
          if (!entry.isIntersecting) return;
          observer.disconnect();
          observer = null;
          sim.land();
          kick();
        }, { threshold: 0.35 });
        observer.observe(node);
      }
      render();
    }

    // Switching reduced motion on mid-flight drops straight to the static layout.
    function onPreference() {
      if (!still()) return;
      cancelAnimationFrame(raf);
      raf = 0;
      observer?.disconnect();
      observer = null;
      sim.rest();
      render();
    }

    start();
    reduced.addEventListener('change', onPreference);
    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
      reduced.removeEventListener('change', onPreference);
      clearTimeout(touchTimer);
      input.current = { move: idle, leave: idle, down: idle, up: idle, cancel: idle, tap: idle };
    };
  }, []);

  return (
    <div ref={wrap} id="contact" className="say-hello-wrap">
      <button ref={button} type="button" className="say-hello" aria-label={contact.signoff.label}
        onPointerMove={(event) => input.current.move(event)}
        onPointerLeave={() => input.current.leave()}
        onPointerDown={(event) => input.current.down(event)}
        onPointerUp={(event) => input.current.up(event)}
        onPointerCancel={() => input.current.cancel()}
        onClick={(event) => {
          track('say_hello_clicked');
          openContact('SayHello');
          if (event.detail === 0) input.current.tap(); // Keyboard (Enter / Space): no pointer press to show.
        }}>
        <svg ref={svg} className="say-hello-lettering" viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
          width={VIEWBOX.width} height={VIEWBOX.height} aria-hidden="true" focusable="false">
          <defs dangerouslySetInnerHTML={{ __html: LETTERING_DEFS }} />
          <g ref={word}>
            {LETTERS.map((letter) => (
              <g key={letter.id} data-letter={letter.char} transform={`translate(${letter.x} 0)`}
                dangerouslySetInnerHTML={{ __html: letter.markup }} />
            ))}
          </g>
        </svg>
      </button>
    </div>
  );
}
