import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { story } from '../content.js';
import { buildsOf, chapterGroups, chapterView, metaLine } from './logic.js';

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
          "export { default as StoryIndex } from './StoryIndex.jsx'; export { default as StoryCard } from './StoryCard.jsx'; export { default as StoryBuilds } from './StoryBuilds.jsx'; export { ChapterBody, ChapterName } from './StoryDetail.jsx';",
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
const { StoryIndex, StoryCard, StoryBuilds, ChapterBody, ChapterName } = await load();
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

test('the studio’s rows carry no meta line on the homepage (Suphian 2026-09-28)', () => {
  // "On the studio I don't need to say anything for Abacus Labs and suph.app": no meta
  // element at all, not an empty one; the four jobs keep theirs.
  assert.deepEqual(text(lists[1].body, 'story-item-meta'), []);
  assert.equal(text(lists[0].body, 'story-item-meta').length, 4);
  assert.deepEqual(text(lists[1].body, 'story-item-name'), ['Abacus Labs', 'suph.app']);
  for (const meta of text(lists[0].body, 'story-item-meta')) assert.doesNotMatch(meta, /side project/i, meta);
  // Every meta line is the chapter's own role · years; the studio's are absent.
  assert.deepEqual(text(html, 'story-item-meta'), story.chapters.map(metaLine).filter(Boolean));
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
    // suph.app's rail card is its newest build's: Animated Chess's pixel rook.
    const chapter = chapterView(story.chapters[index]);
    const img = attrs(/<img\b([^>]*)>/.exec(card.body)[1]);
    assert.equal(img.alt, '', `${chapter.id}: decorative`);
    assert.equal(img.src, chapter.image.src);
    if (chapter.id === 'suph-app') assert.equal(img.src, '/work/chess.svg');
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

// suph.app's open card: the real content, and fixtures for the list's shape (nothing in the
// fixtures is published). StoryDetail itself is a portal, so its text column (ChapterBody)
// and the rows (StoryBuilds) are rendered on their own.
const build = (month, name) => ({
  month,
  slug: name.toLowerCase(),
  name,
  summary: `${name} summary.`,
  image: { src: `/work/${name.toLowerCase()}.svg`, nudge: 0 },
  links: [{ label: `Open ${name}`, href: `https://example.com/${name.toLowerCase()}` }],
});
// Shaped like suph.app: no role, the years and place, a summary and its own link.
const fixture = (builds) => ({
  id: 'fixture',
  name: 'fixture.app',
  period: 'Current',
  location: 'Internet',
  color: '#243F39',
  accent: '#AAB8A7',
  summary: 'Fixture summary.',
  links: [{ label: 'Visit fixture.app', href: 'https://example.com/' }],
  builds,
});
// Five builds, newest first.
const FIVE = [build('2026-12', 'Dec'), build('2026-11', 'Nov'), build('2026-10', 'Oct'), build('2026-09', 'Sep'), build('2026-08', 'Aug')];
const rowsMarkup = (chapter) => render(StoryBuilds, { chapter });
const body = (chapter) => render(ChapterBody, { chapter, metaId: 'meta' });
// Each row: its <li>, the links inside it, and what the one link shows.
const rowsOf = (markup) =>
  all(markup, /<li class="story-build">([\s\S]*?)<\/li>/g).map((m) => {
    const anchors = all(m[1], /<a\b([^>]*)>([\s\S]*?)<\/a>/g);
    const [anchor] = anchors;
    return {
      anchors: anchors.length,
      href: attrs(anchor[1]).href,
      describedBy: attrs(anchor[1])['aria-describedby'],
      token: /<span class="story-build-token" aria-hidden="true" style="--token-color:([^"]+)"><img src="([^"]+)" alt=""/.exec(anchor[2])?.slice(1),
      name: text(anchor[2], 'story-build-name')[0],
      month: /<time class="story-build-month" dateTime="([^"]+)">([^<]*)<\/time>/.exec(anchor[2])?.slice(1),
      hidden: /<span id="([^"]+)" hidden="">([^<]*)<\/span>/.exec(m[1])?.slice(1),
    };
  });
// The rows are just the rows: one list, no toggle, no arrows but each link's own ↗.
const onlyRows = (markup) => {
  assert.match(markup, /^<ol class="story-builds" role="list">[\s\S]*<\/ol>$/);
  assert.doesNotMatch(markup, /<button|story-month-|aria-live|Previous|Next/, 'no toggle');
  assert.doesNotMatch(markup, /[←→]/, 'no arrows but the links’ own ↗');
};
const escapeText = (value) => value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

test('suph.app’s open card reads like Abacus Labs’, without a title: years, summary, then its projects in the links’ place', () => {
  const app = story.chapters.find((c) => c.id === 'suph-app');
  const markup = body(app);
  // Suphian 2026-09-28: "the same format as Abacus Labs, like founder, current, internet",
  // then "Maybe I don't need a title on it": no role line at all, not an empty one.
  assert.ok(
    markup.startsWith(`<div id="meta"><p class="story-detail-years">Current · Internet</p></div><p class="story-detail-summary">${escapeText(app.summary)}</p><ol class="story-builds" role="list">`),
    markup.slice(0, 300),
  );
  assert.doesNotMatch(markup, /story-detail-role/);
  // The projects replace the links: no "Visit suph.app" row in the card, and nothing after the list.
  assert.doesNotMatch(markup, /class="story-links"|Visit suph\.app/);
  assert.ok(markup.endsWith('</ol>'));
  assert.deepEqual(rowsOf(markup).map((r) => [r.name, r.month[1], r.href]), [
    ['Animated Chess', 'October 2026', 'https://suph.app/chess'],
    ['The Toga Is Dead', 'August 2026', 'https://suph.app/toga'],
    ['Quran Art', 'July 2026', 'https://suph.app/quran'],
  ]);
});

test('suph.app’s card title is the link to suph.app, ended by the rows’ own ↗; Abacus’s stays plain text', () => {
  const app = story.chapters.find((c) => c.id === 'suph-app');
  assert.equal(app.home, 'https://suph.app');
  const markup = render(ChapterName, { chapter: app });
  assert.match(markup, /^<a class="story-title-link" href="https:\/\/suph\.app" target="_blank" rel="noopener noreferrer" aria-label="suph\.app, opens the suph\.app homepage">/);
  // The whole "suph.app." (period included) is inside the link, then the arrow, as the rows have it.
  assert.match(markup, /<span>suph\.app<span class="story-detail-period" data-fade="true">\.<\/span><\/span>/);
  assert.match(markup, /<span class="link-arrow" aria-hidden="true">↗<\/span><\/a>$/);
  const abacus = story.chapters.find((c) => c.id === 'abacus');
  assert.equal(abacus.home, undefined);
  assert.equal(render(ChapterName, { chapter: abacus }), `${escapeText(abacus.name)}<span class="story-detail-period" data-fade="true">.</span>`);
  assert.doesNotMatch(render(ChapterName, { chapter: abacus }), /<a /);
});

test('every other chapter keeps its role line and its links, and no rows', () => {
  const youtube = story.chapters.find((c) => c.id === 'youtube');
  const markup = body(youtube);
  assert.ok(
    markup.startsWith('<div id="meta"><p class="story-detail-role">Senior Product Manager</p><p class="story-detail-years">2020 – 2026 · New York City</p></div><p class="story-detail-summary">'),
    markup.slice(0, 200),
  );
  assert.equal(all(markup, /<a class="story-link" /g).length, youtube.links.length);
  assert.doesNotMatch(markup, /story-builds|story-build-/);
  // A role is optional, never suppressed: a chapter of builds that has one shows it.
  assert.match(body({ ...fixture([build('2026-10', 'Only')]), role: 'Maker' }), /^<div id="meta"><p class="story-detail-role">Maker<\/p><p class="story-detail-years">Current · Internet<\/p><\/div>/);
});

test('suph.app’s projects: one line each, each a link to its own page, on the forest green', () => {
  const app = story.chapters.find((c) => c.id === 'suph-app');
  const markup = rowsMarkup(app);
  onlyRows(markup);
  assert.deepEqual(rowsOf(markup), [
    {
      anchors: 1,
      href: 'https://suph.app/chess',
      describedBy: 'story-build-suph-app-chess',
      token: ['#243F39', '/work/chess.svg'],
      name: 'Animated Chess',
      month: ['2026-10', 'October 2026'],
      hidden: ['story-build-suph-app-chess', app.builds[0].summary],
    },
    {
      anchors: 1,
      href: 'https://suph.app/toga',
      describedBy: 'story-build-suph-app-toga',
      token: ['#243F39', '/work/suph-app.svg'],
      name: 'The Toga Is Dead',
      month: ['2026-08', 'August 2026'],
      hidden: ['story-build-suph-app-toga', app.builds[1].summary],
    },
    {
      anchors: 1,
      href: 'https://suph.app/quran',
      describedBy: 'story-build-suph-app-quran',
      token: ['#243F39', '/work/quran-art.svg'],
      name: 'Quran Art',
      month: ['2026-07', 'July 2026'],
      hidden: ['story-build-suph-app-quran', app.builds[2].summary],
    },
  ]);
  // The projects' summaries aren't shown ("Maybe you don't need the description"): each is
  // only the hidden description of its row's link, for screen readers.
  for (const b of app.builds) {
    const escaped = escapeText(b.summary);
    assert.equal(markup.split(escaped).length - 1, 1, `${b.slug}: summary appears once`);
    assert.ok(markup.includes(`hidden="">${escaped}</span>`), `${b.slug}: summary only in the hidden description`);
  }
  assert.doesNotMatch(markup, /story-build-summary/);
});

test('with five builds all five render, newest first, each one link to its page (no cap)', () => {
  const markup = rowsMarkup(fixture(FIVE));
  assert.deepEqual(rowsOf(markup).map((r) => [r.name, r.month[1], r.href, r.anchors]), [
    ['Dec', 'December 2026', 'https://example.com/dec', 1],
    ['Nov', 'November 2026', 'https://example.com/nov', 1],
    ['Oct', 'October 2026', 'https://example.com/oct', 1],
    ['Sep', 'September 2026', 'https://example.com/sep', 1],
    ['Aug', 'August 2026', 'https://example.com/aug', 1],
  ]);
  onlyRows(markup);
});

test('with one build it is a one-row list', () => {
  const markup = rowsMarkup(fixture([build('2026-10', 'Only')]));
  assert.deepEqual(rowsOf(markup).map((r) => [r.name, r.month[1], r.anchors]), [['Only', 'October 2026', 1]]);
  onlyRows(markup);
});

// The rendered page keeps what the no-JavaScript profile said (search engines read the
// page after React has replaced the profile): every row is its chapter's /#id, with the
// summary and links under the button, hidden (React writes hidden=""; StoryRow makes it
// hidden="until-found" once mounted). Plain links: no tracking, no new-tab text, no arrow.
test('every row is its chapter’s anchor and keeps its summary and links, hidden', () => {
  const order = chapterGroups(story.chapters).flatMap((g) => g.chapters);
  const rowStarts = all(html, /<li id="([^"]+)" class="story-item"/g);
  assert.deepEqual(rowStarts.map((m) => m[1]), order.map((c) => c.id));
  for (const [i, chapter] of order.entries()) {
    assert.equal(html.split(`id="${chapter.id}"`).length - 1, 1, `${chapter.id}: one element with that id`);
    // The row runs to the next row or the end of its list, whichever comes first.
    const start = rowStarts[i].index;
    const row = html.slice(start, Math.min(rowStarts[i + 1]?.index ?? Infinity, html.indexOf('</ol>', start)));
    const detail = /<\/button><div class="story-item-detail"( hidden="")>([\s\S]*?)<\/div><\/li>$/.exec(row);
    assert.ok(detail, `${chapter.id}: the hidden detail follows the button: ${row.slice(-300)}`);
    const hrefs = [...chapter.links, ...buildsOf(chapter).flatMap((build) => build.links)];
    assert.equal(
      detail[2],
      `<p>${escapeText(chapter.summary)}</p><ul>${hrefs.map((l) => `<li><a href="${escapeText(l.href)}">${escapeText(l.label)}</a></li>`).join('')}</ul>`,
      chapter.id,
    );
    // Every link the chapter (and each of suph.app's projects) names, the Billboard story included.
    for (const link of hrefs) assert.ok(detail[2].includes(`href="${escapeText(link.href)}"`), `${chapter.id}: ${link.href}`);
  }
  assert.equal(all(html, /class="story-item-detail" hidden=""/g).length, story.chapters.length);
  assert.equal(all(html, /href="https:\/\/www\.billboard\.com\//g).length, 1);
});
