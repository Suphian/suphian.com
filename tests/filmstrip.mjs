/**
 * QA filmstrip: runs the wordmark physics through a scripted scroll (slow
 * scroll down, a fast flick, then a fast scroll back up) at 60 fps and renders
 * sampled frames as a contact sheet using the real glyph paths.
 *
 *   node tests/filmstrip.mjs
 *
 * Writes qa/filmstrip.svg (every row, real gradient and grain filter) and
 * qa/filmstrip-<n>.png pages (flat red, rasterized in-process, no browser).
 * Each row: time and progress, the word in its own coordinates (squash,
 * bulge and lean at a readable size, with guides), and a 1440x900 viewport
 * thumbnail with the dock transform applied.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { LETTERS, LETTERING_DEFS, FULL_VIEWBOX } from '../src/wordmark/lettering.js';
import { MOTION } from '../src/wordmark/motion.js';
import { createWordmarkSim, ease, letterTransform, BASELINE } from '../src/wordmark/physics.js';
import { dockMetrics, dockTransform } from '../src/wordmark/geometry.js';
import {
  compose, createCanvas, drawText, encodePNG, fillPolys, fillRect, flattenPath, parseTransform, transformPolys,
} from './lib/raster.mjs';

const VIEW = { width: 1440, heroHeight: 900 };
const FPS = 60;
const RED = '#fa2523';

// ---------- scroll script (progress p over time) ----------
const ramp = (t, t0, t1, a, b) => a + (b - a) * ease(Math.max(0, Math.min(1, (t - t0) / (t1 - t0))));
const phases = [
  { name: 'SLOW DOWN', until: 2.0, p: (t) => ramp(t, 0.2, 1.8, 0, 0.24) },
  { name: 'FLICK', until: 4.0, p: (t) => ramp(t, 2.0, 2.18, 0.24, 1) },
  { name: 'BACK UP', until: 5.8, p: (t) => ramp(t, 4.0, 4.3, 1, 0) },
];
const phaseAt = (t) => phases.find((ph) => t < ph.until) ?? phases.at(-1);
const scrollP = (t) => phaseAt(t).p(t);

const sampleTimes = [
  ...range(0, 2.0, 0.2),
  ...range(2.0, 2.9, 1 / 30), 3.0, 3.2, 3.5, 3.95,
  ...range(4.0, 4.6, 1 / 30), 4.8, 5.1, 5.7,
];
function range(a, b, stepSize) {
  const out = [];
  for (let t = a; t < b - 1e-9; t += stepSize) out.push(Math.round(t * 1000) / 1000);
  return out;
}

// ---------- simulate ----------
const sim = createWordmarkSim({ letters: LETTERS, keep: 4, params: MOTION });
sim.snap(0);
const frames = [];
const wanted = new Set(sampleTimes.map((t) => Math.round(t * FPS)));
const lastFrame = Math.round(phases.at(-1).until * FPS);
for (let f = 0; f <= lastFrame; f++) {
  const t = f / FPS;
  if (f > 0) {
    sim.setTarget(scrollP(t));
    sim.advance(1 / FPS);
  }
  if (wanted.has(f)) {
    const s = sim.read();
    frames.push({
      t,
      phase: phaseAt(t).name,
      p: s.p,
      q: s.dockRaw,
      dock: s.dock,
      settled: s.settled,
      letters: s.letters.map((l) => ({ ...l })),
    });
  }
}

// ---------- layout ----------
const LS = 0.2; // local panel scale
const HEAD = 44; // headroom above the glyph top for bulge, px
const LABEL_W = 196;
const LOCAL_W = Math.ceil(FULL_VIEWBOX.width * LS) + 24;
const SCREEN_S = 0.15;
const SCREEN_W = VIEW.width * SCREEN_S;
const SCREEN_H = VIEW.heroHeight * SCREEN_S;
const ROW_H = Math.ceil(HEAD + FULL_VIEWBOX.height * LS + 14);
const SHEET_W = LABEL_W + LOCAL_W + 20 + SCREEN_W + 14;
const metrics = dockMetrics(VIEW, MOTION);
const localOrigin = (row) => [LABEL_W + 12, row * ROW_H + HEAD];
const guideXs = [...LETTERS.slice(0, 4).map((l) => l.x), LETTERS[3].x + LETTERS[3].width, LETTERS[6].x + LETTERS[6].width];

// ---------- SVG contact sheet ----------
function svgSheet(rows) {
  const body = rows.map((fr, row) => {
    const [ox, oy] = localOrigin(row);
    const y0 = row * ROW_H;
    const guides = [
      `<line x1="0" y1="${BASELINE}" x2="${FULL_VIEWBOX.width}" y2="${BASELINE}" stroke="#272727" stroke-width="4"/>`,
      `<line x1="0" y1="0" x2="${FULL_VIEWBOX.width}" y2="0" stroke="#1a1a1a" stroke-width="3" stroke-dasharray="12 12"/>`,
      ...guideXs.map((gx) => `<line x1="${gx}" y1="${BASELINE}" x2="${gx}" y2="${BASELINE + 40}" stroke="#3a3a3a" stroke-width="4"/>`),
    ].join('');
    const letters = (withOpacity) => fr.letters.map((l, i) =>
      `<g transform="${letterTransform(l)}"${withOpacity && l.opacity < 1 ? ` opacity="${l.opacity.toFixed(3)}"` : ''}>${LETTERS[i].markup}</g>`).join('');
    const sx = LABEL_W + LOCAL_W + 20;
    const sy = y0 + (ROW_H - SCREEN_H) / 2;
    return `<g>
  <line x1="0" y1="${y0}" x2="${SHEET_W}" y2="${y0}" stroke="#1c1c1c"/>
  <text x="12" y="${y0 + 22}" fill="#ed2921">${fr.phase}</text>
  <text x="12" y="${y0 + 40}">t ${fr.t.toFixed(3)}s</text>
  <text x="12" y="${y0 + 56}">p ${fr.p.toFixed(3)}  q ${fr.q.toFixed(3)}</text>
  <text x="12" y="${y0 + 72}">${fr.letters.slice(0, 4).map((l) => l.sx.toFixed(2)).join(' ')}</text>
  ${fr.settled ? `<text x="12" y="${y0 + 88}" fill="#5a5a5a">settled</text>` : ''}
  <g transform="translate(${ox} ${oy}) scale(${LS})">${guides}${letters(true)}</g>
  <svg x="${sx}" y="${sy}" width="${SCREEN_W}" height="${SCREEN_H}" viewBox="0 0 ${VIEW.width} ${VIEW.heroHeight}" overflow="hidden">
    <rect width="100%" height="100%" fill="#0e0e0e" stroke="#272727" stroke-width="6"/>
    <g transform="${dockTransform(metrics, fr.dock)}">${letters(true)}</g>
  </svg>
</g>`;
  }).join('\n');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SHEET_W}" height="${rows.length * ROW_H}" viewBox="0 0 ${SHEET_W} ${rows.length * ROW_H}" font-family="Courier New, monospace" font-size="11" fill="#a3a3a3">
<defs>${LETTERING_DEFS}</defs>
<rect width="100%" height="100%" fill="#080808"/>
${body}
</svg>\n`;
}

// ---------- PNG pages ----------
const glyphPolys = LETTERS.map((l) => flattenPath(l.path));

function pngPage(rows) {
  const canvas = createCanvas(SHEET_W, rows.length * ROW_H);
  rows.forEach((fr, row) => {
    const [ox, oy] = localOrigin(row);
    const y0 = row * ROW_H;
    fillRect(canvas, 0, y0, SHEET_W, 1, '#1c1c1c');
    drawText(canvas, fr.phase, 12, y0 + 10, '#ed2921');
    drawText(canvas, `T ${fr.t.toFixed(2)}`, 12, y0 + 30);
    drawText(canvas, `P ${fr.p.toFixed(2)} Q ${fr.q.toFixed(2)}`, 12, y0 + 50);
    drawText(canvas, fr.letters.slice(0, 4).map((l) => l.sx.toFixed(2).replace(/^0/, '')).join(' '), 12, y0 + 70, '#7a7a7a');
    // Guides in the local panel.
    fillRect(canvas, ox, oy + BASELINE * LS, FULL_VIEWBOX.width * LS, 1, '#303030');
    for (let gx = 0; gx < FULL_VIEWBOX.width * LS; gx += 6) fillRect(canvas, ox + gx, oy, 3, 1, '#1e1e1e');
    for (const gx of guideXs) fillRect(canvas, ox + gx * LS, oy + BASELINE * LS, 1, 8, '#4a4a4a');
    const local = [LS, 0, 0, LS, ox, oy];
    fr.letters.forEach((l, i) => {
      if (l.opacity <= 0.001) return;
      const m = compose(local, parseTransform(letterTransform(l)));
      fillPolys(canvas, transformPolys(glyphPolys[i], m), RED, l.opacity);
    });
    // Viewport thumbnail.
    const sx = LABEL_W + LOCAL_W + 20;
    const sy = Math.round(y0 + (ROW_H - SCREEN_H) / 2);
    fillRect(canvas, sx - 1, sy - 1, SCREEN_W + 2, SCREEN_H + 2, '#272727');
    fillRect(canvas, sx, sy, SCREEN_W, SCREEN_H, '#0e0e0e');
    const screen = compose([SCREEN_S, 0, 0, SCREEN_S, sx, sy], parseTransform(dockTransform(metrics, fr.dock)));
    const clip = [sx, sy, sx + SCREEN_W, sy + SCREEN_H];
    fr.letters.forEach((l, i) => {
      if (l.opacity <= 0.001) return;
      const m = compose(screen, parseTransform(letterTransform(l)));
      fillPolys(canvas, transformPolys(glyphPolys[i], m), RED, l.opacity, clip);
    });
  });
  return encodePNG(canvas);
}

const out = new URL('../qa/', import.meta.url);
await mkdir(out, { recursive: true });
await writeFile(new URL('filmstrip.svg', out), svgSheet(frames), 'utf8');
const PAGE = 16;
const pages = [];
for (let i = 0; i < frames.length; i += PAGE) pages.push(frames.slice(i, i + PAGE));
await Promise.all(pages.map((rows, n) => writeFile(new URL(`filmstrip-${n + 1}.png`, out), pngPage(rows))));

const minSx = frames.reduce((acc, fr) => Math.min(acc, ...fr.letters.slice(0, 4).map((l) => l.sx)), Infinity);
const maxSx = frames.reduce((acc, fr) => Math.max(acc, ...fr.letters.slice(0, 4).map((l) => l.sx)), 0);
console.log(`filmstrip: ${frames.length} frames -> qa/filmstrip.svg + ${pages.length} PNG pages`);
console.log(`SUPH width range across samples: ${minSx.toFixed(3)} .. ${maxSx.toFixed(3)}`);
