import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { story } from '../content.js';
import ExternalLink from '../components/ExternalLink.jsx';
import { useFocusTrap } from '../hooks/useFocusTrap.js';
import { track } from '../lib/analytics.js';
import { prefersReducedMotion } from '../lib/scroll.js';
import StoryCard, { preloadCardImage } from './StoryCard.jsx';
import StoryMonths from './StoryMonths.jsx';
import { accentFor, buildsOf, chapterView, clampIndex, flipDelta, hasMonthToggle, toTransform } from './logic.js';

const EASE = 'cubic-bezier(.2, .8, .2, 1)';
const OPEN_MS = 680;
const CLOSE_MS = 540;
// suph.app's month swap: the old build fades out, the new one fades in.
const SWAP_OUT_MS = 140;
const SWAP_IN_MS = 240;
const fontSize = (element) => parseFloat(getComputedStyle(element).fontSize) || 1;
// Uniform scale from the card's width: the rail card and the panel share one aspect ratio.
const cardScale = (first, last) => (first.width > 0 && last.width > 0 ? first.width / last.width : 1);

/**
 * The open chapter, a modal view portalled to <body>. It shows only what the
 * old site said about the job: role, years, the summary and the links.
 * FLIP on open and close: the list title grows into the heading and the rail
 * card into the image panel, measured from `originFor(index)`; the rest fades
 * in. Reduced motion: no animation, same structure. Escape or Back closes, and
 * focus returns to the chapter in the list (StoryIndex).
 *
 * A chapter made of monthly builds (suph.app) always opens on its newest build:
 * this view mounts fresh on every open. With two or more builds, the month
 * toggle (StoryMonths) steps through them, and the build's name, month, card
 * image, summary and links crossfade (instant under reduced motion). Each step
 * sends suph_app_month_viewed { month }; opening sends nothing extra.
 */
export default function StoryDetail({ chapter, index, originFor, onClosed }) {
  const dialog = useRef(null);
  const heading = useRef(null);
  const name = useRef(null);
  const panel = useRef(null);
  const backdrop = useRef(null);
  const running = useRef([]);
  const closing = useRef(false);
  const titleId = `story-detail-${chapter.id}`;
  const metaId = `${titleId}-meta`;
  const monthId = `${titleId}-month`;

  const builds = buildsOf(chapter);
  const toggles = hasMonthToggle(builds);
  const [shown, setShown] = useState(0);
  const view = chapterView(chapter, shown);
  const shownRef = useRef(0);
  const target = useRef(0);
  const swapOut = useRef(null);
  const swapped = useRef(false);

  const fading = () => [...dialog.current.querySelectorAll('[data-fade]')];
  // What changes with the month: the build's name and month, summary and links, and the panel's logo.
  const swapping = () => [...dialog.current.querySelectorAll('[data-swap], .story-card--panel > .story-card-logo, .story-card--panel > .story-card-name')];

  // Every build's card image, loaded now, so a month step paints its icon on the first frame.
  useEffect(() => {
    if (toggles) builds.forEach((build) => preloadCardImage(build.image?.src));
    // Once per open: the builds come from content.js and never change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A month step: fade the current build out, then show the newest target. Steps
  // taken during the fade just move the target, so fast clicks land on the last one.
  const showBuild = useCallback((next) => {
    const at = clampIndex(next, builds.length);
    if (at === target.current) return;
    target.current = at;
    track('suph_app_month_viewed', { month: builds[at].month });
    if (swapOut.current) return;
    if (prefersReducedMotion() || !dialog.current) {
      shownRef.current = at;
      setShown(at);
      return;
    }
    const outs = swapping().map((element) =>
      element.animate([{ opacity: 1 }, { opacity: 0 }], { duration: SWAP_OUT_MS, easing: 'ease-in', fill: 'forwards' }),
    );
    swapOut.current = outs;
    const land = () => {
      if (swapOut.current !== outs) return;
      if (target.current === shownRef.current) {
        // Stepped away and back during the fade: nothing to swap, just fade back in.
        swapOut.current = null;
        outs.forEach((animation) => animation.reverse());
        return;
      }
      swapped.current = true;
      shownRef.current = target.current;
      setShown(target.current);
    };
    Promise.all(outs.map((animation) => animation.finished)).then(land, land);
  }, [builds]);

  // The new build is in the DOM: drop the fade-out and fade it in, before it paints.
  useLayoutEffect(() => {
    if (!swapped.current) return;
    swapped.current = false;
    (swapOut.current ?? []).forEach((animation) => animation.cancel());
    swapOut.current = null;
    for (const element of swapping()) {
      element.animate([{ opacity: 0 }, { opacity: 1 }], { duration: SWAP_IN_MS, easing: 'ease-out' });
    }
  }, [shown]);

  // Open: play the FLIP from the list's current positions.
  useLayoutEffect(() => {
    if (prefersReducedMotion()) return undefined;
    const origin = originFor(index);
    const both = { easing: EASE, fill: 'both' };
    const anims = [
      backdrop.current.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: 'ease-out', fill: 'both' }),
    ];
    if (origin.title) {
      const scale = origin.titleSize / fontSize(name.current);
      const delta = flipDelta(origin.title, name.current.getBoundingClientRect(), { scale });
      anims.push(name.current.animate([{ transform: toTransform(delta) }, { transform: 'none' }], { ...both, duration: OPEN_MS }));
    } else {
      anims.push(name.current.animate([{ opacity: 0, transform: 'translateY(16px)' }, { opacity: 1, transform: 'none' }], { ...both, duration: 520 }));
    }
    if (origin.card) {
      const last = panel.current.getBoundingClientRect();
      const delta = flipDelta(origin.card, last, { scale: cardScale(origin.card, last) });
      anims.push(panel.current.animate([{ transform: toTransform(delta) }, { transform: 'none' }], { ...both, duration: OPEN_MS }));
    } else {
      anims.push(panel.current.animate([{ opacity: 0, transform: 'scale(.97)' }, { opacity: 1, transform: 'none' }], { ...both, duration: 520, delay: 120 }));
    }
    for (const element of fading()) {
      anims.push(element.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { ...both, duration: 460, delay: 300 }));
    }
    running.current = anims;
    return () => anims.forEach((animation) => animation.cancel());
    // Runs once per open; originFor is stable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close: the reverse FLIP back to wherever the list title and card sit now.
  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    running.current.forEach((animation) => animation.cancel());
    running.current = [];

    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      onClosed();
    };
    if (prefersReducedMotion() || !dialog.current) {
      finish();
      return;
    }

    const origin = originFor(index);
    const forwards = { easing: EASE, fill: 'forwards', duration: CLOSE_MS };
    const fadeOut = { duration: 220, easing: 'ease-out', fill: 'forwards' };
    const anims = [];
    if (origin.title) {
      const scale = origin.titleSize / fontSize(name.current);
      const delta = flipDelta(origin.title, name.current.getBoundingClientRect(), { scale });
      anims.push(name.current.animate([{ transform: 'none' }, { transform: toTransform(delta) }], forwards));
    } else {
      anims.push(name.current.animate([{ opacity: 1 }, { opacity: 0 }], fadeOut));
    }
    if (origin.card) {
      const last = panel.current.getBoundingClientRect();
      const delta = flipDelta(origin.card, last, { scale: cardScale(origin.card, last) });
      anims.push(panel.current.animate([{ transform: 'none' }, { transform: toTransform(delta) }], forwards));
    } else {
      anims.push(panel.current.animate([{ opacity: 1 }, { opacity: 0 }], fadeOut));
    }
    for (const element of fading()) anims.push(element.animate([{ opacity: 1 }, { opacity: 0 }], { ...fadeOut, duration: 180 }));
    anims.push(
      backdrop.current.animate([{ opacity: 1 }, { opacity: 0 }], { duration: CLOSE_MS - 140, delay: 140, easing: 'ease-in-out', fill: 'forwards' }),
    );
    Promise.all(anims.map((animation) => animation.finished)).then(finish, finish);
    // A hidden tab can stall animations; never leave the view stuck open.
    window.setTimeout(finish, CLOSE_MS + 400);
  }, [index, originFor, onClosed]);

  useFocusTrap(true, dialog, { onClose: close, initialFocus: heading });

  return createPortal(
    <div
      ref={dialog}
      className="story-detail"
      style={{ '--accent': accentFor(view.color) }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={toggles ? `${metaId} ${monthId}` : metaId}
      tabIndex={-1}
    >
      <div ref={backdrop} className="story-detail-backdrop" aria-hidden="true" />
      <div className="story-detail-grid">
        <div className="story-detail-top">
          <button type="button" className="story-back" data-fade onClick={close}>
            <span className="story-back-arrow" aria-hidden="true">←</span>
            {story.labels.back}
          </button>
          <h2 id={titleId} ref={heading} className="story-detail-title" tabIndex={-1}>
            <span ref={name} className="story-detail-name">
              {chapter.name}
              <span className="story-detail-period" data-fade>.</span>
            </span>
          </h2>
        </div>

        <div className="story-detail-media">
          <StoryCard chapter={view} cardRef={panel} className="story-card--panel" />
        </div>

        {/* For a chapter with builds, `view` is the build on show: its name is the role
            line and its month the years line (logic.js chapterView). */}
        <div className="story-detail-body" data-fade>
          <div id={metaId}>
            <p className="story-detail-role" data-swap>{view.role}</p>
            {/* The month toggle takes the years line's place, the month between its buttons. */}
            {!toggles && (
              <p className="story-detail-years">
                {view.location ? `${view.period} · ${view.location}` : view.period}
              </p>
            )}
          </div>
          <StoryMonths builds={builds} index={shown} labelId={monthId} onChange={showBuild} />
          {view.summary && <p className="story-detail-summary" data-swap>{view.summary}</p>}
          {view.links?.length > 0 && (
            <ul className="story-links" data-swap>
              {view.links.map((link) => (
                <li key={link.href}>
                  <ExternalLink href={link.href} className="story-link" chapter={chapter.id}>
                    {link.label}
                  </ExternalLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
