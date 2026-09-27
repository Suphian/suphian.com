import React, { useCallback, useEffect, useRef, useState } from 'react';
import { story } from '../content.js';
import Heading from '../components/Heading.jsx';
import { useSectionViewed } from '../hooks/useSectionViewed.js';
import { track as trackEvent } from '../lib/analytics.js';
import { afterFirstPaint } from '../lib/afterFirstPaint.js';
import StoryCard from './StoryCard.jsx';
import StoryDetail from './StoryDetail.jsx';
import {
  accentFor,
  chapterGroups,
  clampIndex,
  distanceBucket,
  followScroll,
  groupIndexOf,
  indexFromProgress,
  isVisibleRect,
  metaLine,
  stepIndex,
  trackProgress,
} from './logic.js';
import './story.css';

// Matches the single-column breakpoint in story.css: no pinned track there.
// Short windows (phones held sideways, small laptop windows) can't fit the six
// rows and the divider in the pinned stage, so they stack too.
const STACKED = '(max-width: 800px), (max-height: 560px)';
// Two labelled lists, the jobs and then the side projects, with one continuous
// index through both: CHAPTERS is the order on screen, and every index below
// (scroll band, keys, marker, rail, open view) points into it.
const GROUPS = chapterGroups(story.chapters, { work: story.labels.list, side: story.labels.sideProjects });
const CHAPTERS = GROUPS.flatMap((group) => group.chapters);
const COUNT = CHAPTERS.length;

/**
 * The story index (replaces About, Work and Projects): the heading and the
 * intro line, then chapters on the left and the image rail on the right,
 * inside a sticky stage.
 * - The chapters are two lists: "Work" (the jobs) and, under a quiet "Side
 *   projects" divider, the side projects (content.js kind: 'side'). Selection
 *   treats them as one list of COUNT chapters.
 * - Native scroll through the taller track picks the chapter. Nothing listens
 *   to wheel or touch, and the list is finite.
 * - Mouse movement over a chapter, focus, arrow keys (Home/End too) and clicks
 *   also pick. Enter or click opens the chapter (StoryDetail); Back or Escape
 *   closes it and focus returns here.
 * - ≤ 800px wide (or ≤ 560px tall): a plain single-column list, no pinning; a
 *   tap opens the chapter full screen.
 * - Every mark takes its chapter's accent (accentFor), never a fixed red.
 */
export default function StoryIndex() {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(null);
  const section = useRef(null);
  const track = useRef(null);
  const buttons = useRef([]);
  const titles = useRef([]);
  const cards = useRef([]);
  const band = useRef(-1);
  const returnTo = useRef(null);

  const select = useCallback((index) => setActive(clampIndex(index, COUNT)), []);
  useSectionViewed(section, 'story');

  // Rail logos (345 kB, the Abacus PNG most of it) start lazy, so only cards on
  // screen load with the first paint (none on phones, where the rail is hidden),
  // then all of them right after it, so the open view still paints its logo on
  // the first frame. Suphian 2026-09-27: snappier in aggregate.
  const [railImages, setRailImages] = useState('lazy');
  useEffect(() => {
    let live = true;
    afterFirstPaint(() => live && setRailImages('eager'));
    return () => { live = false; };
  }, []);

  // Scroll position → chapter. Only a band change moves the selection, so a
  // hover or keyboard pick holds until the reader scrolls into another band.
  useEffect(() => {
    const node = track.current;
    if (!node) return undefined;
    const media = window.matchMedia(STACKED);
    let frame = 0;
    const update = () => {
      frame = 0;
      if (media.matches) {
        band.current = -1;
        return;
      }
      const rect = node.getBoundingClientRect();
      const next = indexFromProgress(trackProgress(rect.top, rect.height, window.innerHeight), COUNT);
      const previous = band.current;
      band.current = next;
      if (next !== previous) setActive((current) => followScroll(previous, next, current));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    media.addEventListener('change', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      media.removeEventListener('change', schedule);
    };
  }, []);

  // After the open view unmounts (and the page is interactive again), focus
  // goes back to the chapter that opened it.
  useEffect(() => {
    if (open !== null || returnTo.current === null) return;
    buttons.current[returnTo.current]?.focus({ preventScroll: true });
    returnTo.current = null;
  }, [open]);

  // Where the FLIP flies from and back to: the list title and the rail card, if on screen.
  const originFor = useCallback((index) => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const title = titles.current[index];
    const titleRect = title?.getBoundingClientRect();
    const cardRect = cards.current[index]?.getBoundingClientRect();
    return {
      title: isVisibleRect(titleRect, width, height) ? titleRect : null,
      titleSize: title ? parseFloat(getComputedStyle(title).fontSize) || 1 : 1,
      card: isVisibleRect(cardRect, width, height) ? cardRect : null,
    };
  }, []);

  const openAt = (index) => {
    trackEvent('story_chapter_opened', { chapter: CHAPTERS[index].id });
    select(index);
    returnTo.current = index;
    setOpen(index);
  };
  const onClosed = useCallback(() => setOpen(null), []);

  // One index across both lists: ArrowDown from the last job lands on the first side project.
  const onKeyDown = (event, index) => {
    const next = stepIndex(index, event.key, COUNT);
    if (next === null) return;
    event.preventDefault();
    select(next);
    buttons.current[next]?.focus({ preventScroll: true });
  };

  // Real mouse movement only: the synthetic moves browsers send after a scroll
  // (movement 0) must not steal the chapter that scrolling just picked.
  const onPointerMove = (event, index) => {
    if (event.pointerType !== 'mouse' || index === active) return;
    if (event.movementX === 0 && event.movementY === 0) return;
    select(index);
  };

  const renderItem = (chapter, index) => (
    <li
      key={chapter.id}
      className="story-item"
      style={{ '--item-accent': accentFor(chapter.color) }}
      data-distance={distanceBucket(index, active)}
      data-hidden={open === index || undefined}
    >
      <button
        ref={(element) => {
          buttons.current[index] = element;
        }}
        type="button"
        className="story-button"
        aria-current={index === active ? 'true' : undefined}
        aria-haspopup="dialog"
        tabIndex={index === active ? 0 : -1}
        onPointerMove={(event) => onPointerMove(event, index)}
        onFocus={() => select(index)}
        onKeyDown={(event) => onKeyDown(event, index)}
        onClick={() => openAt(index)}
      >
        <span
          ref={(element) => {
            titles.current[index] = element;
          }}
          className="story-item-name"
        >
          {chapter.name}
        </span>{' '}
        <span className="story-item-meta">{metaLine(chapter)}</span>
        <span className="story-item-arrow" aria-hidden="true">→</span>
      </button>
    </li>
  );

  return (
    <section ref={section} id={story.id} className="section story" aria-labelledby="story-title" tabIndex={-1} style={{ '--count': COUNT }}>
      {/* Just the heading and the intro line: no actions here (Suphian). */}
      <div className="story-head">
        <Heading id="story-title" className="story-heading" lines={story.heading} />
        <p className="story-intro">{story.intro}</p>
      </div>

      <div ref={track} className="story-track">
        <div
          className="story-stage"
          style={{
            '--active': active,
            // Dividers above the active row, so the marker steps over them.
            '--active-group': groupIndexOf(GROUPS, active),
            '--accent': accentFor(CHAPTERS[active]?.color),
          }}
        >
          <div className="story-list-wrap">
            <div className="story-list-box">
              {GROUPS.map((group, g) => (
                <React.Fragment key={group.kind}>
                  {/* The quiet "Side projects" divider between the lists. Not a chapter:
                      no button, never selected. Hidden from screen readers, which hear
                      the same words as the list's own label. */}
                  {g > 0 && (
                    <div className="story-divider" aria-hidden="true">
                      {group.label}
                    </div>
                  )}
                  {/* role="list": Safari drops list semantics from unstyled lists. */}
                  <ol className="story-list" role="list" aria-label={group.label}>
                    {group.chapters.map((chapter, offset) => renderItem(chapter, group.start + offset))}
                  </ol>
                </React.Fragment>
              ))}
              <span className="story-marker" aria-hidden="true" />
            </div>
          </div>

          {/* Mouse shortcut only: the lists are the accessible control. */}
          <div className="story-rail" aria-hidden="true">
            <div className="story-rail-track">
              {CHAPTERS.map((chapter, index) => (
                <StoryCard
                  key={chapter.id}
                  cardRef={(element) => {
                    cards.current[index] = element;
                  }}
                  chapter={chapter}
                  imageLoading={railImages}
                  className={index === active ? 'is-active' : ''}
                  data-hidden={open === index || undefined}
                  onClick={() => (index === active ? openAt(index) : select(index))}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {open !== null && (
        <StoryDetail chapter={CHAPTERS[open]} index={open} originFor={originFor} onClosed={onClosed} />
      )}
    </section>
  );
}
