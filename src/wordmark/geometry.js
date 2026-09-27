/**
 * Dock geometry: where the word sits as the full-width hero and as the docked
 * header logo. Pure math on viewport numbers, so the renderer's measure() and
 * the node filmstrip share one definition.
 */
import { FULL_VIEWBOX, COMPACT_VIEWBOX } from './lettering.js';
import { MOTION } from './motion.js';

/**
 * @param {object} viewport
 * @param {number} viewport.width        document client width, px
 * @param {number} viewport.heroHeight   height of [data-wordmark-hero] (or the screen), px
 * @param {number} [viewport.safeTop]
 * @param {number} [viewport.safeLeft]
 * @param {number} [viewport.safeRight]
 */
export function dockMetrics({ width, heroHeight: height, safeTop = 0, safeLeft = 0, safeRight = 0 }, params = MOTION) {
  const margin = width < 640 ? 16 : 32;
  const heroMargin = width < 640 ? 9 : 12;
  const usableWidth = width - safeLeft - safeRight;
  const maxWidth = usableWidth - heroMargin * 2;
  const maxHeight = Math.min(height * 0.69, Math.max(60, height - 170));
  const startScale = Math.min(maxWidth / FULL_VIEWBOX.width, maxHeight / FULL_VIEWBOX.height);
  const actualWidth = FULL_VIEWBOX.width * startScale;
  const logoWidth = width < 640 ? params.mobileLogoWidth : params.logoWidth;
  const endScale = logoWidth / COMPACT_VIEWBOX.width;
  return {
    width,
    height,
    logoWidth,
    margin: safeLeft + (usableWidth - actualWidth) / 2,
    startScale,
    startY: (height - FULL_VIEWBOX.height * startScale) * 0.445,
    endScale,
    endX: width - safeRight - margin - logoWidth,
    endY: safeTop + 16,
  };
}

/** Global word transform for dock progress q (0 = hero, 1 = header; may overshoot slightly). */
export function dockTransform({ margin, startScale, startY, endScale, endX, endY }, q) {
  const x = margin + (endX - margin) * q;
  const y = startY + (endY - startY) * q;
  const scale = startScale + (endScale - startScale) * q;
  return `translate(${round(x)} ${round(y)}) scale(${round(scale, 6)})`;
}

/** Hit area around the docked SUPH, px on every side. */
export const HOME_LINK_PAD = 6;

/**
 * The docked home link's box in viewport px: the docked SUPH (the compact
 * viewBox at the header scale) plus HOME_LINK_PAD all round. measure() sets it
 * from the same metrics as the letters, so the two can't drift apart. (A CSS
 * media query can't do this: it counts a classic scrollbar, measure() doesn't,
 * so from 640 to about 656px they disagree on desktop vs mobile.)
 */
export function homeLinkBox({ endX, endY, endScale, logoWidth }) {
  return {
    left: endX - HOME_LINK_PAD,
    top: endY - HOME_LINK_PAD,
    width: logoWidth + 2 * HOME_LINK_PAD,
    height: COMPACT_VIEWBOX.height * endScale + 2 * HOME_LINK_PAD,
  };
}

/**
 * A pointer's clientX over the home link, in compact-viewBox units (the
 * docked letters' own x). `rect` is the link's bounding box; null if unusable.
 */
export function homeLinkViewX(clientX, rect) {
  const logo = rect.width - 2 * HOME_LINK_PAD; // The docked SUPH's width inside the box.
  if (!(logo > 0) || !Number.isFinite(clientX)) return null;
  return ((clientX - rect.left - HOME_LINK_PAD) / logo) * COMPACT_VIEWBOX.width;
}

/**
 * A pointer over the hero SUPHIAN, in full-viewBox units (the letters' own x),
 * or null unless it is over the word's box plus HOME_LINK_PAD. The hero word
 * sits at dockTransform's start, translate(margin startY) scale(startScale),
 * in the fixed layer's viewport px, which are client px.
 */
export function heroViewX(clientX, clientY, { margin, startY, startScale }) {
  if (!(startScale > 0) || !Number.isFinite(clientX) || !Number.isFinite(clientY)) return null;
  const x = (clientX - margin) / startScale;
  const y = (clientY - startY) / startScale;
  const pad = HOME_LINK_PAD / startScale;
  if (x < -pad || x > FULL_VIEWBOX.width + pad || y < -pad || y > FULL_VIEWBOX.height + pad) return null;
  return x;
}

const round = (n, places = 3) => {
  const f = 10 ** places;
  return String(Math.round(n * f) / f);
};
