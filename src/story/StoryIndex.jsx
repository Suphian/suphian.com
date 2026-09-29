import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import { story } from '../content.js';
import Heading from '../components/Heading.jsx';
import { useSectionViewed } from '../hooks/useSectionViewed.js';
import { track as trackEvent } from '../lib/analytics.js';
import { afterFirstPaint } from '../lib/afterFirstPaint.js';
import StoryCard from './StoryCard.jsx';
import StoryDetail from './StoryDetail.jsx';
import {
  accentOf,
  chapterGroups,
  chapterView,
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
// Each chapter as its rail card shows it: suph.app shows its newest build (chapterView).
const VIEWS = CHAPTERS.map((chapter) => chapterView(chapter));
const ACCENTS = VIEWS.map(accentOf);

// Keyboard focus draws a ring (:focus-visible); the focus a mouse click gives a
// button (Chrome, Firefox) doesn't. Without :focus-visible support: never.
const isKeyboardFocus = (element) => {
  try {
    return element.matches(':focus-visible');
  } catch {
    return false;
  }
};

/**
 * One chapter row. Memoised, like RailCard: a band change re-renders only the
 * rows whose distance from the active chapter changed (at most four) and the
 * two cards that swap is-active, not the whole list and rail.
 */
const StoryRow = memo(function StoryRow({ chapter, index, distance, hidden, buttons, titles, onOpen, onStep, onKeyboardFocus }) {
  return (
    <li
      className="story-item"
      style={{ '--item-accent': ACCENTS[index] }}
      data-distance={distance}
      data-hidden={hidden || undefined}
    >
      <button
        ref={(element) => {
          buttons.current[index] = element;
        }}
        type="button"
        className="story-button"
        aria-current={distance === 0 ? 'true' : undefined}
        aria-haspopup="dialog"
        tabIndex={distance === 0 ? 0 : -1}
        onFocus={(event) => onKeyboardFocus(event, index)}
        onKeyDown={(event) => onStep(event, index)}
        onClick={() => onOpen(index)}
      >
        <span
          ref={(element) => {
            titles.current[index] = element;
          }}
          className="story-item-name"
        >
          {chapter.name}
        </span>
        {metaLine(chapter) && (
          <>
            {' '}
            <span className="story-item-meta">{metaLine(chapter)}</span>
          </>
        )}
        <span className="story-item-arrow" aria-hidden="true">→</span>
      </button>
    </li>
  );
});

/** One rail card. A click opens its chapter; the active card is the one in view. */
const RailCard = memo(function RailCard({ chapter, index, isActive, hidden, imageLoading, cards, onOpen }) {
  return (
    <StoryCard
      cardRef={(element) => {
        cards.current[index] = element;
      }}
      chapter={chapter}
      imageLoading={imageLoading}
      className={isActive ? 'is-active' : ''}
      data-hidden={hidden || undefined}
      onClick={() => onOpen(index)}
    />
  );
});

/**
 * The story index (replaces About, Work and Projects): the heading and the
 * intro line, then chapters on the left and the image rail on the right,
 * inside a sticky stage.
 * - The chapters are two lists: "Work" (the jobs) and, under a quiet "Side
 *   projects" divider, the side projects (content.js kind: 'side'). Selection
 *   treats them as one list of COUNT chapters.
 * - Scroll alone picks the chapter: native scroll through the taller track.
 *   Nothing listens to wheel or touch, and the list is finite. A mouse over a
 *   row never moves the highlight, the marker or the rail (Suphian 2026-09-27:
 *   "remove the hover state and have it function only through scroll. Having
 *   both is a little confusing. If you click, maybe it opens it.").
 * - A click, tap, Enter or Space on any row opens that chapter (StoryDetail),
 *   active or not, and so does a click on a rail card. Opening doesn't move
 *   the highlight. Back or Escape closes it and focus returns to the row.
 * - Keyboard: arrow keys (Home/End too) move the highlight and focus, and
 *   keyboard focus on a row highlights it, so the ring and the highlight agree.
 * - ≤ 800px wide (or ≤ 560px tall): a plain single-column list, no pinning; a
 *   tap opens the chapter full screen.
 * - Every mark takes its chapter's accent (accentOf), never a fixed red.
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
  // True from a chapter opening until focus is back on its row: the focus the
  // open view's trap hands back to its opener on close is not a pick.
  const handingBack = useRef(false);

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

  // Scroll position → chapter: one rect read per frame, and a state change only
  // when the band changes, so nothing re-renders while the scroll stays inside
  // a band. A keyboard pick holds until the reader scrolls into another band.
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
  // goes back to the chapter that opened it. Handing focus back is not a pick:
  // the highlight stays where the scroll put it.
  useEffect(() => {
    if (open !== null || returnTo.current === null) return;
    buttons.current[returnTo.current]?.focus({ preventScroll: true });
    returnTo.current = null;
    handingBack.current = false;
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

  // The one place a chapter opens, so story_chapter_opened fires once per open.
  const openAt = useCallback((index) => {
    trackEvent('story_chapter_opened', { chapter: CHAPTERS[index].id });
    returnTo.current = index;
    handingBack.current = true;
    setOpen(index);
  }, []);
  const onClosed = useCallback(() => setOpen(null), []);

  // One index across both lists: ArrowDown from the last job lands on the first side project.
  const onStep = useCallback((event, index) => {
    const next = stepIndex(index, event.key, COUNT);
    if (next === null) return;
    event.preventDefault();
    select(next);
    buttons.current[next]?.focus({ preventScroll: true });
  }, [select]);

  const onKeyboardFocus = useCallback((event, index) => {
    if (!handingBack.current && isKeyboardFocus(event.currentTarget)) select(index);
  }, [select]);

  return (
    <section ref={section} id={story.id} className="section story" aria-labelledby="story-title" tabIndex={-1} style={{ '--count': COUNT }}>
      {/* Just the heading and the intro line: no actions here (Suphian). */}
      <div className="story-head">
        <Heading id="story-title" className="story-heading" lines={story.heading} />
        <p className="story-intro">{story.intro}</p>
      </div>

      <div ref={track} className="story-track">
        <div className="story-stage">
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
                    {group.chapters.map((chapter, offset) => {
                      const index = group.start + offset;
                      return (
                        <StoryRow
                          key={chapter.id}
                          chapter={chapter}
                          index={index}
                          distance={distanceBucket(index, active)}
                          hidden={open === index}
                          buttons={buttons}
                          titles={titles}
                          onOpen={openAt}
                          onStep={onStep}
                          onKeyboardFocus={onKeyboardFocus}
                        />
                      );
                    })}
                  </ol>
                </React.Fragment>
              ))}
              {/* The active index sits on the two elements that read it, the marker
                  and the rail track, not on the stage: a custom property changed on
                  the stage restyled all ~70 elements in it on every band change. */}
              <span
                className="story-marker"
                aria-hidden="true"
                style={{
                  '--active': active,
                  // Dividers above the active row, so the marker steps over them.
                  '--active-group': groupIndexOf(GROUPS, active),
                  '--accent': ACCENTS[active],
                }}
              />
            </div>
          </div>

          {/* Mouse shortcut only: the lists are the accessible control. */}
          <div className="story-rail" aria-hidden="true">
            <div className="story-rail-track" style={{ '--active': active }}>
              {VIEWS.map((chapter, index) => (
                <RailCard
                  key={chapter.id}
                  chapter={chapter}
                  index={index}
                  isActive={index === active}
                  hidden={open === index}
                  imageLoading={railImages}
                  cards={cards}
                  onOpen={openAt}
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
