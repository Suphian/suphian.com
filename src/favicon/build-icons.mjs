/**
 * Builds the static SUPH icons from the real traced paths (no browser, no deps):
 *
 *   node src/favicon/build-icons.mjs
 *
 *   public/favicon-suph.svg           static favicon (tile + flat red SUPH), legible at 16 px
 *   public/icons/favicon-32.png       PNG fallback for browsers without SVG favicons
 *   public/icons/apple-touch-icon.png 180, opaque #080808 (iOS rounds its own corners)
 *   public/icons/icon-192.png         manifest "any" (rounded tile, transparent corners)
 *   public/icons/icon-512.png         manifest "any"
 *   public/icons/icon-maskable-512.png manifest "maskable" (full bleed, SUPH inside the 80% safe circle)
 *
 * Every icon uses the same layout as the animated favicon (src/favicon/layout.js),
 * so the static icon and the canvas rest frame are the same picture.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { RED, SUPH, TILE_COLOR, VARIANTS, iconLayout, INK, roundedRectPath } from './layout.js';
import { encodeIconPNG, renderIcon } from './raster-icon.mjs';

const PUBLIC = new URL('../../public/', import.meta.url);
const ICONS = new URL('icons/', PUBLIC);

const r = (n) => Math.round(n * 1e5) / 1e5;

export function faviconSvg() {
  const size = 64;
  const L = iconLayout(size, 'favicon');
  const letters = SUPH.map((l) => `<path d="${l.path}" transform="translate(${l.x} 0)"/>`).join('\n    ');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
  <title>SUPH</title>
  <path fill="${TILE_COLOR}" d="${roundedRectPath(0, 0, size, size, L.radius)}"/>
  <g fill="${RED}" fill-rule="evenodd" transform="matrix(${r(L.k)} 0 0 ${r(L.k)} ${r(L.ox)} ${r(L.oy)})">
    ${letters}
  </g>
</svg>
`;
}

/** Checks that the maskable icon's ink box sits inside the 80%-diameter safe circle. */
function assertMaskableSafe(size) {
  const L = iconLayout(size, 'maskable');
  const c = size / 2;
  const radius = 0.4 * size;
  const xs = [INK.left, INK.right].map((x) => x * L.k + L.ox);
  const ys = [INK.top, INK.bottom].map((y) => y * L.k + L.oy);
  for (const x of xs) for (const y of ys) {
    const d = Math.hypot(x - c, y - c);
    if (d > radius) throw new Error(`maskable corner (${x.toFixed(1)}, ${y.toFixed(1)}) is ${d.toFixed(1)} from centre, outside safe radius ${radius}`);
  }
}

const PNGS = [
  ['favicon-32.png', 32, 'favicon'],
  ['apple-touch-icon.png', 180, 'touch'],
  ['icon-192.png', 192, 'any'],
  ['icon-512.png', 512, 'any'],
  ['icon-maskable-512.png', 512, 'maskable'],
];

await mkdir(ICONS, { recursive: true });
assertMaskableSafe(512);
await writeFile(new URL('favicon-suph.svg', PUBLIC), faviconSvg());
for (const [name, size, variant] of PNGS) {
  const png = encodeIconPNG(renderIcon(size, { variant }));
  await writeFile(new URL(name, ICONS), png);
  console.log(`public/icons/${name}  ${size}px  ${variant}${VARIANTS[variant].radius === 0 ? ' (opaque)' : ''}  ${png.length} bytes`);
}
console.log('public/favicon-suph.svg');
