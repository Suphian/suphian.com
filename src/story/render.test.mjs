import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { story } from '../content.js';
import { chapterGroups, chapterView, metaLine } from './logic.js';

// Renders the real StoryIndex and StoryCard to static HTML with react-dom/server,
// so these tests read the markup a visitor gets, without a browser. esbuild
// compiles the JSX: it is Vite's own dependency, loaded from Vite's location,
// so this adds nothing to package.json. The compiled file goes to a temporary
// folder in node_modules/.cache (the dev server never watches node_modules), so
// its `require('react')` resolves to the same React as ours.
const repo = fileURLToPath(new URL('../../', import.meta.url));
const requireFromRepo = createRequire(join(repo, 'package.json'));
const esbuild = createRequire(import.meta.resolve('vite'))('esbuild');
const React = requireFromRepo('react');
const { renderToStaticMarkup } = requireFromRepo('react-dom/server');

async function load() {
  const cacheDir = join(repo, 'node_modules', '.cache');
  mkdirSync(cacheDir, { recursive: true });
  const dir = mkdtempSync(join(cacheDir, 'story-render-'));
  try {
    const outfile = join(dir, 'story.cjs');
    await esbuild.build({
      stdin: {
        contents:
          "export { default as StoryIndex } from './StoryIndex.jsx'; export { default as StoryCard } from './StoryCard.jsx'; export { default as StoryBuilds } from './StoryBuilds.jsx';",
        resolveDir: fileURLToPath(new URL('./', import.meta.url)),
        loader: 'js',
      },
      outfile,
      bundle: true,
      platform: 'node',
      format: 'cjs',
      jsx: 'automatic',
      packages: 'external',
      loader: { '.css': 'empty' },
      logLevel: 'silent',
    });
    return requireFromRepo(outfile);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
const { StoryIndex, StoryCard, StoryBuilds } = await load();
const render = (Component, props = {}) => renderToStaticMarkup(React.createElement(Component, props));

const decode = (text) =>
  text.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
const attrs = (source) => Object.fromEntries([...source.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, k, v]) => [k, decode(v)]));
const all = (html, pattern) => [...html.matchAll(pattern)];
const text = (html, className) => all(html, new RegExp(`class="${className}"[^>]*>([^<]*)<`, 'g')).map((m) => decode(m[1]));

const html = render(StoryIndex);
// Every <ol> in the section (they never nest), with where each starts and ends.
const lists = all(html, /<ol\b([^>]*)>([\s\S]*?)<\/ol>/g).map((m) => ({
  attrs: attrs(m[1]),
  body: m[2],
  start: m.index,
  end: m.index + m[0].length,
}));
const dividers = all(html, /<div class="story-divider"([^>]*)>([\s\S]*?)<\/div>/g);

test('the chapters render as two labelled lists: "Work", then "Studio"', () => {
  assert.equal(lists.length, 2);
  assert.deepEqual(lists.map((l) => l.attrs['aria-label']), ['Work', 'Studio']);
  assert.deepEqual(lists.map((l) => l.attrs.role), ['list', 'list']);
  assert.deepEqual(text(lists[0].body, 'story-item-name'), ['Steadily', 'YouTube', 'Google', 'Huge']);
  assert.deepEqual(text(lists[1].body, 'story-item-name'), ['Abacus Labs', 'suph.app']);
});

test('the studio’s meta lines: "Founder", and suph.app’s "A new project every month" (Suphian 2026-09-28)', () => {
  assert.deepEqual(text(lists[1].body, 'story-item-meta'), ['Founder · Current', 'A new project every month']);
  // No build name, month or place on suph.app's row: "way too unnecessary".
  assert.doesNotMatch(text(lists[1].body, 'story-item-meta')[1], /Toga|August|Internet|·/);
  assert.deepEqual(text(lists[1].body, 'story-item-name'), ['Abacus Labs', 'suph.app']);
  for (const meta of text(lists[0].body, 'story-item-meta')) assert.doesNotMatch(meta, /side project/i, meta);
  // Every meta line is the chapter's own role · years.
  assert.deepEqual(text(html, 'story-item-meta'), story.chapters.map(metaLine));
});

test('the "Studio" divider renders exactly once, between the lists, and is not a chapter', () => {
  assert.equal(dividers.length, 1);
  const [divider] = dividers;
  assert.equal(decode(divider[2]).trim(), 'Studio');
  assert.ok(divider.index >= lists[0].end && divider.index + divider[0].length <= lists[1].start, 'between the two lists');
  // Not a button, not a list item, and hidden from screen readers, which hear the list's label instead.
  assert.doesNotMatch(divider[0], /<button|<li|tabindex/);
  assert.equal(attrs(divider[1])['aria-hidden'], 'true');
});

test('one continuous index: six chapter buttons, one tab stop, the first chapter active', () => {
  const buttons = all(html, /<button\b([^>]*)>([\s\S]*?)<\/button>/g).map((m) => attrs(m[1]));
  assert.equal(buttons.length, story.chapters.length);
  assert.ok(buttons.every((b) => b.class === 'story-button' && b.type === 'button'));
  assert.deepEqual(buttons.map((b) => b.tabindex), ['0', '-1', '-1', '-1', '-1', '-1']);
  assert.deepEqual(buttons.map((b) => b['aria-current'] ?? null), ['true', null, null, null, null, null]);
  // The section knows every chapter, for the scroll bands and the marker.
  assert.match(html, /<section[^>]*style="--count:6"/);
  // The active index sits on the two elements that read it, the marker and the rail
  // track, not on the stage: changed on the stage, it restyled everything inside it
  // on every band change (Suphian 2026-09-27: the scroll through the chapters was clunky).
  assert.match(html, /<div class="story-stage">/);
  assert.match(html, /<span class="story-marker" aria-hidden="true" style="--active:0;--active-group:0;--accent:#6C1D72">/);
  assert.match(html, /<div class="story-rail-track" style="--active:0">/);
});

test('the rail has one card per chapter, in list order', () => {
  const cards = all(html, /<div class="story-card[^"]*"[^>]*style="--card-color:([^"]+)"/g).map((m) => m[1]);
  const order = chapterGroups(story.chapters).flatMap((g) => g.chapters);
  assert.deepEqual(cards, order.map((c) => c.color));
});

test('every card is a sized white logo, the suph.app crown included', () => {
  const cards = all(html, /<div class="story-card[^"]*"([^>]*)>([\s\S]*?)<\/div>/g).map((m) => ({ attrs: attrs(m[1]), body: m[2] }));
  assert.equal(cards.length, story.chapters.length);
  for (const [index, card] of cards.entries()) {
    // suph.app's rail card is its newest build's: The Toga Is Dead's crown.
    const chapter = chapterView(story.chapters[index]);
    const img = attrs(/<img\b([^>]*)>/.exec(card.body)[1]);
    assert.equal(img.alt, '', `${chapter.id}: decorative`);
    assert.equal(img.src, chapter.image.src);
    if (chapter.id === 'suph-app') assert.equal(img.src, '/work/suph-app.svg');
    assert.equal(img.class, 'story-card-logo', chapter.id);
    assert.match(img.style, /^width:[\d.]+%/, `${chapter.id}: a sized logo`);
    // One treatment for every card: the retired screenshot mode left no fit flag behind.
    assert.equal(card.attrs['data-fit'], undefined, chapter.id);
  }
});

test('a card with no image sets the name in type, never a broken image', () => {
  for (const chapter of story.chapters) {
    const card = render(StoryCard, { chapter: { ...chapter, image: { src: '' } } });
    assert.match(card, new RegExp(`<span class="story-card-name">${chapter.name.replace('.', '\\.')}\\.</span>`));
    assert.doesNotMatch(card, /<img/);
  }
});

// suph.app's open card below its heading (StoryBuilds): the real content, and fixtures
// for the list's shape (nothing in the fixtures is published). StoryDetail itself is a
// portal, so the part that differs from other chapters is rendered on its own.
const build = (month, name) => ({
  month,
  slug: name.toLowerCase(),
  name,
  summary: `${name} summary.`,
  image: { src: `/work/${name.toLowerCase()}.svg`, nudge: 0 },
  links: [{ label: `See ${name}`, href: `https://example.com/${name.toLowerCase()}` }],
});
const fixture = (builds) => ({
  id: 'fixture',
  name: 'fixture.app',
  role: 'A new project every month',
  summary: 'Fixture intro.',
  links: [{ label: 'Visit fixture.app', href: 'https://example.com/' }],
  builds,
});
const card = (chapter) => render(StoryBuilds, { chapter, introId: 'intro' });
const entriesOf = (markup) =>
  all(markup, /<li class="story-build">([\s\S]*?)<\/li><\/ul><\/li>/g).map((m) => ({
    month: /<time dateTime="([^"]+)">([^<]*)<\/time>/.exec(m[1]).slice(1),
    name: text(m[1], 'story-build-name')[0],
    summary: text(m[1], 'story-build-summary')[0],
    links: all(m[1], /<a [^>]*href="([^"]+)"[^>]*><span>([^<]*)<\/span>/g).map((l) => [decode(l[2]), decode(l[1])]),
  }));
const noToggle = (markup) => {
  assert.doesNotMatch(markup, /<button|story-month|aria-live|Previous|Next/, 'no toggle');
  assert.doesNotMatch(markup, /[←→]/, 'no arrows but the links’ own ↗');
};

test('suph.app’s open card: the intro line, Visit suph.app, then every build, newest first', () => {
  const app = story.chapters.find((c) => c.id === 'suph-app');
  const markup = card(app);
  // No role line: the intro is the first thing under the heading (Suphian 2026-09-28).
  assert.match(markup, /^<p id="intro" class="story-detail-summary">A place where I put out a different project every month\.<\/p>/);
  assert.doesNotMatch(markup, /story-detail-role|story-detail-years|Internet|Playground/);
  // Then the link to suph.app itself, above the builds.
  const visit = markup.indexOf('>Visit suph.app<');
  const list = markup.indexOf('<ol class="story-builds"');
  assert.ok(visit > 0 && visit < list, 'Visit suph.app sits between the intro and the builds');
  assert.match(markup.slice(0, list), /<ul class="story-links"><li><a class="story-link" href="https:\/\/suph\.app" target="_blank" rel="noopener noreferrer">/);
  // Every build: its month, name, summary and link, newest first.
  assert.deepEqual(entriesOf(markup), [
    {
      month: ['2026-08', 'August 2026'],
      name: 'The Toga Is Dead',
      summary: app.builds[0].summary,
      links: [['Play The Toga Is Dead', 'https://suph.app/Toga']],
    },
    {
      month: ['2026-07', 'July 2026'],
      name: 'Quran Art',
      summary: app.builds[1].summary,
      links: [['See Quran Art', 'https://suph.app/Quran']],
    },
  ]);
  noToggle(markup);
});

test('with two builds both render, newest first, each with its month and links', () => {
  const markup = card(fixture([build('2026-10', 'Newer'), build('2026-09', 'Older')]));
  assert.deepEqual(entriesOf(markup), [
    { month: ['2026-10', 'October 2026'], name: 'Newer', summary: 'Newer summary.', links: [['See Newer', 'https://example.com/newer']] },
    { month: ['2026-09', 'September 2026'], name: 'Older', summary: 'Older summary.', links: [['See Older', 'https://example.com/older']] },
  ]);
  // The list is a real list, and each build's name is a heading under the chapter's h2.
  assert.match(markup, /<ol class="story-builds" role="list">/);
  assert.equal(all(markup, /<h3 class="story-build-name">/g).length, 2);
  noToggle(markup);
});

test('with one build it is a one-item list: no toggle, no arrows', () => {
  const markup = card(fixture([build('2026-10', 'Only')]));
  assert.deepEqual(entriesOf(markup).map((e) => [e.month[1], e.name]), [['October 2026', 'Only']]);
  assert.equal(all(markup, /<li class="story-build">/g).length, 1);
  noToggle(markup);
});
