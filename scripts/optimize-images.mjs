/**
 * One-shot / repeatable image optimizer (run: `npm run optimize:images`).
 *
 * Generates web-optimized derivatives from the editable masters in /assets-src
 * (masters live outside /public so they don't ship to the CDN):
 *   - background.png (2.1 MB tiled grain) -> background.webp (tiny, repeats identically)
 *   - logo-master.png (449 KB)            -> og-image.jpg (1200x1200) + og-image-wide.jpg (1200x630)
 *                                         -> favicon-256.png / apple-touch-icon.png / PWA icons
 *   - logo-nav.webp (1536x1024)           -> logo-292.webp (navbar logo, renders at <=146px tall)
 */
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { existsSync, mkdirSync, statSync } from 'node:fs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const p = (...s) => path.join(root, ...s);
const kb = (file) => (existsSync(file) ? `${(statSync(file).size / 1024).toFixed(1)} KB` : 'missing');

const BG_SRC = p('assets-src/background.png');
const BG_OUT = p('public/assets/textures/background.webp');
const LOGO_SRC = p('assets-src/logo-master.png');
const NAV_LOGO_SRC = p('assets-src/logo-nav.webp');
const NAV_LOGO_OUT = p('public/assets/logos/logo-292.webp');
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
    console.log(`logo-master.png (${kb(LOGO_SRC)}) -> og-image.jpg (${kb(og)})`);

    // 2b. Wide OG variant — twitter:card summary_large_image expects ~2:1
    //     (1200x630); the square version gets cropped by Twitter/X and Slack.
    const ogWide = path.join(IMG_DIR, 'og-image-wide.jpg');
    await sharp(LOGO_SRC)
      .resize(1200, 630, { fit: 'contain', background: { r: 0, g: 0, b: 0 } })
      .flatten({ background: { r: 0, g: 0, b: 0 } })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(ogWide);
    console.log(`logo-master.png (${kb(LOGO_SRC)}) -> og-image-wide.jpg (${kb(ogWide)})`);

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

  // 4. Navbar logo — renders at h-116/146 with w-auto; 292px tall (2x retina)
  //    replaces shipping the full 1536x1024 master on every cold load.
  if (existsSync(NAV_LOGO_SRC)) {
    mkdirSync(path.dirname(NAV_LOGO_OUT), { recursive: true });
    await sharp(NAV_LOGO_SRC)
      .resize({ height: 292, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toFile(NAV_LOGO_OUT);
    console.log(`logo-nav.webp (${kb(NAV_LOGO_SRC)}) -> logo-292.webp (${kb(NAV_LOGO_OUT)})`);
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
