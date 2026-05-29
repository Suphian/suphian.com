/**
 * One-shot / repeatable image optimizer (run: `npm run optimize:images`).
 *
 * Generates web-optimized derivatives from the large source assets in /public:
 *   - background.png (2.1 MB tiled grain)  -> background.webp (tiny, repeats identically)
 *   - profile logo PNG (449 KB)            -> og-image.jpg (1200x1200, broad crawler support)
 *                                          -> favicon-256.png / apple-touch-icon.png
 *
 * Source files are left untouched so they remain the editable masters; only the
 * references in index.html / index.css / SEOHead point at the optimized output.
 */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { existsSync, mkdirSync, statSync } from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const p = (...s) => path.join(root, ...s);
const kb = (file) => (existsSync(file) ? `${(statSync(file).size / 1024).toFixed(1)} KB` : 'missing');

const BG_SRC = p('public/assets/textures/background.png');
const BG_OUT = p('public/assets/textures/background.webp');
const LOGO_SRC = p(
  'public/assets/images/u1327668621_logo_SUPH_--chaos_15_--ar_23_--profile_aa8enny_--st_b2040bf7-71f1-4263-bf3e-422f9561d81e.png'
);
const IMG_DIR = p('public/assets/images');

async function run() {
  mkdirSync(IMG_DIR, { recursive: true });

  // 1. Grain texture — repeats via CSS background-repeat at 0.1 opacity, so a
  //    small downscaled WebP is visually indistinguishable from the 2.1 MB PNG.
  if (existsSync(BG_SRC)) {
    await sharp(BG_SRC)
      .resize({ width: 1024, withoutEnlargement: true })
      .webp({ quality: 60 })
      .toFile(BG_OUT);
    console.log(`background.png (${kb(BG_SRC)}) -> background.webp (${kb(BG_OUT)})`);
  }

  // 2. OG image — square 1200x1200 JPEG on black for the widest unfurler support
  //    (some crawlers/clients still choke on WebP/PNG-with-alpha OG images).
  if (existsSync(LOGO_SRC)) {
    const og = path.join(IMG_DIR, 'og-image.jpg');
    await sharp(LOGO_SRC)
      .resize(1200, 1200, { fit: 'contain', background: { r: 0, g: 0, b: 0 } })
      .flatten({ background: { r: 0, g: 0, b: 0 } })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(og);
    console.log(`profile logo (${kb(LOGO_SRC)}) -> og-image.jpg (${kb(og)})`);

    // 3. Favicons + PWA icons — small PNGs instead of fetching the 449 KB original.
    for (const [name, size] of [
      ['favicon-256.png', 256],
      ['apple-touch-icon.png', 180],
      ['icon-192.png', 192],
      ['icon-512.png', 512],
    ]) {
      const out = path.join(IMG_DIR, name);
      await sharp(LOGO_SRC)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0 } })
        .png({ compressionLevel: 9 })
        .toFile(out);
      console.log(`  -> ${name} (${kb(out)})`);
    }
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
