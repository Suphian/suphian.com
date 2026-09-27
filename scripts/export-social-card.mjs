import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { chromium } from '@playwright/test';

// Use the site's own vector and typeface. All inputs are local; no runtime dependency.
const asset = (path) => new URL(`../public/${path}`, import.meta.url);
const dataUrl = async (path, type) => `data:${type};base64,${(await readFile(asset(path))).toString('base64')}`;
const [logo, regular, semibold] = await Promise.all([
  dataUrl('logos/full-name.svg', 'image/svg+xml'),
  dataUrl('fonts/PPNeueMontreal-Regular.woff2', 'font/woff2'),
  dataUrl('fonts/PPNeueMontreal-Semibold.woff2', 'font/woff2'),
]);

await mkdir(asset('og/'), { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(`<!doctype html><html lang="en"><head><meta charset="utf-8"><style>
    @font-face { font-family: Montreal; src: url('${regular}') format('woff2'); font-weight: 400; }
    @font-face { font-family: Montreal; src: url('${semibold}') format('woff2'); font-weight: 600; }
    * { box-sizing: border-box; }
    html, body { margin: 0; width: 1200px; height: 630px; overflow: hidden; }
    body { background: #080808; color: #f4f4f2; font-family: Montreal, sans-serif; }
    .wordmark { position: absolute; left: 56px; top: 44px; width: 1088px; height: 388px; }
    .identity { position: absolute; left: 56px; right: 56px; top: 477px; border-top: 1px solid #303030; padding-top: 28px; }
    .name { margin: 0; font-size: 38px; font-weight: 600; line-height: 1.12; letter-spacing: -1px; }
    .discipline { margin: 12px 0 0; color: #a9a9a6; font-size: 26px; line-height: 1.2; letter-spacing: -.3px; }
    .url { position: absolute; right: 0; top: 35px; font-size: 26px; line-height: 1.2; color: #a9a9a6; }
  </style></head><body>
    <img class="wordmark" src="${logo}" alt="SUPHIAN" />
    <div class="identity"><h1 class="name">Suphian Tweel</h1><p class="discipline">Product · Payments · AI</p><span class="url">suphian.com</span></div>
  </body></html>`);
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all([...document.images].map((image) => image.decode()));
  });
  await page.screenshot({ path: asset('og/suphian.png').pathname.replace(/^\/([A-Za-z]:)/, '$1') });
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
console.log('Exported public/og/suphian.png (1200 × 630) and public/favicon.ico (32 × 32).');
