/**
 * QA filmstrip for SAY HELLO, the counterpart of tests/filmstrip.mjs for the
 * wordmark. Drives the real motion model (createHelloSim with the approved
 * HELLO_MOTION, unchanged) through a scripted session at 60 fps:
 *
 *   ENTRANCE  arm(), then land(): letters drop in S to O, SAY then HELLO.
 *   HOVER E   a still mouse over the E: neighbours bulge and lean away.
 *   LET GO    hover(null): everything springs back to the static layout.
 *   PRESS     press(true), held 0.7 s: every letter squishes, then settles
 *             (the render loop may sleep while held).
 *   RELEASE   press(false): the pop past rest, then the exact rest layout.
 *
 * Sampled frames are rasterized in-process with the real traced glyph paths
 * (tests/lib/raster.mjs, flat red, no gradient or grain, no browser):
 *
 *   node src/sayhello/film.mjs
 *
 * Writes qa/say-hello-film-<n>.png. Each row: phase, wall time, the S and E
 * scales and the H / L lean, and the word in viewBox units at a readable size
 * with the baseline, the viewBox top, the drop height and (while hovering) the
 * cursor marked. Nothing here changes a motion value.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { LETTERS, VIEWBOX } from './lettering.js';
import { BASELINE, HELLO_MOTION, createHelloSim, helloTransform } from './motion.js';
import {
  compose, createCanvas, drawText, encodePNG, fillPolys, fillRect, flattenPath, parseTransform, transformPolys,
} from '../../tests/lib/raster.mjs';

const FPS = 60;
const RED = '#fa2523';
const E = LETTERS.findIndex((l) => l.char === 'E');
const hoverX = LETTERS[E].x + LETTERS[E].width / 2;

// ---------- scripted session (wall-clock seconds) ----------
const events = [
  { at: 0, phase: 'ENTRANCE', run: (sim) => { sim.arm(); sim.land(); } },
  { at: 2.4, phase: 'HOVER E', run: (sim) => sim.hover(hoverX) },
  { at: 3.6, phase: 'LET GO', run: (sim) => sim.hover(null) },
  { at: 4.6, phase: 'PRESS', run: (sim) => sim.press(true) },
  { at: 5.3, phase: 'RELEASE', run: (sim) => sim.press(false) },
];
const END = 6.6;

function range(a, b, stepSize) {
  const out = [];
  for (let t = a; t < b - 1e-9; t += stepSize) out.push(t);
  return out;
}
const sampleTimes = [
  ...range(1 / 30, 1.2, 1 / 30), 1.4, 1.7, 2.1,
  ...range(2.4 + 1 / 30, 3.0, 1 / 30), 3.2, 3.5,
  ...range(3.6 + 1 / 30, 4.0, 1 / 30), 4.2, 4.5,
  ...range(4.6 + 1 / 30, 5.0, 1 / 30), 5.15, 5.25,
  ...range(5.3 + 1 / 30, 5.8, 1 / 30), 6.0, 6.5,
];

// ---------- simulate ----------
const sim = createHelloSim(LETTERS, HELLO_MOTION);
const wanted = new Set(sampleTimes.map((t) => Math.round(t * FPS)));
const eventAt = new Map(events.map((e) => [Math.round(e.at * FPS), e]));
const frames = [];
const stats = { minSy: Infinity, maxSy: 0, maxSkew: 0, settledAt: {} };
let phase = events[0].phase;
let pointer = null;
let pressed = false;
let phaseStart = 0;

for (let f = 0; f <= Math.round(END * FPS); f++) {
  const t = f / FPS;
  const event = eventAt.get(f);
  if (event) {
    event.run(sim);
    phase = event.phase;
    phaseStart = t;
    if (event.phase === 'HOVER E') pointer = hoverX;
    if (event.phase === 'LET GO') pointer = null;
    if (event.phase === 'PRESS') pressed = true;
    if (event.phase === 'RELEASE') pressed = false;
  }
  if (f > 0) sim.advance(1 / FPS);
  const letters = sim.read();
  for (const l of letters) {
    stats.minSy = Math.min(stats.minSy, l.sy);
    stats.maxSy = Math.max(stats.maxSy, l.sy);
    stats.maxSkew = Math.max(stats.maxSkew, Math.abs(l.skew));
  }
  if (sim.settled && stats.settledAt[phase] === undefined) stats.settledAt[phase] = t - phaseStart;
  if (wanted.has(f)) {
    frames.push({ t, phase, pointer, pressed, settled: sim.settled, letters: letters.map((l) => ({ ...l })) });
  }
}

// ---------- layout ----------
const LS = 0.22; // Panel scale, px per viewBox unit.
const PAD = 24; // Units of margin left and right of the viewBox (squashed letters spread).
const HEAD = Math.ceil((HELLO_MOTION.dropHeight + 40) * LS); // Headroom for the drop and the stretch.
const LABEL_W = 150;
const PANEL_W = Math.ceil((VIEWBOX.width + 2 * PAD) * LS);
const COL_W = LABEL_W + PANEL_W + 20;
const ROW_H = HEAD + Math.ceil(VIEWBOX.height * LS) + 14;
const COLS = 2;
const ROWS = 10;
const glyphPolys = LETTERS.map((l) => flattenPath(l.path));

function drawRow(canvas, fr, x0, y0) {
  const ox = x0 + LABEL_W + PAD * LS;
  const oy = y0 + HEAD;
  const [S, H, L] = [0, 3, 5].map((i) => fr.letters[i]);
  const e = fr.letters[E];
  fillRect(canvas, x0, y0, COL_W, 1, '#1c1c1c');
  drawText(canvas, fr.phase, x0 + 10, y0 + 12, '#ed2921');
  drawText(canvas, `T ${fr.t.toFixed(2)}`, x0 + 10, y0 + 32);
  drawText(canvas, `S ${S.sy.toFixed(3)}`, x0 + 10, y0 + 52, '#7a7a7a');
  drawText(canvas, `E ${e.sy.toFixed(3)}`, x0 + 10, y0 + 72, '#7a7a7a');
  drawText(canvas, `H ${H.skew.toFixed(1)} L ${L.skew.toFixed(1)}`, x0 + 10, y0 + 92, '#7a7a7a');
  if (fr.settled) drawText(canvas, 'SETTLED', x0 + 10, y0 + 112, '#5a5a5a');
  if (fr.pressed) drawText(canvas, 'HELD', x0 + 10, y0 + 132, '#a3a3a3');

  // Guides: baseline, viewBox top (dashed), drop height (dotted), cursor.
  fillRect(canvas, ox, oy + BASELINE * LS, VIEWBOX.width * LS, 1, '#303030');
  for (let gx = 0; gx < VIEWBOX.width * LS; gx += 6) fillRect(canvas, ox + gx, oy, 3, 1, '#1e1e1e');
  for (let gx = 0; gx < VIEWBOX.width * LS; gx += 10) fillRect(canvas, ox + gx, oy - HELLO_MOTION.dropHeight * LS, 1, 1, '#2a2a2a');
  for (const l of LETTERS) fillRect(canvas, ox + l.x * LS, oy + BASELINE * LS, 1, 6, '#3a3a3a');
  if (fr.pointer !== null) {
    const cx = ox + fr.pointer * LS;
    fillRect(canvas, cx, y0 + 4, 1, HEAD + VIEWBOX.height * LS, '#3d6fd6', 0.8);
    fillPolys(canvas, [[[cx - 5, y0 + 4], [cx + 6, y0 + 4], [cx + 0.5, y0 + 12]]], '#3d6fd6');
  }

  const local = [LS, 0, 0, LS, ox, oy];
  fr.letters.forEach((l, i) => {
    if (l.opacity <= 0.001) return;
    const m = compose(local, parseTransform(helloTransform(LETTERS[i], l)));
    fillPolys(canvas, transformPolys(glyphPolys[i], m), RED, l.opacity);
  });
}

function page(rows) {
  const canvas = createCanvas(COL_W * COLS, ROWS * ROW_H);
  rows.forEach((fr, n) => drawRow(canvas, fr, Math.floor(n / ROWS) * COL_W, (n % ROWS) * ROW_H));
  for (let c = 1; c < COLS; c++) fillRect(canvas, c * COL_W - 1, 0, 1, ROWS * ROW_H, '#272727');
  return encodePNG(canvas);
}

const out = new URL('../../qa/', import.meta.url);
await mkdir(out, { recursive: true });
const PER_PAGE = COLS * ROWS;
const pages = [];
for (let i = 0; i < frames.length; i += PER_PAGE) pages.push(frames.slice(i, i + PER_PAGE));
await Promise.all(pages.map((rows, n) => writeFile(new URL(`say-hello-film-${n + 1}.png`, out), page(rows))));

const fmt = (o) => Object.entries(o).map(([k, v]) => `${k} ${v.toFixed(2)}s`).join(', ');
console.log(`say-hello film: ${frames.length} frames -> ${pages.length} PNG pages (qa/say-hello-film-1..${pages.length}.png)`);
console.log(`landed at (sim s): ${sim.landedAt.map((t) => t.toFixed(3)).join(' ')}`);
console.log(`sy range ${stats.minSy.toFixed(3)} .. ${stats.maxSy.toFixed(3)}, max lean ${stats.maxSkew.toFixed(2)} deg`);
console.log(`settled after: ${fmt(stats.settledAt)}`);
