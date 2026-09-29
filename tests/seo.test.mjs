import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';
import sharp from 'sharp';
import { hero, site, story, seo } from '../src/content.js';
import { crawlerResources, escapeHtml, renderSeoHtml, schemaGraph } from '../scripts/seo.mjs';

const template = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const html = renderSeoHtml(template);

// Every chapter's summary and links, and each of suph.app's monthly builds'.
const entries = (chapter) => [chapter, ...(chapter.builds ?? [])];

test('initial HTML contains the approved work content and contact without requiring JavaScript', () => {
  assert.ok(html.includes(escapeHtml(story.intro)));
  for (const chapter of story.chapters) {
    for (const entry of entries(chapter)) {
      assert.ok(html.includes(escapeHtml(entry.summary)), `${chapter.id}: initial HTML summary`);
      for (const link of entry.links) assert.ok(html.includes(`href="${escapeHtml(link.href)}"`));
    }
  }
  assert.ok(html.includes(`href="mailto:${site.email}"`));
  assert.doesNotMatch(html, /<!-- seo:|JavaScript required|suph\.tweel@gmail\.com/);
});

test('without JavaScript, suph.app lists every build, newest first, as "Name · Month"', () => {
  // Suphian 2026-09-28: every project, each with its month. Same order in llms-full.txt.
  const titles = ['The Toga Is Dead · August 2026', 'Quran Art · July 2026'];
  const at = (text, needles) => needles.map((needle) => text.indexOf(needle));
  const inHtml = at(html, titles.map((title) => `<h4>${escapeHtml(title)}</h4>`));
  assert.ok(inHtml.every((i) => i > 0) && inHtml[0] < inHtml[1], `profile: ${inHtml}`);
  const full = crawlerResources()['llms-full.txt'];
  const inText = at(full, titles.map((title) => `#### ${title}\n`));
  assert.ok(inText.every((i) => i > 0) && inText[0] < inText[1], `llms-full.txt: ${inText}`);
  // Under the chapter's own line, which is just its role (Suphian 2026-09-28: no build,
  // month or place there), then its intro and link, as the open card reads.
  assert.ok(full.includes(
    '### suph.app\n\nA new project every month\n\nA place where I put out a different project every month.\n\n- [Visit suph.app](https://suph.app)\n\n#### The Toga Is Dead · August 2026',
  ));
  const article = html.slice(html.indexOf('<article id="suph-app">'), html.indexOf('</section>', html.indexOf('<article id="suph-app">')));
  assert.match(article, /<h3>suph\.app<\/h3>\s*<p>A new project every month<\/p>\s*<p>A place where I put out a different project every month\.<\/p>\s*<ul><li><a href="https:\/\/suph\.app">Visit suph\.app<\/a><\/li><\/ul>/);
  assert.ok(article.indexOf('<article id="suph-app-toga">') > 0 && article.indexOf('<article id="suph-app-quran">') > article.indexOf('<article id="suph-app-toga">'));
  assert.doesNotMatch(article, /Playground|Internet/);
});

test('metadata has one stable canonical, honest entity schema and the current social card', () => {
  assert.equal((html.match(/rel="canonical"/g) ?? []).length, 1);
  assert.ok(html.includes('<link rel="canonical" href="https://suphian.com/" />'));
  assert.ok(html.includes(`<title>${escapeHtml(seo.home.title)}</title>`));
  assert.doesNotMatch(html, /ai:allow|ai:index|FAQPage|og-image|noindex/);
  const graph = schemaGraph()['@graph'];
  assert.deepEqual(graph.map((node) => node['@type']), ['Person', 'WebSite', 'ProfilePage']);
  // Steadily stays his accurate employer; Abacus Labs is an affiliation, not a job or a company he owns.
  assert.equal(graph[0].worksFor.name, 'Steadily');
  assert.deepEqual(graph[0].affiliation, [{ '@type': 'Organization', name: 'Abacus Labs', url: 'https://abacuslabs.co' }]);
  assert.equal(graph[0].email, site.email);
  assert.equal(graph[2].mainEntity['@id'], graph[0]['@id']);
  // Every entity names the one canonical URL, and every @id reference resolves inside the graph.
  for (const node of graph) assert.equal(node.url, 'https://suphian.com/', `${node['@type']}.url`);
  const ids = new Set(graph.map((node) => node['@id']));
  const refs = graph.flatMap((node) => Object.values(node).filter((value) => value?.['@id']).map((value) => value['@id']));
  assert.ok(refs.length >= 3 && refs.every((id) => ids.has(id)), 'dangling @id reference');
  assert.ok(existsSync(new URL(`../public${new URL(seo.og.image).pathname}`, import.meta.url)));
});

test('search and social text lead with who Suphian is; Steadily is his role, not the headline', () => {
  // Suphian 2026-09-27: "The Steadily thing isn't a big part of my identity. It's just my role."
  // Steadily may appear later in these strings, never first; the title never carries it.
  const summary = crawlerResources()['llms.txt'].match(/^> (.*)$/m)[1];
  assert.equal(summary, seo.home.description);
  assert.doesNotMatch(seo.home.title, /Steadily/);
  assert.doesNotMatch(seo.home.ogTitle, /Steadily/);
  for (const text of [seo.home.description, hero.srTitle, summary]) {
    assert.ok(text.includes('YouTube') && text.includes('Abacus Labs') && text.includes('suph.app'), text);
    if (text.includes('Steadily')) assert.ok(text.indexOf('Steadily') > Math.max(text.indexOf('YouTube'), text.indexOf('Abacus Labs')), text);
  }
  // A full search snippet: long enough to say something, short enough not to be cut.
  assert.ok(seo.home.description.length >= 120 && seo.home.description.length <= 160, `${seo.home.description.length} chars`);
  // One date for "last changed": the sitemap and the ProfilePage agree.
  assert.match(seo.lastModified, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(crawlerResources()['sitemap.xml'].includes(`<lastmod>${seo.lastModified}</lastmod>`));
  assert.equal(schemaGraph()['@graph'][2].dateModified, seo.lastModified);
});

test('published crawler resources stay synchronized with approved copy', () => {
  const resources = crawlerResources();
  for (const [name, contents] of Object.entries(resources)) {
    assert.equal(readFileSync(new URL(`../public/${name}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n'), contents, name);
    assert.doesNotMatch(contents, /suph\.tweel@gmail\.com|AI-powered|AI-driven|annually|annual music|deployed ML/i);
  }
  assert.match(resources['robots.txt'], /User-agent: OAI-SearchBot\nAllow: \//);
  assert.equal((resources['sitemap.xml'].match(/<loc>/g) ?? []).length, 1);
  for (const entry of story.chapters.flatMap(entries)) assert.ok(resources['llms-full.txt'].includes(entry.summary));
});

test('HTML and JSON-LD serialization cannot introduce markup from content', () => {
  assert.equal(escapeHtml('<script>"&\'</script>'), '&lt;script&gt;&quot;&amp;&#39;&lt;/script&gt;');
  const script = html.match(/id="structured-data-profile" type="application\/ld\+json">(.*?)<\/script>/)[1];
  assert.deepEqual(JSON.parse(script), schemaGraph());
});

test('the social card is a PNG small enough for WhatsApp and iMessage link previews', () => {
  // Square Signature protects the compact messaging thumbnail; Twitter uses its wide export.
  // These are download and metadata checks; native apps control their own card layouts.
  const file = new URL(`../public${new URL(seo.og.image).pathname}`, import.meta.url);
  assert.ok(existsSync(file), `${seo.og.image} is in public/`);
  const bytes = readFileSync(file);
  assert.deepEqual([...bytes.subarray(1, 4)].map((b) => String.fromCharCode(b)).join(''), 'PNG', 'a PNG');
  assert.ok(bytes.length < 250 * 1024, `${bytes.length} bytes, keep it under 250 KB`);
  // The og:image:width/height tags must match the file.
  assert.equal(bytes.readUInt32BE(16), seo.og.imageWidth);
  assert.equal(bytes.readUInt32BE(20), seo.og.imageHeight);
  assert.equal(seo.og.imageWidth, 1200);
  assert.equal(seo.og.imageHeight, 1200);
  const twitter = readFileSync(new URL(`../public${new URL(seo.twitter.image).pathname}`, import.meta.url));
  assert.deepEqual(twitter.subarray(0, 8), bytes.subarray(0, 8), 'both cards are PNG');
  assert.equal(twitter.readUInt32BE(16), 1200);
  assert.equal(twitter.readUInt32BE(20), 630);
  assert.ok(twitter.length < 250 * 1024);
  assert.notEqual(seo.twitter.image, seo.og.image);
  // Suphian 2026-09-28: LinkedIn showed the title and the site name as "Suphian Tweel" twice.
  assert.equal(seo.home.ogTitle, 'Suphian Tweel · Product, Payments & AI');
  assert.equal(seo.og.siteName, 'suphian.com');
  assert.notEqual(seo.home.ogTitle, seo.og.siteName, 'the card never repeats one line');
  assert.equal(seo.home.ogDescription, 'Currently at Steadily. Led payments at YouTube. Founder of Abacus Labs.');
  assert.ok(seo.home.ogDescription.length <= 100, 'short enough for LinkedIn and WhatsApp cards');
  for (const tag of ['og:description', 'twitter:description']) {
    assert.ok(html.includes(`="${tag}" content="${escapeHtml(seo.home.ogDescription)}"`));
  }
  assert.equal((html.match(/property="og:image" /g) ?? []).length, 1, 'one unambiguous primary image');
  assert.ok(html.includes(`<meta name="twitter:image" content="${seo.twitter.image}"`));
  assert.match(html, /<meta property="og:image:type" content="image\/png"/);
  assert.match(html, new RegExp(`<meta property="og:image:width" content="${seo.og.imageWidth}"`));
});

test('the rendered full wordmark survives square thumbnails and a centered wide crop', async () => {
  // Regression for the real WhatsApp screenshot: a wide Editorial composition lost
  // both headline and logo when centered into a square. Check the artwork pixels,
  // not only declared metadata dimensions or a large-card mockup.
  const file = new URL(`../public${new URL(seo.og.image).pathname}`, import.meta.url);
  const { data, info } = await sharp(readFileSync(file)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const bounds = { left: info.width, top: info.height, right: -1, bottom: -1 };
  let redPixels = 0;
  for (let y = 0; y < info.height; y++) {
    for (let x = 0; x < info.width; x++) {
      const offset = (y * info.width + x) * info.channels;
      const [r, g, b] = data.subarray(offset, offset + 3);
      if (r > 150 && g < 100 && b < 100 && r - g > 80) {
        redPixels++;
        bounds.left = Math.min(bounds.left, x);
        bounds.right = Math.max(bounds.right, x);
        bounds.top = Math.min(bounds.top, y);
        bounds.bottom = Math.max(bounds.bottom, y);
      }
    }
  }
  assert.ok(redPixels > 200000, 'the full wordmark has substantial visual presence');
  assert.ok(bounds.right - bounds.left > 1000, 'the name fills the square thumbnail width');
  assert.ok(bounds.left >= 32 && bounds.right < info.width - 32, 'square crop preserves both ends');
  const wideCropTop = (info.height - 630) / 2;
  assert.ok(bounds.top >= wideCropTop + 32 && bounds.bottom < wideCropTop + 630 - 32,
    `wide crop preserves all red artwork: ${JSON.stringify(bounds)}`);
});
