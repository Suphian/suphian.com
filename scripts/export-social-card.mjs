import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { seo } from '../src/content.js';

const asset = (path) => new URL(`../public/${path}`, import.meta.url);

// Suphian selected Editorial on 2026-09-27. Publish the reviewed full-color PNG
// byte for byte. All three designs and their source renderer stay in the repo.
// Regenerate intentionally with render-preview-directions.mjs, review, then export.
const card = new URL(seo.og.image).pathname.slice(1);
const pngCard = await readFile(new URL('../design/social-preview/assets/editorial.png', import.meta.url));
const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
if (!pngCard.subarray(0, 8).equals(pngSignature)) throw new Error('The approved card must be a PNG');
if (pngCard.readUInt32BE(16) !== seo.og.imageWidth || pngCard.readUInt32BE(20) !== seo.og.imageHeight) {
  throw new Error('Approved image dimensions must match Open Graph metadata');
}
if (seo.twitter.image !== seo.og.image) throw new Error('Social metadata must use the same approved card');
if (pngCard.length >= 250 * 1024) throw new Error(`${card} exceeds the 250 KB image budget`);
await mkdir(asset('og/'), { recursive: true });
await writeFile(asset(card), pngCard);
console.log(`Exported public/${card} (${seo.og.imageWidth} x ${seo.og.imageHeight}, ${pngCard.length} bytes).`);

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
console.log('Exported public/favicon.ico (32 x 32).');
