/**
 * QA renders for the SUPH favicon (no browser). Writes to qa/ (gitignored):
 *   qa/favicon-options.png           legibility options at 16 and 32 px, light and dark tab strips
 *   qa/favicon-variant-<name>.png    one per variant (wave, hop, jelly, puff): every frame of a
 *                                    burst at 30 fps (Chromium, Safari), then the 8 fps frames
 *                                    Firefox is sent, at 16 and 32 px on light and dark tab strips
 *   qa/favicon-variants-sheet.png    all four stacked and labelled, every other frame, to pick by eye
 *   qa/favicon-zoom.png              the default variant, every third frame at 32 px, large
 *
 *   node src/favicon/qa-favicon.mjs            everything
 *   node src/favicon/qa-favicon.mjs hop jelly  just those variant strips (and the sheet)
 *
 * Cells are upscaled with nearest-neighbour so single pixels are visible, with
 * the icon at true size under each one. "16 px" is what a 1x screen shows: the
 * 32 px canvas the favicon draws (iconSize) scaled down 2:1 by the browser.
 * "32 px" is the same canvas at 1:1, as on a 2x screen.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { createCanvas, drawText, encodePNG, fillPolys, flattenPath, transformPolys } from '../../tests/lib/raster.mjs';
import { DEFAULT_VARIANT, GECKO_MOTIONS, MOTIONS, VARIANT_NAMES, burstFrames } from './frame-math.js';
import { RED, SUPH, compose } from './layout.js';
import { flatten, renderIcon } from './raster-icon.mjs';

const OUT = new URL('../../qa/', import.meta.url);
const LIGHT = '#ffffff'; // Chrome light active tab
const DARK = '#35363a'; // Chrome dark active tab
const SHEET_BG = [24, 24, 24];

const DESCRIPTIONS = {
  wave: 'S TO H SQUASH-AND-STRETCH RIPPLE, THE ORIGINAL',
  hop: 'THE WORD CROUCHES, HOPS 2 PX, LANDS WITH A SQUASH, REBOUNDS',
  jelly: 'ROCKS SIDE TO SIDE ABOUT ITS MIDDLE LIKE JELLY, THEN SETTLES',
  puff: 'INFLATES LIKE A BALLOON, LETS THE AIR OUT PAST REST, WOBBLES BACK',
};

// ---------- text: the shared 5x7 font lacks a few glyphs these labels need ----------
const EXTRA_GLYPHS = {
  J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
  Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  ',': ['00000', '00000', '00000', '00000', '01100', '00100', '01000'],
  '(': ['00010', '00100', '01000', '01000', '01000', '00100', '00010'],
  ')': ['01000', '00100', '00010', '00010', '00010', '00100', '01000'],
};
const hex = (color) => [1, 3, 5].map((o) => parseInt(color.slice(o, o + 2), 16));

function label(sheet, text, x, y, color = '#a3a3a3', size = 2) {
  let pen = x;
  for (const ch of text.toUpperCase()) {
    const rows = EXTRA_GLYPHS[ch];
    if (!rows) drawText(sheet, ch, pen, y, color, size);
    else {
      rows.forEach((row, ry) => {
        for (let rx = 0; rx < 5; rx++) {
          if (row[rx] === '1') fillBox(sheet, pen + rx * size, y + ry * size, size, size, color);
        }
      });
    }
    pen += 6 * size;
  }
  return pen;
}

// ---------- pixels ----------
function blit(sheet, rgb, size, x0, y0, zoom) {
  for (let y = 0; y < size * zoom; y++) {
    for (let x = 0; x < size * zoom; x++) {
      const src = (Math.floor(y / zoom) * size + Math.floor(x / zoom)) * 3;
      const X = x0 + x;
      const Y = y0 + y;
      if (X < 0 || Y < 0 || X >= sheet.width || Y >= sheet.height) continue;
      sheet.px.set(rgb.subarray(src, src + 3), (Y * sheet.width + X) * 3);
    }
  }
}

function fillBox(sheet, x, y, w, h, color) {
  fillPolys(sheet, [[[x, y], [x + w, y], [x + w, y + h], [x, y + h]]], color);
}

// Stacked two-row SU/PH candidate, rendered directly (not a shipped variant).
function renderStacked(size) {
  const canvas = createCanvas(size, size, [8, 8, 8]);
  const alpha = new Float32Array(size * size).fill(1);
  const rowH = 600;
  const blockW = 578; // SU ink width
  const k = (size * 0.86) / (rowH * 2);
  const ox = (size - blockW * k) / 2;
  const oy = (size - rowH * 2 * k) / 2;
  SUPH.forEach((l, i) => {
    const row = i < 2 ? 0 : 1;
    const dx = row === 0 ? 0 : -554 + (blockW - 486) / 2;
    const m = compose([k, 0, 0, k, ox, oy], [1, 0, 0, 1, l.x + dx, row * rowH]);
    fillPolys(canvas, transformPolys(flattenPath(l.path, 24), m), RED);
  });
  return { size, rgb: canvas.px, alpha };
}

/** Box-downsamples an icon by an integer factor (what a browser does to a 32 px icon in a 16 px tab). */
function downsample(icon, factor) {
  const size = icon.size / factor;
  const rgb = new Float32Array(size * size * 3);
  const alpha = new Float32Array(size * size);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    let a = 0;
    const c = [0, 0, 0];
    for (let dy = 0; dy < factor; dy++) for (let dx = 0; dx < factor; dx++) {
      const p = (y * factor + dy) * icon.size + x * factor + dx;
      a += icon.alpha[p];
      for (let k = 0; k < 3; k++) c[k] += icon.rgb[p * 3 + k] * icon.alpha[p];
    }
    const p = y * size + x;
    alpha[p] = a / (factor * factor);
    for (let k = 0; k < 3; k++) rgb[p * 3 + k] = a > 0 ? c[k] / a : 0;
  }
  return { size, rgb, alpha };
}

async function options() {
  const candidates = [
    ['TILE', (s) => renderIcon(s, { variant: 'favicon' })],
    ['TILE 2X>1X', (s) => downsample(renderIcon(s * 2, { variant: 'favicon' }), 2)],
    ['CLEAR', (s) => renderIcon(s, { variant: 'plain' })],
    ['STACK', (s) => renderStacked(s)],
  ];
  const Z16 = 8;
  const Z32 = 4;
  const cellW = 128 + 8 + 32 + 24;
  const pad = 16;
  const W = pad + candidates.length * 2 * cellW;
  const rowH = 128 + 24;
  const H = 36 + 2 * rowH;
  const sheet = createCanvas(W, H, SHEET_BG);
  candidates.forEach(([name, make], ci) => {
    [LIGHT, DARK].forEach((backdrop, bi) => {
      const x = pad + (ci * 2 + bi) * cellW;
      drawText(sheet, `${name} ${bi ? 'DK' : 'LT'}`, x, 10, '#a3a3a3', 2);
      [16, 32].forEach((size, ri) => {
        const zoom = size === 16 ? Z16 : Z32;
        const y = 36 + ri * rowH;
        const flat = flatten(make(size), backdrop);
        fillBox(sheet, x - 4, y - 4, 128 + 8 + size + 8, 128 + 8, backdrop);
        blit(sheet, flat, size, x, y, zoom);
        blit(sheet, flat, size, x + 128 + 6, y, 1); // true size
      });
    });
  });
  await writeFile(new URL('favicon-options.png', OUT), encodePNG(sheet));
}

// ---------- frame strips ----------
const ROWS = {
  light16: { size: 16, backdrop: LIGHT, name: ['16 PX', 'LIGHT'] },
  dark16: { size: 16, backdrop: DARK, name: ['16 PX', 'DARK'] },
  light32: { size: 32, backdrop: LIGHT, name: ['32 PX', 'LIGHT'] },
  dark32: { size: 32, backdrop: DARK, name: ['32 PX', 'DARK'] },
};
const CELL = 102; // 96 px upscaled cell + gap
const LEFT = 84; // Row labels.
const rowHeight = (row) => 96 + 4 + row.size + 10;

/** The icon a tab shows for these poses: the 32 px canvas, scaled 2:1 for 16 px. */
function tabIcon(poses, size) {
  const icon = renderIcon(32, { poses });
  return size === 32 ? icon : downsample(icon, 32 / size);
}

/** Draws frames (columns) x rows at (x0, y0); returns the height used. */
function drawBlock(sheet, frames, rows, x0, y0) {
  frames.forEach((fr, fi) => label(sheet, `${Math.round(fr.t * 1000)}`, x0 + LEFT + fi * CELL, y0, '#7a7a7a', 1));
  let y = y0 + 12;
  for (const row of rows) {
    label(sheet, row.name[0], x0 + 4, y + 30, '#a3a3a3', 2);
    label(sheet, row.name[1], x0 + 4, y + 48, '#a3a3a3', 2);
    frames.forEach((fr, fi) => {
      const x = x0 + LEFT + fi * CELL;
      const flat = flatten(tabIcon(fr.poses, row.size), row.backdrop);
      fillBox(sheet, x - 3, y - 3, 102, rowHeight(row) - 2, row.backdrop);
      blit(sheet, flat, row.size, x, y, 96 / row.size);
      blit(sheet, flat, row.size, x, y + 100, 1); // true size
    });
    y += rowHeight(row);
  }
  return y - y0;
}

/** qa/favicon-variant-<name>.png: the 30 fps burst in rows of 18, then Firefox's 8 fps frames. */
async function variantStrip(name) {
  const frames = burstFrames(1, MOTIONS[name]);
  const gecko = burstFrames(1, GECKO_MOTIONS[name]);
  const perRow = 18;
  const blocks = [];
  for (let i = 0; i < frames.length; i += perRow) blocks.push(frames.slice(i, i + perRow));
  const all = [ROWS.light16, ROWS.dark16, ROWS.light32, ROWS.dark32];
  const geckoRows = [ROWS.light16, ROWS.dark32];
  const blockH = (rows) => 12 + rows.reduce((h, r) => h + rowHeight(r), 0) + 18;
  const W = LEFT + perRow * CELL + 16;
  const H = 64 + blocks.length * blockH(all) + 26 + blockH(geckoRows);
  const sheet = createCanvas(W, H, SHEET_BG);
  const ms = Math.round(frames.at(-1).t * 1000);
  const title = `${name}${name === DEFAULT_VARIANT ? ' (DEFAULT)' : ''}`;
  label(sheet, title, 8, 10, '#ffffff', 3);
  label(sheet, `${DESCRIPTIONS[name]}. ${frames.length} FRAMES AT 30 FPS, ${ms} MS, STRENGTH 1`, 8, 40, '#a3a3a3', 2);
  let y = 64;
  for (const block of blocks) y += drawBlock(sheet, block, all, 0, y) + 18;
  label(sheet, `FIREFOX: ${gecko.length} FRAMES AT 8 FPS, SAME ${ms} MS`, 8, y + 4, '#d0d0d0', 2);
  drawBlock(sheet, gecko, geckoRows, 0, y + 26);
  await writeFile(new URL(`favicon-variant-${name}.png`, OUT), encodePNG(sheet));
}

/** qa/favicon-variants-sheet.png: every variant, every other frame, stacked and labelled. */
async function variantsSheet(names) {
  const rows = [ROWS.light16, ROWS.dark16, ROWS.light32, ROWS.dark32];
  const pick = (frames) => frames.filter((_, i) => i % 2 === 0 || i === frames.length - 1);
  const columns = pick(burstFrames(1, MOTIONS[names[0]])).length;
  const sectionH = 34 + 12 + rows.reduce((h, r) => h + rowHeight(r), 0) + 24;
  const W = LEFT + columns * CELL + 16;
  const H = 70 + names.length * sectionH;
  const sheet = createCanvas(W, H, SHEET_BG);
  label(sheet, 'SUPH FAVICON: FOUR VARIANTS', 8, 10, '#ffffff', 3);
  label(sheet, 'EVERY OTHER FRAME OF A 1160 MS BURST AT STRENGTH 1. 16 PX IS THE 32 PX CANVAS SCALED 2:1 (1X SCREENS)', 8, 42, '#a3a3a3', 2);
  names.forEach((name, ni) => {
    const y0 = 70 + ni * sectionH;
    fillBox(sheet, 0, y0 - 6, W, 2, '#3a3a3a');
    const pen = label(sheet, name, 8, y0 + 4, name === DEFAULT_VARIANT ? '#fa2523' : '#ffffff', 3);
    const tag = name === DEFAULT_VARIANT ? ' DEFAULT. ' : '  ';
    label(sheet, `${tag}${DESCRIPTIONS[name]}`, pen + 6, y0 + 10, name === DEFAULT_VARIANT ? '#fa2523' : '#a3a3a3', 2);
    drawBlock(sheet, pick(burstFrames(1, MOTIONS[name])), rows, 0, y0 + 34);
  });
  await writeFile(new URL('favicon-variants-sheet.png', OUT), encodePNG(sheet));
}

/** qa/favicon-zoom.png: the default variant, every third frame at 32 px, large, to judge the shapes. */
async function zoom() {
  const frames = burstFrames(1, MOTIONS[DEFAULT_VARIANT]).filter((_, i) => i % 3 === 0).slice(0, 12);
  const Z = 6;
  const cell = 32 * Z + 8;
  const sheet = createCanvas(8 + 6 * cell, 8 + 2 * (cell + 18), SHEET_BG);
  frames.forEach((fr, i) => {
    const x = 8 + (i % 6) * cell;
    const y = 8 + Math.floor(i / 6) * (cell + 18);
    label(sheet, `${DEFAULT_VARIANT} ${Math.round(fr.t * 1000)} MS`, x, y, '#7a7a7a', 2);
    blit(sheet, flatten(renderIcon(32, { poses: fr.poses }), DARK), 32, x, y + 18, Z);
  });
  await writeFile(new URL('favicon-zoom.png', OUT), encodePNG(sheet));
}

const asked = process.argv.slice(2);
const unknown = asked.filter((n) => !VARIANT_NAMES.includes(n));
if (unknown.length) throw new Error(`Unknown variant(s) ${unknown.join(', ')}: expected ${VARIANT_NAMES.join(', ')}`);
const names = asked.length ? asked : [...VARIANT_NAMES];
await mkdir(OUT, { recursive: true });
if (!asked.length) {
  await options();
  await zoom();
}
for (const name of names) await variantStrip(name);
await variantsSheet(names);
console.log(`wrote ${[
  ...(asked.length ? [] : ['favicon-options.png', 'favicon-zoom.png']),
  ...names.map((n) => `favicon-variant-${n}.png`),
  'favicon-variants-sheet.png',
].map((f) => `qa/${f}`).join(', ')}`);
