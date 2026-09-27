import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { seo } from '../src/content.js';
import { createLogoSvg } from '../src/wordmark/lettering.js';

// The site's own traced lettering. All inputs are local; no runtime dependency.
const asset = (path) => new URL(`../public/${path}`, import.meta.url);

// Suphian 2026-09-27: the link preview is just the bubbly SUPHIAN, and it must hold up on
// WhatsApp and iMessage. Use one square OG source instead of relying on clients to choose
// between multiple og:image tags. The full-width lettering fits inside its centered 1.91:1
// crop too. A client may display the square or crop it wide; neither cuts off the name.
// Twitter gets its own landscape export for summary_large_image.
// Render the homepage's actual paths, gradient and surface texture at 2x, then downsample
// once for smooth edges. An optimized palette PNG preserves this artwork without JPEG
// fringes around the red lettering. Both published files stay within a 250 KB budget.
const svg = createLogoSvg({ idPrefix: 'share-' });
const logo = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
const cards = [
  { url: seo.og.image, width: seo.og.imageWidth, height: seo.og.imageHeight },
  { url: seo.twitter.image, width: 1200, height: 630 },
];

await mkdir(asset('og/'), { recursive: true });
const browser = await chromium.launch();
try {
  for (const { url, width, height } of cards) {
    const card = new URL(url).pathname.slice(1);
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
    await page.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
      html, body { margin: 0; width: ${width}px; height: ${height}px; overflow: hidden; background: #080808; }
      body { display: grid; place-items: center; }
      /* Original 1658 × 592 proportions, 60px side margins, centered in either source. */
      .wordmark { display: block; width: 1080px; height: auto; }
    </style></head><body>
      <img class="wordmark" src="${logo}" alt="SUPHIAN" />
    </body></html>`);
    await page.evaluate(() => Promise.all([...document.images].map((image) => image.decode())));
    const master = await page.screenshot({ type: 'png' });
    const shot = await sharp(master)
      .resize(width, height, { kernel: 'lanczos3' })
      .png({ palette: true, quality: 99, dither: 0, effort: 10, compressionLevel: 9 })
      .toBuffer();
    if (shot.readUInt32BE(16) !== width || shot.readUInt32BE(20) !== height) {
      throw new Error(`Card is ${shot.readUInt32BE(16)} × ${shot.readUInt32BE(20)}, expected ${width} × ${height}`);
    }
    if (shot.length >= 250 * 1024) throw new Error(`${card} exceeds the 250 KB image budget`);
    await writeFile(fileURLToPath(asset(card)), shot);
    console.log(`Exported public/${card} (${width} × ${height}, ${shot.length} bytes).`);
    await page.close();
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
console.log('Exported public/favicon.ico (32 × 32).');
