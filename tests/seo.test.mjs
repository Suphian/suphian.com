import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';
import { site, story, seo } from '../src/content.js';
import { crawlerResources, escapeHtml, renderSeoHtml, schemaGraph } from '../scripts/seo.mjs';

const template = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const html = renderSeoHtml(template);

test('initial HTML contains the approved work content and contact without requiring JavaScript', () => {
  assert.ok(html.includes(escapeHtml(story.intro)));
  for (const chapter of story.chapters) {
    assert.ok(html.includes(escapeHtml(chapter.summary)), `${chapter.id}: initial HTML summary`);
    for (const link of chapter.links) assert.ok(html.includes(`href="${escapeHtml(link.href)}"`));
  }
  assert.ok(html.includes(`href="mailto:${site.email}"`));
  assert.doesNotMatch(html, /<!-- seo:|JavaScript required|suph\.tweel@gmail\.com/);
});

test('metadata has one stable canonical, honest entity schema and the current social card', () => {
  assert.equal((html.match(/rel="canonical"/g) ?? []).length, 1);
  assert.ok(html.includes('<link rel="canonical" href="https://suphian.com/" />'));
  assert.ok(html.includes(`<title>${escapeHtml(seo.home.title)}</title>`));
  assert.doesNotMatch(html, /ai:allow|ai:index|FAQPage|og-image|noindex/);
  const graph = schemaGraph()['@graph'];
  assert.deepEqual(graph.map((node) => node['@type']), ['Person', 'WebSite', 'ProfilePage']);
  assert.equal(graph[0].worksFor.name, 'Steadily');
  assert.equal(graph[0].email, site.email);
  assert.equal(graph[2].mainEntity['@id'], graph[0]['@id']);
  assert.ok(existsSync(new URL(`../public${new URL(seo.og.image).pathname}`, import.meta.url)));
});

test('published crawler resources stay synchronized with approved copy', () => {
  const resources = crawlerResources();
  for (const [name, contents] of Object.entries(resources)) {
    assert.equal(readFileSync(new URL(`../public/${name}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n'), contents, name);
    assert.doesNotMatch(contents, /suph\.tweel@gmail\.com|AI-powered|AI-driven|annually|annual music|deployed ML/i);
  }
  assert.match(resources['robots.txt'], /User-agent: OAI-SearchBot\nAllow: \//);
  assert.equal((resources['sitemap.xml'].match(/<loc>/g) ?? []).length, 1);
  for (const chapter of story.chapters) assert.ok(resources['llms-full.txt'].includes(chapter.summary));
});

test('HTML and JSON-LD serialization cannot introduce markup from content', () => {
  assert.equal(escapeHtml('<script>"&\'</script>'), '&lt;script&gt;&quot;&amp;&#39;&lt;/script&gt;');
  const script = html.match(/id="structured-data-profile" type="application\/ld\+json">(.*?)<\/script>/)[1];
  assert.deepEqual(JSON.parse(script), schemaGraph());
});
