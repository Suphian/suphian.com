import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { story } from '../content.js';
import ExternalLink from '../components/ExternalLink.jsx';
import { useFocusTrap } from '../hooks/useFocusTrap.js';
import { prefersReducedMotion } from '../lib/scroll.js';
import StoryBuilds from './StoryBuilds.jsx';
import StoryCard, { preloadCardImage } from './StoryCard.jsx';
import { accentFor, buildsOf, chapterView, clampIndex, flipDelta, panelBuild, toTransform } from './logic.js';

const EASE = 'cubic-bezier(.2, .8, .2, 1)';
const OPEN_MS = 680;
const CLOSE_MS = 540;
// suph.app's image panel: one build's icon crossfades into another's.
const SWAP_MS = 200;
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
 * A chapter made of monthly builds (suph.app) lists them all under its heading,
 * newest first (StoryBuilds; Suphian 2026-09-28: "It should just be a list").
 * The image panel shows the newest build's icon, or the build under a mouse
 * pointer or keyboard focus, crossfading between them (instant under reduced
 * motion); touch leaves it on the newest. No event beyond the open and the
 * links' own outbound_link_clicked.
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

  const builds = buildsOf(chapter);
  // The build whose icon the panel shows: 0, the newest, unless a pointer or focus picks another.
  const [shown, setShown] = useState(0);
  const shownRef = useRef(0);
  const fadeIn = useRef(false);
  const view = chapterView(chapter, shown);

  const fading = () => [...dialog.current.querySelectorAll('[data-fade]')];
  const panelLogo = () => panel.current?.querySelector('.story-card-logo:not([data-leaving]), .story-card-name');

  // Every build's icon, loaded now, so the panel paints each one on its first frame.
  useEffect(() => {
    builds.forEach((build) => preloadCardImage(build.image?.src));
    // Once per open: the builds come from content.js and never change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Show build `next` in the panel. A crossfade: a copy of the current icon fades out on
  // top while the new one fades in (both sit in the card's one grid cell).
  const showBuild = useCallback((next) => {
    const at = clampIndex(next, builds.length);
    if (at === shownRef.current) return;
    shownRef.current = at;
    const old = panelLogo();
    if (old && !prefersReducedMotion()) {
      panel.current.querySelectorAll('[data-leaving]').forEach((ghost) => ghost.remove());
      const ghost = old.cloneNode(true);
      ghost.setAttribute('data-leaving', '');
      panel.current.append(ghost);
      const from = getComputedStyle(old).opacity;
      const fade = ghost.animate([{ opacity: from }, { opacity: 0 }], { duration: SWAP_MS, easing: 'ease-out', fill: 'forwards' });
      fade.finished.then(() => ghost.remove(), () => ghost.remove());
      fadeIn.current = true;
    }
    setShown(at);
  }, [builds.length]);

  // What a pointer, focus or leaving the list asks for (logic.js panelBuild).
  const onBuildEvent = useCallback((event) => showBuild(panelBuild(shownRef.current, event)), [showBuild]);

  // The new icon is in the DOM: fade it in before it paints.
  useLayoutEffect(() => {
    if (!fadeIn.current) return;
    fadeIn.current = false;
    panelLogo()?.animate([{ opacity: 0 }, { opacity: 1 }], { duration: SWAP_MS, easing: 'ease-out' });
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
    // The panel flies back to a rail card that shows the newest build: show it on the way.
    showBuild(0);

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
  }, [index, originFor, onClosed, showBuild]);

  useFocusTrap(true, dialog, { onClose: close, initialFocus: heading });

  return createPortal(
    <div
      ref={dialog}
      className="story-detail"
      style={{ '--accent': accentFor(chapterView(chapter).color) }}
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
          <StoryCard chapter={view} cardRef={panel} className="story-card--panel" />
        </div>

        <div className="story-detail-body" data-fade>
          {builds.length > 0 ? (
            // suph.app: its intro line, its own link, then every build (no role or years line).
            <StoryBuilds chapter={chapter} introId={metaId} onBuildEvent={onBuildEvent} />
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
