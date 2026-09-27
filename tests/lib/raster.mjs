/**
 * Tiny dependency-free rasterizer for the QA filmstrip: SVG path data (M L C Z,
 * absolute) under SVG transform lists, even-odd filled with 4x vertical
 * supersampling and exact horizontal coverage, written out as PNG via zlib.
 * Only what the filmstrip needs; not a general SVG renderer.
 */
import { deflateSync } from 'node:zlib';

// ---------- affine transforms (SVG matrix order: [a b c d e f]) ----------
const multiply = (m, n) => [
  m[0] * n[0] + m[2] * n[1],
  m[1] * n[0] + m[3] * n[1],
  m[0] * n[2] + m[2] * n[3],
  m[1] * n[2] + m[3] * n[3],
  m[0] * n[4] + m[2] * n[5] + m[4],
  m[1] * n[4] + m[3] * n[5] + m[5],
];
export const IDENTITY = [1, 0, 0, 1, 0, 0];

/** Parses translate / scale / skewX / skewY / rotate lists into one matrix. */
export function parseTransform(text = '') {
  let m = IDENTITY;
  for (const [, fn, args] of text.matchAll(/(\w+)\s*\(([^)]*)\)/g)) {
    const a = args.trim().split(/[\s,]+/).map(Number);
    let t;
    if (fn === 'translate') t = [1, 0, 0, 1, a[0], a[1] ?? 0];
    else if (fn === 'scale') t = [a[0], 0, 0, a[1] ?? a[0], 0, 0];
    else if (fn === 'skewX') t = [1, 0, Math.tan((a[0] * Math.PI) / 180), 1, 0, 0];
    else if (fn === 'skewY') t = [1, Math.tan((a[0] * Math.PI) / 180), 0, 1, 0, 0];
    else if (fn === 'rotate') {
      const r = (a[0] * Math.PI) / 180;
      t = [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0];
    } else throw new Error(`Unsupported transform ${fn}`);
    m = multiply(m, t);
  }
  return m;
}
export const compose = (...ms) => ms.reduce((acc, m) => multiply(acc, m), IDENTITY);

// ---------- path flattening ----------
/** Flattens absolute M/L/C/Z path data into closed polylines (arrays of [x, y]). */
export function flattenPath(d, segments = 14) {
  const tokens = d.match(/[MLCZmlcz]|-?\d*\.?\d+(?:e-?\d+)?/g);
  const polys = [];
  let poly = null;
  let cx = 0;
  let cy = 0;
  let i = 0;
  let cmd = '';
  const next = () => Number(tokens[i++]);
  while (i < tokens.length) {
    if (/[A-Za-z]/.test(tokens[i])) cmd = tokens[i++];
    if (cmd === 'M') {
      cx = next(); cy = next();
      poly = [[cx, cy]];
      polys.push(poly);
      cmd = 'L';
    } else if (cmd === 'L') {
      cx = next(); cy = next();
      poly.push([cx, cy]);
    } else if (cmd === 'C') {
      const x1 = next(), y1 = next(), x2 = next(), y2 = next(), x = next(), y = next();
      for (let s = 1; s <= segments; s++) {
        const t = s / segments;
        const u = 1 - t;
        poly.push([
          u * u * u * cx + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x,
          u * u * u * cy + 3 * u * u * t * y1 + 3 * u * t * t * y2 + t * t * t * y,
        ]);
      }
      cx = x; cy = y;
    } else if (cmd === 'Z' || cmd === 'z') {
      cmd = '';
    } else {
      throw new Error(`Unsupported path command ${cmd}`);
    }
  }
  return polys;
}

export const transformPolys = (polys, m) =>
  polys.map((poly) => poly.map(([x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]]));

// ---------- canvas ----------
export function createCanvas(width, height, background = [8, 8, 8]) {
  const px = new Float32Array(width * height * 3);
  for (let i = 0; i < width * height; i++) px.set(background, i * 3);
  return { width, height, px };
}

const hex = (color) => [1, 3, 5].map((o) => parseInt(color.slice(o, o + 2), 16));

/** Even-odd fill of closed polylines with anti-aliasing. */
export function fillPolys(canvas, polys, color, alpha = 1, clip = null) {
  if (alpha <= 0) return;
  const rgb = typeof color === 'string' ? hex(color) : color;
  const edges = [];
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const poly of polys) {
    for (let k = 0; k < poly.length; k++) {
      const [x0, y0] = poly[k];
      const [x1, y1] = poly[(k + 1) % poly.length];
      minX = Math.min(minX, x0); maxX = Math.max(maxX, x0);
      minY = Math.min(minY, y0); maxY = Math.max(maxY, y0);
      if (y0 !== y1) edges.push(x0, y0, x1, y1);
    }
  }
  const cx0 = clip ? clip[0] : 0, cy0 = clip ? clip[1] : 0;
  const cx1 = clip ? clip[2] : canvas.width, cy1 = clip ? clip[3] : canvas.height;
  const left = Math.max(cx0, Math.floor(minX));
  const right = Math.min(cx1, Math.ceil(maxX) + 1);
  const top = Math.max(cy0, Math.floor(minY));
  const bottom = Math.min(cy1, Math.ceil(maxY) + 1);
  if (right <= left || bottom <= top) return;
  const cover = new Float32Array(right - left + 1);
  const SS = 4;
  const xs = [];
  const span = (a, b, w) => {
    a = Math.max(a, left); b = Math.min(b, right);
    if (b <= a) return;
    const ia = Math.floor(a), ib = Math.floor(b);
    if (ia === ib) { cover[ia - left] += (b - a) * w; return; }
    cover[ia - left] += (ia + 1 - a) * w;
    for (let q = ia + 1; q < ib; q++) cover[q - left] += w;
    if (ib < right) cover[ib - left] += (b - ib) * w;
  };
  for (let y = top; y < bottom; y++) {
    cover.fill(0);
    for (let s = 0; s < SS; s++) {
      const sy = y + (s + 0.5) / SS;
      xs.length = 0;
      for (let e = 0; e < edges.length; e += 4) {
        const y0 = edges[e + 1], y1 = edges[e + 3];
        if ((y0 <= sy && sy < y1) || (y1 <= sy && sy < y0)) {
          xs.push(edges[e] + ((sy - y0) * (edges[e + 2] - edges[e])) / (y1 - y0));
        }
      }
      xs.sort((a, b) => a - b);
      for (let k = 0; k + 1 < xs.length; k += 2) span(xs[k], xs[k + 1], 1 / SS);
    }
    for (let x = left; x < right; x++) {
      const a = Math.min(1, cover[x - left]) * alpha;
      if (a <= 0) continue;
      const o = (y * canvas.width + x) * 3;
      canvas.px[o] += (rgb[0] - canvas.px[o]) * a;
      canvas.px[o + 1] += (rgb[1] - canvas.px[o + 1]) * a;
      canvas.px[o + 2] += (rgb[2] - canvas.px[o + 2]) * a;
    }
  }
}

export function fillRect(canvas, x, y, w, h, color, alpha = 1) {
  fillPolys(canvas, [[[x, y], [x + w, y], [x + w, y + h], [x, y + h]]], color, alpha);
}

// ---------- 5x7 bitmap text ----------
// Rows as 5-bit strings, top to bottom.
const GLYPHS = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11111', '00010', '00100', '00010', '00001', '10001', '01110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
  '6': ['00110', '01000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  '=': ['00000', '00000', '11111', '00000', '11111', '00000', '00000'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '/': ['00001', '00010', '00010', '00100', '01000', '01000', '10000'],
  A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  C: ['01110', '10001', '10000', '10000', '10000', '10001', '01110'],
  D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  G: ['01110', '10001', '10000', '10111', '10001', '10001', '01111'],
  H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  I: ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  N: ['10001', '10001', '11001', '10101', '10011', '10001', '10001'],
  O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
};

export function drawText(canvas, text, x, y, color = '#a3a3a3', size = 2) {
  const rgb = hex(color);
  let pen = x;
  for (const ch of text.toUpperCase()) {
    const rows = GLYPHS[ch];
    if (rows) {
      rows.forEach((row, ry) => {
        for (let rx = 0; rx < 5; rx++) {
          if (row[rx] !== '1') continue;
          for (let dy = 0; dy < size; dy++) {
            for (let dx = 0; dx < size; dx++) {
              const px = pen + rx * size + dx;
              const py = y + ry * size + dy;
              if (px < 0 || py < 0 || px >= canvas.width || py >= canvas.height) continue;
              canvas.px.set(rgb, (py * canvas.width + px) * 3);
            }
          }
        }
      });
    }
    pen += 6 * size;
  }
  return pen;
}

// ---------- PNG ----------
const CRC_TABLE = new Uint32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
function crc32(buf) {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}
export function encodePNG(canvas) {
  const { width, height, px } = canvas;
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 3 + 1);
    for (let x = 0; x < width * 3; x++) raw[row + 1 + x] = Math.max(0, Math.min(255, Math.round(px[y * width * 3 + x])));
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // truecolour RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
