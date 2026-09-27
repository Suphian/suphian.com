import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import { seo } from '../src/content.js';

// The site's own traced lettering. All inputs are local; no runtime dependency.
const asset = (path) => new URL(`../public/${path}`, import.meta.url);

// Suphian 2026-09-27: the link preview is just the bubbly SUPHIAN, and it must hold up on
// WhatsApp and iMessage. Three rules follow from how they show it:
// - WhatsApp often shows a small square thumbnail cut from the middle, so the lettering sits
//   inside the centre square with room to spare (the wide preview gets calm black around it).
// - At thumbnail size the grain turns to mush, so the card drops the grain filter and keeps
//   the lettering's shading gradient: flat colour downsamples cleanly.
// - Flat colour suits PNG, rendered at 2× (2400 × 1260) so large previews stay crisp and the
//   file stays small (a test keeps it under 250 KB; WhatsApp drops images over about 300 KB).
const svg = (await readFile(asset('logos/full-name.svg'), 'utf8')).replace(/\s*filter="url\(#[^)]*\)"/g, '');
const logo = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
const card = new URL(seo.og.image).pathname.slice(1);
const { imageWidth, imageHeight } = seo.og;
const scale = imageWidth / 1200;

await mkdir(asset('og/'), { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: scale });
  await page.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
    html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; background: #080808; }
    /* 560 × 200 (viewBox 1658 × 592), centred: 35px clear of the 630px centre square each side. */
    .wordmark { position: absolute; left: 320px; top: 215px; width: 560px; height: 200px; }
  </style></head><body>
    <img class="wordmark" src="${logo}" alt="SUPHIAN" />
  </body></html>`);
  await page.evaluate(() => Promise.all([...document.images].map((image) => image.decode())));
  const shot = await page.screenshot({ path: asset(card).pathname.replace(/^\/([A-Za-z]:)/, '$1'), type: 'png' });
  if (shot.readUInt32BE(16) !== imageWidth || shot.readUInt32BE(20) !== imageHeight) {
    throw new Error(`Card is ${shot.readUInt32BE(16)} × ${shot.readUInt32BE(20)}, expected ${imageWidth} × ${imageHeight}`);
  }
} finally {
  await browser.close();
}

// ICO supports embedded PNG images. Keep the existing, current 32px mark intact.
const png = await readFile(asset('icons/favicon-32.png'));
const ico = Buffer.alloc(22 + png.length);
ico.writeUInt16LE(1, 2); // Icon type.
ico.writeUInt16LE(1, 4); // One image.
ico[6] = 32;
ico[7] = 32;
ico.writeUInt16LE(1, 10); // Color planes.
ico.writeUInt16LE(32, 12); // Bits per pixel.
ico.writeUInt32LE(png.length, 14);
ico.writeUInt32LE(22, 18);
png.copy(ico, 22);
await writeFile(asset('favicon.ico'), ico);
console.log(`Exported public/${card} (${imageWidth} × ${imageHeight}) and public/favicon.ico (32 × 32).`);
