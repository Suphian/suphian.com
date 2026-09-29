/**
 * Pure logic for the story index (no DOM, no React), so node:test can cover it.
 * See logic.test.mjs; run with `node --test src/story/`.
 */

export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
export const clamp01 = (n) => clamp(n, 0, 1);

/** Nearest valid index for a list of `count` items. NaN and empty lists give 0. */
export function clampIndex(index, count) {
  if (!(count > 0) || !Number.isFinite(index)) return 0;
  return clamp(Math.round(index), 0, count - 1);
}

/**
 * Progress through a pinned (sticky) track, from its bounding rect:
 * 0 while its top is at or below the viewport top, 1 once its bottom reaches
 * the viewport bottom. A track no taller than the viewport has no travel: 0.
 */
export function trackProgress(top, height, viewport) {
  const travel = height - viewport;
  if (!(travel > 0) || !Number.isFinite(top)) return 0;
  return clamp01(-top / travel);
}

/** Equal scroll bands, one per item: [0, 1/n) → 0 … [(n-1)/n, 1] → n-1. Finite, no wrap. */
export function indexFromProgress(progress, count) {
  if (!(count > 0)) return 0;
  const p = Number.isFinite(progress) ? clamp01(progress) : 0;
  return Math.min(count - 1, Math.floor(p * count));
}

/**
 * Scroll only takes over when the band changes, so a chapter picked with the
 * keyboard survives small scrolls inside the same band. (Hover never picks:
 * Suphian 2026-09-27.)
 */
export function followScroll(previousBand, band, active) {
  return band === previousBand ? active : band;
}

/**
 * Keyboard stepping for the chapter list. Returns the next index, or null when
 * the key isn't a stepping key (let the browser handle it). Finite: the ends stop.
 */
export function stepIndex(current, key, count) {
  if (!(count > 0)) return null;
  const at = clampIndex(current, count);
  switch (key) {
    case 'ArrowDown':
    case 'ArrowRight':
      return Math.min(count - 1, at + 1);
    case 'ArrowUp':
    case 'ArrowLeft':
      return Math.max(0, at - 1);
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return null;
  }
}

/** Distance bucket for fading list neighbours: 0 (active), 1, then 2 for everything further. */
export const distanceBucket = (index, active) => Math.min(2, Math.abs(index - active));

/**
 * The accent a chapter's company color gives its marks on the near-black page
 * (list marker, the title's period, the back arrow). A color too dark to see on
 * the page, like Abacus Labs' black, falls back to white.
 */
export function accentFor(color, fallback = '#FFFFFF') {
  const match = /^#([0-9a-f]{6})$/i.exec(color || '');
  if (!match) return fallback;
  const channel = (i) => {
    const c = parseInt(match[1].slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = 0.2126 * channel(0) + 0.7152 * channel(2) + 0.0722 * channel(4);
  return luminance < 0.02 ? fallback : color;
}

/**
 * The accent a chapter (or its card view) actually uses: its own `accent` when
 * content.js sets one, else accentFor its color. suph.app's forest green is too
 * dark to see as a mark on the page, but not dark enough for accentFor's white
 * fallback, so it names the Quran site's pale sage instead (Suphian 2026-09-28).
 */
export const accentOf = (view) => view?.accent ?? accentFor(view?.color);

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** A build's month, 'YYYY-MM', as the site writes it: "September 2026" (en-US, never abbreviated). Anything else: ''. */
export function formatMonth(month) {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(month ?? '');
  return match ? `${MONTHS[Number(match[2]) - 1]} ${match[1]}` : '';
}

/** A chapter's builds (suph.app's projects, newest first); [] for a chapter without any. */
export const buildsOf = (chapter) => (Array.isArray(chapter?.builds) ? chapter.builds : []);

/**
 * Which build suph.app's image panel shows, 0 being the newest (Suphian
 * 2026-09-28: the image changes with the project). `event` is what the open
 * card's list reports (StoryBuilds):
 * - { type: 'enter', index, pointerType, finePointer }: a pointer rests on a build.
 *   Only a mouse on a fine-pointer screen picks it; a finger never does.
 * - { type: 'leave', pointerType, finePointer }: that mouse leaves the list: the newest.
 * - { type: 'focus', index, keyboard }: focus lands inside a build. Only keyboard
 *   focus picks it, not the focus a tap or click leaves behind.
 * - { type: 'blur', inside }: focus moves; out of the list (inside false) means the newest.
 * Anything else keeps `current`.
 */
export function panelBuild(current, event) {
  const mouse = event?.pointerType === 'mouse' && event.finePointer === true;
  switch (event?.type) {
    case 'enter':
      return mouse && Number.isInteger(event.index) ? event.index : current;
    case 'leave':
      return mouse ? 0 : current;
    case 'focus':
      return event.keyboard === true && Number.isInteger(event.index) ? event.index : current;
    case 'blur':
      return event.inside ? current : 0;
    default:
      return current;
  }
}

/**
 * The chapter as its card shows it. A chapter with builds (suph.app) wears one
 * build's image and color (build.color, else the chapter's): the newest, unless
 * `index` asks for another (the open card's panel). Any other chapter comes back
 * as it is.
 */
export function chapterView(chapter, index = 0) {
  const builds = buildsOf(chapter);
  if (!builds.length) return chapter;
  const build = builds[clampIndex(index, builds.length)];
  return { ...chapter, image: build.image, color: build.color || chapter.color };
}

/**
 * The line beside the active item: "Role · Years", the same for every chapter
 * (Suphian 2026-09-28: suph.app takes Abacus Labs' format). Skips empty parts,
 * so suph.app, which has no role, reads just "Current".
 */
export const metaLine = (chapter) => [chapter.role, chapter.period].filter(Boolean).join(' · ');

/**
 * The chapters as the list shows them: two labelled lists, the jobs ('work')
 * first and then the side projects (content.js kind: 'side'), each in its
 * content.js order. `start` is each list's first index in ONE continuous
 * index, so scroll bands, arrow keys, the marker and the rail treat both lists
 * as a single list of chapters. An empty list is dropped, so a divider only
 * ever sits between two real lists.
 */
export function chapterGroups(chapters, labels = {}) {
  const all = Array.isArray(chapters) ? chapters : [];
  const groups = [
    { kind: 'work', label: labels.work, chapters: all.filter((chapter) => chapter?.kind !== 'side') },
    { kind: 'side', label: labels.side, chapters: all.filter((chapter) => chapter?.kind === 'side') },
  ].filter((group) => group.chapters.length > 0);
  let start = 0;
  for (const group of groups) {
    group.start = start;
    start += group.chapters.length;
  }
  return groups;
}

/** Which list (0, 1) a continuous index falls in: also the number of dividers above it. */
export function groupIndexOf(groups, index) {
  let found = 0;
  groups.forEach((group, g) => {
    if (index >= group.start) found = g;
  });
  return found;
}

/**
 * Logo width on its card, as a percentage of the card's width, so wide and
 * compact marks look the same size: the area stays constant, so the width
 * grows with the square root of the aspect ratio (width / height). Unknown
 * aspects get a middle size; the result stays within [min, max].
 */
export function logoWidth(aspect, { base = 24, min = 18, max = 68 } = {}) {
  if (!(aspect > 0) || !Number.isFinite(aspect)) return 40;
  return Math.round(clamp(base * Math.sqrt(aspect), min, max) * 10) / 10;
}

/**
 * A chapter's card image as { src, nudge }. `image` is { src, nudge } in
 * content.js; a bare path string (or nothing) still works, with no nudge.
 */
export function cardImage(image) {
  if (typeof image === 'string') return { src: image || null, nudge: 0 };
  const src = image && typeof image.src === 'string' && image.src ? image.src : null;
  const nudge = Number.isFinite(image?.nudge) ? clamp(image.nudge, -0.25, 0.25) : 0;
  return { src, nudge };
}

/**
 * The logo's optical nudge as a CSS transform: a fraction of its own height,
 * positive moves it down (src/story/logo-geometry.js derives the values).
 * No transform at all when there is nothing to move.
 */
export function logoShift(nudge) {
  if (!Number.isFinite(nudge) || Math.abs(nudge) < 0.0005) return undefined;
  return `translateY(${Math.round(nudge * 1000) / 10}%)`;
}

/**
 * FLIP: the inverse transform that makes an element now at `last` look like it
 * is still at `first` (transform-origin: 0 0). `scale` forces a uniform scale
 * (text); otherwise width and height scale independently (cards).
 */
export function flipDelta(first, last, { scale } = {}) {
  const ratio = (a, b) => (b > 0 && a > 0 ? a / b : 1);
  const sx = scale ?? ratio(first.width, last.width);
  const sy = scale ?? ratio(first.height, last.height);
  return { x: first.left - last.left, y: first.top - last.top, sx, sy };
}

export const toTransform = ({ x, y, sx, sy }) => `translate(${x}px, ${y}px) scale(${sx}, ${sy})`;

/** A rect is worth flying from only if it has size and touches the viewport. */
export function isVisibleRect(rect, viewportWidth, viewportHeight) {
  if (!rect || !(rect.width > 0) || !(rect.height > 0)) return false;
  return rect.bottom > 0 && rect.right > 0 && rect.top < viewportHeight && rect.left < viewportWidth;
}
