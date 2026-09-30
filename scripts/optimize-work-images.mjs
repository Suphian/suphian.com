// Writes the Abacus card logo as AVIF, WebP and a re-encoded PNG next to each other in
// public/work, so StoryCard can serve <picture> (AVIF, then WebP, then PNG).
// The master is assets-src/work/abacus-white-original.png, so re-running never re-compresses
// an already-optimized file.  Run: npm run images:work
import { readFile, stat, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const master = new URL('../assets-src/work/abacus-white-original.png', import.meta.url);
const out = (ext) => new URL(`../public/work/abacus-white.${ext}`, import.meta.url);
const input = await readFile(master);
const meta = await sharp(input).metadata();

const avif = await sharp(input).avif({ quality: 60, effort: 6 }).toBuffer();
const webpLossless = await sharp(input).webp({ lossless: true, effort: 6 }).toBuffer();
const webpLossy = await sharp(input).webp({ quality: 90, effort: 6, alphaQuality: 100 }).toBuffer();
const webp = webpLossless.length <= webpLossy.length ? webpLossless : webpLossy;
const png = await sharp(input).png({ palette: true, compressionLevel: 9, effort: 10 }).toBuffer();

await writeFile(out('avif'), avif);
await writeFile(out('webp'), webp);
await writeFile(out('png'), png);

const kb = (n) => `${(n / 1024).toFixed(1)} KB`;
console.log(`abacus-white ${meta.width}x${meta.height}`);
console.log(`  original png      ${kb((await stat(master)).size)}`);
console.log(`  png (palette)     ${kb(png.length)}`);
console.log(`  webp (${webp === webpLossless ? 'lossless' : 'q90'})   ${kb(webp.length)}  [lossless ${kb(webpLossless.length)}, q90 ${kb(webpLossy.length)}]`);
console.log(`  avif q60          ${kb(avif.length)}`);
