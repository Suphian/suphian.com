/**
 * QA filmstrip for the docked SUPH's hover and press, the counterpart of SAY
 * HELLO's src/sayhello/film.mjs (same frame rate, same panel scale, so the
 * letters come out the same size as in qa/say-hello-film-*.png and the two can
 * be compared side by side). Drives the real code path at 60 fps:
 *
 *   chain     createWordmarkSim held at its docked rest (p = 1): each letter's
 *             outer transform, exactly the compact SUPH layout.
 *   effects   createDockEffects (dockfx.js): SAY HELLO's model and values,
 *             drawn on each letter's inner group, composed under the chain.
 *   pointer   clientX across the real home link box on a 1440x900 screen,
 *             mapped to compact-viewBox x by homeLinkViewX.
 *
 *   DOCKED    rest: no inner transform at all.
 *   SWEEP S-H a slow mouse pass across the link, left edge to right edge (1.4 s).
 *   LEAVE     the pointer leaves: everything springs back to rest.
 *   PRESS     press(true), held 0.7 s: every letter squishes, then settles.
 *   RELEASE   press(false): the pop past rest, then exact rest.
 *   HOVER U   the pointer comes back over U.
 *   UNDOCK    the logo leaves the header (scroll up, or the click scrolled the
 *             page): hover is let go and the letters settle, although the
 *             pointer (still drawn) hasn't moved: input is ignored until the
 *             logo docks again. The chain is held docked here so the effect
 *             layer reads on its own.
 *
 *   node tests/dock-hover-film.mjs
 *
 * Writes qa/dock-hover-<n>.png. Each row: phase, wall time, sy and lean of S U
 * P H, then the word in viewBox units (0.22 px per unit, as SAY HELLO's film)
 * with the baseline, viewBox top and cursor marked, then the docked corner of
 * the 1440x900 screen at 1:1, link box outlined, as it really shows.
 * Nothing here changes a motion value.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { LETTERS, COMPACT_VIEWBOX } from '../src/wordmark/lettering.js';
import { MOTION } from '../src/wordmark/motion.js';
import { BASELINE, createWordmarkSim, letterTransform } from '../src/wordmark/physics.js';
import { dockMetrics, dockTransform, homeLinkBox, homeLinkViewX } from '../src/wordmark/geometry.js';
import { DOCK_GLYPHS, createDockEffects } from '../src/wordmark/dockfx.js';
import {
  compose, createCanvas, drawText, encodePNG, fillPolys, fillRect, flattenPath, parseTransform, transformPolys,
} from './lib/raster.mjs';

const FPS = 60;
const RED = '#fa2523';
const VIEW = { width: 1440, heroHeight: 900 };
const metrics = dockMetrics(VIEW, MOTION);
const box = homeLinkBox(metrics);
const glyphCentreX = (i) => metrics.endX + (DOCK_GLYPHS[i].x + DOCK_GLYPHS[i].width / 2) * metrics.endScale;

// ---------- scripted session (wall-clock seconds; the pointer in screen px) ----------
const SWEEP = { from: 0.2, to: 1.6 };
const pointerAt = (t) => box.left + (box.width * (t - SWEEP.from)) / (SWEEP.to - SWEEP.from);
const events = [
  { at: 0, phase: 'DOCKED', run: (fx) => fx.setDocked(true) },
  { at: SWEEP.from, phase: 'SWEEP S-H' },
  { at: 1.6, phase: 'LEAVE', run: (fx) => fx.leave() },
  { at: 2.5, phase: 'PRESS', run: (fx) => fx.press(true) },
  { at: 3.2, phase: 'RELEASE', run: (fx) => fx.press(false) },
  { at: 4.2, phase: 'HOVER U', pointer: glyphCentreX(1) },
  { at: 4.8, phase: 'UNDOCK', run: (fx) => fx.setDocked(false) },
];
const END = 6.0;

function range(a, b, stepSize) {
  const out = [];
  for (let t = a; t < b - 1e-9; t += stepSize) out.push(t);
  return out;
}
const sampleTimes = [
  0.1,
  ...range(SWEEP.from + 1 / 15, SWEEP.to + 1e-6, 1 / 15),
  ...range(1.6 + 1 / 30, 2.0, 1 / 30), 2.2, 2.45,
  ...range(2.5 + 1 / 30, 2.9, 1 / 30), 3.05, 3.15,
  ...range(3.2 + 1 / 30, 3.7, 1 / 30), 3.9, 4.15,
  ...range(4.2 + 1 / 30, 4.5, 1 / 30), 4.75,
  ...range(4.8 + 1 / 30, 5.2, 1 / 30), 5.5, 5.95,
];

// ---------- simulate ----------
const chain = createWordmarkSim({ letters: LETTERS, keep: 4, params: MOTION });
chain.snap(1);
const outer = chain.read().letters.slice(0, 4).map((l) => letterTransform(l)); // The docked rest.
const fx = createDockEffects();
const wanted = new Set(sampleTimes.map((t) => Math.round(t * FPS)));
const eventAt = new Map(events.map((e) => [Math.round(e.at * FPS), e]));
const frames = [];
const stats = { minSy: Infinity, maxSy: 0, maxSkew: 0, settledAt: {} };
let phase = events[0].phase;
let phaseStart = 0;
let clientX = null; // Pointer over the link, screen px (null: not over it).

for (let f = 0; f <= Math.round(END * FPS); f++) {
  const t = f / FPS;
  const event = eventAt.get(f);
  if (event) {
    event.run?.(fx);
    phase = event.phase;
    phaseStart = t;
    if (event.pointer !== undefined) clientX = event.pointer;
    if (event.phase === 'LEAVE' || event.phase === 'PRESS') clientX = null;
  }
  if (phase === 'SWEEP S-H') clientX = pointerAt(t);
  if (clientX !== null) fx.hover(homeLinkViewX(clientX, box)); // As Wordmark.jsx's pointermove does.
  if (f > 0) fx.advance(1 / FPS);
  const letters = fx.read();
  for (const l of letters) {
    stats.minSy = Math.min(stats.minSy, l.sy);
    stats.maxSy = Math.max(stats.maxSy, l.sy);
    stats.maxSkew = Math.max(stats.maxSkew, Math.abs(l.skew));
  }
  if (fx.settled && stats.settledAt[phase] === undefined) stats.settledAt[phase] = t - phaseStart;
  if (wanted.has(f)) {
    frames.push({
      t, phase, settled: fx.settled, pressed: fx.pressed, docked: fx.enabled,
      viewX: clientX === null ? null : homeLinkViewX(clientX, box), clientX,
      letters: letters.map((l) => ({ ...l })), inner: fx.transforms(),
    });
  }
}

// ---------- layout ----------
const LS = 0.22; // Panel scale, px per viewBox unit: SAY HELLO's film uses the same.
const PAD = 24; // Units of margin left and right of the viewBox.
const HEAD = 30; // Headroom for the bulge and the cursor marker, px.
const LABEL_W = 156;
const PANEL_W = Math.ceil((COMPACT_VIEWBOX.width + 2 * PAD) * LS);
const CORNER = { x: box.left - 12, y: 0, w: box.width + 24, h: Math.ceil(box.top + box.height + 10) }; // Screen px, 1:1.
const COL_W = LABEL_W + PANEL_W + 20 + CORNER.w + 16;
const ROW_H = Math.max(HEAD + Math.ceil(COMPACT_VIEWBOX.height * LS) + 14, 176);
const COLS = 2;
const ROWS = 10;
const glyphPolys = LETTERS.slice(0, 4).map((l) => flattenPath(l.path));
const fmt = (n, places) => (n < 0 ? '-' : '') + Math.abs(n).toFixed(places);

function drawRow(canvas, fr, x0, y0) {
  fillRect(canvas, x0, y0, COL_W, 1, '#1c1c1c');
  drawText(canvas, fr.phase, x0 + 10, y0 + 12, '#ed2921');
  drawText(canvas, `T ${fr.t.toFixed(2)}`, x0 + 10, y0 + 32);
  fr.letters.forEach((l, i) => drawText(canvas, `${'SUPH'[i]} ${l.sy.toFixed(3)} ${fmt(l.skew, 1)}`, x0 + 10, y0 + 52 + i * 18, '#7a7a7a'));
  if (fr.settled) drawText(canvas, 'SETTLED', x0 + 10, y0 + 128, '#5a5a5a');
  if (fr.pressed) drawText(canvas, 'HELD', x0 + 10, y0 + 146, '#a3a3a3');
  if (!fr.docked) drawText(canvas, 'UNDOCKED', x0 + 10, y0 + 146, '#a3a3a3');

  // Word panel: baseline, viewBox top (dashed), letter origins, cursor.
  const ox = x0 + LABEL_W + PAD * LS;
  const oy = y0 + HEAD;
  fillRect(canvas, ox, oy + BASELINE * LS, COMPACT_VIEWBOX.width * LS, 1, '#303030');
  for (let gx = 0; gx < COMPACT_VIEWBOX.width * LS; gx += 6) fillRect(canvas, ox + gx, oy, 3, 1, '#1e1e1e');
  for (const g of DOCK_GLYPHS) fillRect(canvas, ox + g.x * LS, oy + BASELINE * LS, 1, 6, '#3a3a3a');
  if (fr.viewX !== null) {
    const cx = ox + fr.viewX * LS;
    fillRect(canvas, cx, y0 + 4, 1, HEAD + COMPACT_VIEWBOX.height * LS, '#3d6fd6', 0.8);
    fillPolys(canvas, [[[cx - 5, y0 + 4], [cx + 6, y0 + 4], [cx + 0.5, y0 + 12]]], '#3d6fd6');
  }
  const local = [LS, 0, 0, LS, ox, oy];
  glyphPolys.forEach((polys, i) => {
    // The real composition: the chain's outer transform, then the effects' inner one.
    const m = compose(local, parseTransform(outer[i]), parseTransform(fr.inner[i]));
    fillPolys(canvas, transformPolys(polys, m), RED);
  });

  // The docked corner of a 1440x900 screen at 1:1: what the reader actually sees.
  const sx = x0 + LABEL_W + PANEL_W + 20;
  const sy = y0 + Math.round((ROW_H - CORNER.h) / 2);
  fillRect(canvas, sx - 1, sy - 1, CORNER.w + 2, CORNER.h + 2, '#272727');
  fillRect(canvas, sx, sy, CORNER.w, CORNER.h, '#0e0e0e');
  const bx = sx + box.left - CORNER.x;
  const by = sy + box.top - CORNER.y;
  for (let d = 0; d < box.width; d += 4) { fillRect(canvas, bx + d, by, 2, 1, '#2f2f2f'); fillRect(canvas, bx + d, by + box.height, 2, 1, '#2f2f2f'); }
  for (let d = 0; d < box.height; d += 4) { fillRect(canvas, bx, by + d, 1, 2, '#2f2f2f'); fillRect(canvas, bx + box.width, by + d, 1, 2, '#2f2f2f'); }
  const screen = compose([1, 0, 0, 1, sx - CORNER.x, sy - CORNER.y], parseTransform(dockTransform(metrics, 1)));
  const clip = [sx, sy, sx + CORNER.w, sy + CORNER.h];
  glyphPolys.forEach((polys, i) => {
    const m = compose(screen, parseTransform(outer[i]), parseTransform(fr.inner[i]));
    fillPolys(canvas, transformPolys(polys, m), RED, 1, clip);
  });
  if (fr.clientX !== null) fillRect(canvas, sx + fr.clientX - CORNER.x, sy + 2, 1, 5, '#3d6fd6');
}

function page(rows) {
  const canvas = createCanvas(COL_W * COLS, ROWS * ROW_H);
  rows.forEach((fr, n) => drawRow(canvas, fr, Math.floor(n / ROWS) * COL_W, (n % ROWS) * ROW_H));
  for (let c = 1; c < COLS; c++) fillRect(canvas, c * COL_W - 1, 0, 1, ROWS * ROW_H, '#272727');
  return encodePNG(canvas);
}

const out = new URL('../qa/', import.meta.url);
await mkdir(out, { recursive: true });
const PER_PAGE = COLS * ROWS;
const pages = [];
for (let i = 0; i < frames.length; i += PER_PAGE) pages.push(frames.slice(i, i + PER_PAGE));
await Promise.all(pages.map((rows, n) => writeFile(new URL(`dock-hover-${n + 1}.png`, out), page(rows))));

// Amplitudes at the real docked size (1440 wide: SUPH is 104 px, the tallest letter ~57 px).
const px = metrics.endScale;
const cap = (BASELINE - 6.7) * px;
const settled = Object.entries(stats.settledAt).map(([k, v]) => `${k} ${v.toFixed(2)}s`).join(', ');
console.log(`dock-hover film: ${frames.length} frames -> ${pages.length} PNG pages (qa/dock-hover-1..${pages.length}.png)`);
console.log(`sy range ${stats.minSy.toFixed(3)} .. ${stats.maxSy.toFixed(3)}, max lean ${stats.maxSkew.toFixed(2)} deg`);
console.log(`at ${metrics.logoWidth}px docked: bulge up to ${((stats.maxSy - 1) * cap).toFixed(1)} px, press squish ${((1 - stats.minSy) * cap).toFixed(1)} px, lean ${(Math.tan((stats.maxSkew * Math.PI) / 180) * cap).toFixed(1)} px at the cap line`);
console.log(`settled after: ${settled}`);
