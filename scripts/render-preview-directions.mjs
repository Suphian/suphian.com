import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import sharp from 'sharp';
import { createLogoSvg } from '../src/wordmark/lettering.js';

// Preserved original social-preview directions. Production now uses Signature
// square/wide exports from export-social-card.mjs; keep these originals intact.
// Run from any working directory: node scripts/render-preview-directions.mjs
const out = new URL('../design/social-preview/assets/', import.meta.url);
await mkdir(out, { recursive: true });
const font = async (name) => `data:font/woff2;base64,${(await readFile(new URL(`../src/fonts/${name}`, import.meta.url))).toString('base64')}`;
const logo = `data:image/svg+xml;base64,${Buffer.from(createLogoSvg({ idPrefix: 'preview-' })).toString('base64')}`;
const [regular, semibold] = await Promise.all([font('PPNeueMontreal-Regular.woff2'), font('PPNeueMontreal-Semibold.woff2')]);
const common = `
  @font-face { font-family: Montreal; src: url('${regular}'); font-weight:400; }
  @font-face { font-family: Montreal; src: url('${semibold}'); font-weight:600; }
  * { box-sizing:border-box; } html,body { width:1200px; height:630px; margin:0; overflow:hidden; }
  body { position:relative; font-family:Montreal,Arial,sans-serif; -webkit-font-smoothing:antialiased; }
  img { display:block; position:absolute; height:auto; } p { margin:0; }
`;
const cards = {
  signature: {
    css: `
      body { background:radial-gradient(ellipse at 83% 0%, #372024 0%, transparent 59%),linear-gradient(140deg,#161618 0%,#080808 70%); }
      .plane { position:absolute; inset:-300px -60px 370px -190px; transform:rotate(-17deg); background:linear-gradient(180deg,transparent 45%,#ffffff04 100%); border-bottom:1px solid #ffffff08; }
      img { width:1024px; left:88px; top:132px; }
    `,
    body: `<div class="plane"></div><img src="${logo}" alt="SUPHIAN">`,
  },
  editorial: {
    css: `
      body { color:#f8f8f8; background:#0c0c0d; }
      .headline { position:absolute; left:64px; top:64px; font-size:96px; line-height:.99; letter-spacing:-5px; font-weight:400; }
      .headline span { color:#fb2726; }
      .rule { position:absolute; width:1px; left:618px; top:64px; bottom:64px; background:#ffffff20; }
      img { width:456px; right:64px; top:215px; }
      .name { position:absolute; left:66px; bottom:85px; font-size:29px; letter-spacing:-.3px; }
      .role { position:absolute; left:66px; bottom:48px; font-size:23px; color:#a3a3a3; }
      .url { position:absolute; right:64px; bottom:57px; font-size:25px; color:#b3b3b3; }
    `,
    body: `<p class="headline">Good ideas<br>deserve to<br>get made<span>.</span></p><div class="rule"></div><img src="${logo}" alt="SUPHIAN"><p class="name">Suphian Tweel</p><p class="role">Product / Payments / AI</p><p class="url">suphian.com</p>`,
  },
  contrast: {
    css: `
      body { color:#161616; background:#fafafa; }
      img { width:1064px; left:68px; top:72px; }
      .rule { position:absolute; left:68px; right:68px; top:506px; height:1px; background:#d6d6d6; }
      .name { position:absolute; left:68px; top:541px; font-size:31px; letter-spacing:-.6px; }
      .role { position:absolute; right:68px; top:545px; font-size:25px; color:#555; letter-spacing:-.1px; }
    `,
    body: `<img src="${logo}" alt="SUPHIAN"><div class="rule"></div><p class="name">Suphian Tweel</p><p class="role">Product / Payments / AI</p>`,
  },
};
const browser = await chromium.launch();
try {
  for (const [name, card] of Object.entries(cards)) {
    const page = await browser.newPage({ viewport: { width:1200, height:630 }, deviceScaleFactor:2 });
    const html = `<!doctype html><html lang="en"><meta charset="utf-8"><title>${name}</title><style>${common}${card.css}</style><body>${card.body}</body></html>`;
    await page.setContent(html);
    await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map(i => i.decode())); });
    const master = await page.screenshot({ type:'png' });
    // Review masters are full RGB PNGs: avoid degrading artwork to hit a file budget before selection.
    const png = await sharp(master).resize(1200,630).png({ compressionLevel:9 }).toBuffer();
    await writeFile(new URL(`${name}.png`, out), png);
    await writeFile(new URL(`${name}.html`, out), html);
    console.log(`${name}: ${png.length} bytes — ${fileURLToPath(new URL(`${name}.png`, out))}`);
    await page.close();
  }
} finally { await browser.close(); }
