/**
 * Pure icon geometry shared by the browser favicon, the Node icon renderer and
 * the static SVG: where SUPH sits inside a square icon, and the per-letter
 * matrix that squashes and leans a letter about its own baseline centre.
 * Matrices use SVG / canvas order [a b c d e f].
 */
import { LETTERS } from '../wordmark/lettering.js';

export const SUPH = LETTERS.slice(0, 4);
export const BASELINE = 584; // Same baseline the wordmark squashes about.
// Ink bounds of S..H in compact viewBox units (measured from the traced paths).
export const INK = { left: 5, right: 1040, top: 6.7, bottom: 585.3 };
export const INK_WIDTH = INK.right - INK.left;

export const TILE_COLOR = '#080808'; // Site background and theme-color.
export const RED = '#fa2523'; // Flat mean of the lettering gradient (#fb2726..#fa2322).

/**
 * Icon variants.
 *   wordWidth: SUPH ink width as a fraction of the icon size.
 *   center:    vertical centre of the ink box at rest, as a fraction of size.
 *              The favicon is centred (0.5): the rest frame is what shows
 *              nearly all the time, and the tallest stretch (strength 1.6)
 *              still clears the tile top, so no headroom offset is needed.
 *              Snapping the baseline to the 16 px grid (row 12 of 16) then
 *              leaves the ink about 0.2 px above centre at 16 px (margins
 *              3.6 top, 4.0 bottom), a slight optical lift. The large static
 *              icons never animate and use 0.49 for the same lift.
 *   radius:    tile corner radius as a fraction of size (null = no tile,
 *              0 = square opaque tile).
 */
export const VARIANTS = {
  favicon: { wordWidth: 0.94, center: 0.5, radius: 0.22 },
  plain: { wordWidth: 0.96, center: 0.5, radius: null },
  touch: { wordWidth: 0.78, center: 0.49, radius: 0 },
  any: { wordWidth: 0.8, center: 0.49, radius: 0.22 },
  maskable: { wordWidth: 0.64, center: 0.49, radius: 0 },
};

/**
 * Layout for an icon `size` px square. Returns the unit-to-pixel scale `k`,
 * the word origin (ox, oy) and the tile radius in px. For favicon sizes the
 * baseline is snapped to a whole pixel of the 16 px grid (so a 32 or 64 px
 * render downsampled to a 16 px tab keeps the flat letter bottoms crisp).
 */
export function iconLayout(size, variant = 'favicon') {
  const v = typeof variant === 'string' ? VARIANTS[variant] : variant;
  if (!v) throw new Error(`Unknown icon variant ${variant}`);
  const k = (size * v.wordWidth) / INK_WIDTH;
  const ox = (size - INK_WIDTH * k) / 2 - INK.left * k;
  const inkMid = (INK.top + INK.bottom) / 2;
  let baselinePx = size * v.center + (BASELINE - inkMid) * k;
  if (size <= 64) {
    const unit = size / 16;
    baselinePx = Math.round(baselinePx / unit) * unit;
  }
  const oy = baselinePx - BASELINE * k;
  return { size, k, ox, oy, baselinePx, radius: v.radius == null ? null : v.radius * size };
}

const multiply = (m, n) => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
];
export const compose = (...ms) => ms.reduce(multiply, [1, 0, 0, 1, 0, 0]);
const translate = (x, y) => [1, 0, 0, 1, x, y];
const scale = (x, y) => [x, 0, 0, y, 0, 0];
const skewX = (deg) => [1, 0, Math.tan((deg * Math.PI) / 180), 1, 0, 0];

/**
 * Matrix mapping letter `index`'s local path coordinates to icon pixels for a
 * pose { sx, sy, skew, x, y }: scale and lean about the letter's baseline
 * centre, so squashes spread sideways from its middle and stretches grow
 * upward, then move that baseline centre by x (right) and y (up), in
 * lettering units. x and y are optional and default to 0.
 */
export function letterMatrix(index, pose, layout) {
  const letter = SUPH[index];
  const cx = letter.width / 2;
  return compose(
    [layout.k, 0, 0, layout.k, layout.ox, layout.oy],
    translate(letter.x + cx + (pose.x ?? 0), BASELINE - (pose.y ?? 0)),
    skewX(pose.skew),
    scale(pose.sx, pose.sy),
    translate(-cx, -BASELINE),
  );
}

const r2 = (n) => Math.round(n * 1000) / 1000;

/** Rounded-rectangle path data (absolute M/L/C/Z only, so any rasterizer can read it). */
export function roundedRectPath(x, y, w, h, r) {
  r = Math.max(0, Math.min(r, w / 2, h / 2));
  if (r === 0) return `M ${r2(x)},${r2(y)} L ${r2(x + w)},${r2(y)} L ${r2(x + w)},${r2(y + h)} L ${r2(x)},${r2(y + h)} Z`;
  const c = r * (1 - 0.5523);
  const R = x + w;
  const B = y + h;
  return [
    `M ${r2(x + r)},${r2(y)}`,
    `L ${r2(R - r)},${r2(y)}`,
    `C ${r2(R - c)},${r2(y)} ${r2(R)},${r2(y + c)} ${r2(R)},${r2(y + r)}`,
    `L ${r2(R)},${r2(B - r)}`,
    `C ${r2(R)},${r2(B - c)} ${r2(R - c)},${r2(B)} ${r2(R - r)},${r2(B)}`,
    `L ${r2(x + r)},${r2(B)}`,
    `C ${r2(x + c)},${r2(B)} ${r2(x)},${r2(B - c)} ${r2(x)},${r2(B - r)}`,
    `L ${r2(x)},${r2(y + r)}`,
    `C ${r2(x)},${r2(y + c)} ${r2(x + c)},${r2(y)} ${r2(x + r)},${r2(y)}`,
    'Z',
  ].join(' ');
}
