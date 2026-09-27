/**
 * Node-only icon rasterizer for build and QA scripts (never bundled). Draws
 * SUPH poses with the same layout and matrices as the browser favicon, using
 * the repo's dependency-free rasterizer (tests/lib/raster.mjs, read-only), and
 * keeps a separate coverage channel so icons can be written with real alpha.
 */
import { deflateSync } from 'node:zlib';
import { createCanvas, fillPolys, flattenPath, transformPolys } from '../../tests/lib/raster.mjs';
import { REST_POSE } from './frame-math.js';
import { RED, SUPH, TILE_COLOR, iconLayout, letterMatrix, roundedRectPath } from './layout.js';

const hex = (color) => [1, 3, 5].map((o) => parseInt(color.slice(o, o + 2), 16));
const glyphPolys = SUPH.map((l) => flattenPath(l.path, 24));
const REST = [REST_POSE, REST_POSE, REST_POSE, REST_POSE];

/**
 * Renders SUPH at `size` px. Returns { size, rgb: Float32Array, alpha: Float32Array (0..1) }.
 * `poses` are the four letter poses; `variant` is a key of VARIANTS or a variant object.
 */
export function renderIcon(size, { variant = 'favicon', poses = REST, color = RED, tile = TILE_COLOR } = {}) {
  const layout = iconLayout(size, variant);
  const hasTile = layout.radius != null;
  // Colour plane starts as the colour that edge pixels should carry (un-premultiplied).
  const rgbCanvas = createCanvas(size, size, hex(hasTile ? tile : color));
  const alphaCanvas = createCanvas(size, size, [0, 0, 0]);
  if (hasTile) {
    const tilePolys = flattenPath(roundedRectPath(0, 0, size, size, layout.radius), 24);
    fillPolys(alphaCanvas, tilePolys, [255, 255, 255]);
  }
  poses.forEach((pose, i) => {
    const polys = transformPolys(glyphPolys[i], letterMatrix(i, pose, layout));
    fillPolys(rgbCanvas, polys, color);
    if (!hasTile) fillPolys(alphaCanvas, polys, [255, 255, 255]);
  });
  const alpha = new Float32Array(size * size);
  for (let p = 0; p < alpha.length; p++) alpha[p] = Math.min(1, alphaCanvas.px[p * 3] / 255);
  return { size, rgb: rgbCanvas.px, alpha };
}

/** Composites an icon over an opaque backdrop colour; returns an RGB Float32Array. */
export function flatten(icon, backdrop) {
  const bg = hex(backdrop);
  const out = new Float32Array(icon.size * icon.size * 3);
  for (let p = 0; p < icon.alpha.length; p++) {
    const a = icon.alpha[p];
    for (let c = 0; c < 3; c++) out[p * 3 + c] = icon.rgb[p * 3 + c] * a + bg[c] * (1 - a);
  }
  return out;
}

// ---------- RGBA PNG ----------
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
const byte = (v) => Math.max(0, Math.min(255, Math.round(v)));

/** Encodes an icon as PNG: RGBA when it has any transparency, RGB otherwise. */
export function encodeIconPNG(icon) {
  const { size, rgb, alpha } = icon;
  const opaque = alpha.every((a) => a >= 0.999);
  const channels = opaque ? 3 : 4;
  const stride = size * channels + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const p = y * size + x;
      const o = y * stride + 1 + x * channels;
      raw[o] = byte(rgb[p * 3]);
      raw[o + 1] = byte(rgb[p * 3 + 1]);
      raw[o + 2] = byte(rgb[p * 3 + 2]);
      if (!opaque) raw[o + 3] = byte(alpha[p] * 255);
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = opaque ? 2 : 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}
