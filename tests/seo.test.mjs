import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import test from 'node:test';
import { hero, site, story, seo } from '../src/content.js';
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
  for (const chapter of story.chapters) assert.ok(resources['llms-full.txt'].includes(chapter.summary));
});

test('HTML and JSON-LD serialization cannot introduce markup from content', () => {
  assert.equal(escapeHtml('<script>"&\'</script>'), '&lt;script&gt;&quot;&amp;&#39;&lt;/script&gt;');
  const script = html.match(/id="structured-data-profile" type="application\/ld\+json">(.*?)<\/script>/)[1];
  assert.deepEqual(JSON.parse(script), schemaGraph());
});
