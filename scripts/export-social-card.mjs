import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { seo } from '../src/content.js';
import { createLogoSvg } from '../src/wordmark/lettering.js';

const asset = (path) => new URL(`../public/${path}`, import.meta.url);
const archive = new URL('../design/social-preview/assets/', import.meta.url);
const logo = `data:image/svg+xml;base64,${Buffer.from(createLogoSvg({ idPrefix: 'preview-' })).toString('base64')}`;

// The full Signature wordmark stays inside both the square and its centered wide
// crop. One square OG source works for WhatsApp's compact thumbnail; Twitter has
// its own wide source. Keep all three original review designs unchanged.
const cards = [
  { name: 'signature-square', url: seo.og.image, width: seo.og.imageWidth, height: seo.og.imageHeight, logoWidth: 1080 },
  { name: 'signature-wide', url: seo.twitter.image, width: 1200, height: 630, logoWidth: 1024 },
];
await mkdir(asset('og/'), { recursive: true });
await mkdir(archive, { recursive: true });
const browser = await chromium.launch();
try {
  for (const { name, url, width, height, logoWidth } of cards) {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
    await page.setContent(`<!doctype html><html lang="en"><meta charset="utf-8"><style>
      * { box-sizing:border-box; }
      html,body { width:${width}px; height:${height}px; margin:0; overflow:hidden; }
      body { position:relative; background:radial-gradient(ellipse at 83% 0%, #372024 0%, transparent 59%),linear-gradient(140deg,#161618 0%,#080808 70%); }
      .plane { position:absolute; inset:-300px -60px ${height - 260}px -190px; transform:rotate(-17deg); background:linear-gradient(180deg,transparent 45%,#ffffff04 100%); border-bottom:1px solid #ffffff08; }
      img { position:absolute; display:block; width:${logoWidth}px; height:auto; left:50%; top:50%; transform:translate(-50%,-50%); }
    </style><body><div class="plane"></div><img src="${logo}" alt="SUPHIAN"></body></html>`);
    await page.evaluate(() => Promise.all([...document.images].map(image => image.decode())));
    const master = await page.screenshot({ type: 'png' });
    const pngCard = await sharp(master).resize(width, height)
      .png({ palette: true, quality: 98, dither: 0, effort: 10, compressionLevel: 9 }).toBuffer();
    if (pngCard.readUInt32BE(16) !== width || pngCard.readUInt32BE(20) !== height) throw new Error('Image dimensions mismatch');
    if (pngCard.length >= 250 * 1024) throw new Error(`${name}: ${pngCard.length} bytes exceeds the 250 KB budget`);
    await writeFile(asset(new URL(url).pathname.slice(1)), pngCard);
    await writeFile(new URL(`${name}.png`, archive), pngCard);
    console.log(`${name}: ${width} x ${height}, ${pngCard.length} bytes`);
    await page.close();
  }
} finally { await browser.close(); }

// ICO supports embedded PNG images. Keep the existing, current 32px mark intact.
const png = await readFile(asset('icons/favicon-32.png'));
const ico = Buffer.alloc(22 + png.length);
ico.writeUInt16LE(1, 2);
ico.writeUInt16LE(1, 4);
ico[6] = 32;
ico[7] = 32;
ico.writeUInt16LE(1, 10);
ico.writeUInt16LE(32, 12);
ico.writeUInt32LE(png.length, 14);
ico.writeUInt32LE(22, 18);
png.copy(ico, 22);
await writeFile(asset('favicon.ico'), ico);
