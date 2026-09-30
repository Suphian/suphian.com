import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const read = (path) => fs.readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8');

test('fonts.css: Regular and Semibold only, both with a unicode-range, from src/fonts', () => {
  const css = read('src/fonts.css').replace(/\/\*[\s\S]*?\*\//g, '');
  const faces = css.match(/@font-face\s*{[^}]*}/g) ?? [];
  assert.equal(faces.length, 2);
  assert.doesNotMatch(css, /italic/i, 'the page uses no italic');
  for (const face of faces) {
    assert.match(face, /unicode-range:\s*U\+/);
    assert.match(face, /url\('\.\/fonts\/PPNeueMontreal-(Regular|Semibold)\.woff2'\)/);
  }
  assert.ok(faces.some((face) => /font-weight:\s*400/.test(face)) && faces.some((face) => /font-weight:\s*600/.test(face)));
});

test('the fonts live in src/fonts (Vite hashes them); public/fonts is gone', () => {
  assert.equal(fs.existsSync(new URL('../../public/fonts', import.meta.url)), false);
  assert.deepEqual(fs.readdirSync(new URL('../fonts', import.meta.url)).sort(), ['PPNeueMontreal-Regular.woff2', 'PPNeueMontreal-Semibold.woff2']);
});

test('index.html has no /fonts/ path: the preload links are emitted from the built bundle', () => {
  const html = read('index.html');
  assert.doesNotMatch(html, /\/fonts\//);
  assert.match(html, /<!-- fonts:preload -->/);
  assert.match(read('vite.config.js'), /order: 'post'/);
  assert.doesNotMatch(read('vercel.json'), /"\/fonts\//, 'the fonts are under /assets, already immutable');
});

test('the PNG logo has AVIF and WebP siblings, and StoryCard serves them in a <picture>', () => {
  for (const ext of ['avif', 'webp', 'png']) assert.ok(fs.existsSync(new URL(`../../public/work/abacus-white.${ext}`, import.meta.url)), ext);
  assert.ok(fs.statSync(new URL('../../public/work/abacus-white.avif', import.meta.url)).size < 60 * 1024);
  const jsx = read('src/story/StoryCard.jsx');
  assert.match(jsx, /<picture/);
  assert.match(jsx, /type="image\/avif"/);
  assert.match(jsx, /type="image\/webp"/);
  assert.match(jsx, /width=\{dims\?\.width\}/);
});

test('the <picture> adds no box, so the logo lays out as the bare img did', () => {
  const css = read('src/story/story.css');
  assert.match(css, /\.story-card picture\s*{\s*display:\s*contents;\s*}/);
  assert.match(css, /\.story-card picture > img\s*{\s*grid-area:\s*1 \/ 1;\s*}/);
});

test('every card image carries its intrinsic width and height', async () => {
  const { story } = await import('../content.js');
  const images = story.chapters.flatMap((c) => (c.builds ? c.builds.map((b) => b.image) : [c.image]));
  assert.ok(images.length > 0);
  assert.equal(images.length, story.chapters.reduce((n, c) => n + (c.builds ? c.builds.length : c.image ? 1 : 0), 0));
  for (const image of images) assert.ok(image.width > 0 && image.height > 0, image.src);
});

test('every PNG in content has AVIF and WebP siblings under public/ (StoryCard emits both sources)', async () => {
  const { story } = await import('../content.js');
  const images = story.chapters.flatMap((c) => (c.builds ? c.builds.map((b) => b.image) : [c.image]));
  const pngs = images.filter((image) => image.src.endsWith('.png'));
  assert.ok(pngs.length > 0);
  for (const { src } of pngs) {
    for (const ext of ['avif', 'webp']) {
      const sibling = src.replace(/\.png$/, '.' + ext);
      assert.ok(fs.existsSync(new URL('../../public' + sibling, import.meta.url)), src + ' needs ' + sibling);
    }
  }
});
