import React, { useCallback, useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { story } from '../content.js';
import ExternalLink from '../components/ExternalLink.jsx';
import { useFocusTrap } from '../hooks/useFocusTrap.js';
import { prefersReducedMotion } from '../lib/scroll.js';
import StoryCard from './StoryCard.jsx';
import { accentFor, flipDelta, toTransform } from './logic.js';

const EASE = 'cubic-bezier(.2, .8, .2, 1)';
const OPEN_MS = 680;
const CLOSE_MS = 540;
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

  const fading = () => [...dialog.current.querySelectorAll('[data-fade]')];

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
      style={{ '--accent': accentFor(chapter.color) }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={metaId}
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
          <StoryCard chapter={chapter} cardRef={panel} className="story-card--panel" />
        </div>

        <div className="story-detail-body" data-fade>
          <div id={metaId}>
            <p className="story-detail-role">{chapter.role}</p>
            <p className="story-detail-years">
              {chapter.location ? `${chapter.period} · ${chapter.location}` : chapter.period}
            </p>
          </div>
          {chapter.summary && <p className="story-detail-summary">{chapter.summary}</p>}
          {chapter.links?.length > 0 && (
            <ul className="story-links">
              {chapter.links.map((link) => (
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
