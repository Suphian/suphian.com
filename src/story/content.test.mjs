import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
import * as content from '../content.js';
import { chapterGroups, groupIndexOf, metaLine, stepIndex } from './logic.js';

const { story, nav, hero } = content;
const publicDir = new URL('../../public/', import.meta.url);
const strings = (value) =>
  typeof value === 'string'
    ? [value]
    : value && typeof value === 'object'
      ? Object.values(value).flatMap(strings)
      : [];
const chapter = (id) => story.chapters.find((c) => c.id === id);
const JOBS = ['steadily', 'youtube', 'google', 'huge'];
const SIDE = ['abacus', 'suph-app'];

test('jobs run newest to oldest, then the side projects: Steadily → YouTube → Google → Huge → Abacus Labs → suph.app', () => {
  assert.deepEqual(story.chapters.map((c) => c.id), ['steadily', 'youtube', 'google', 'huge', 'abacus', 'suph-app']);
  assert.equal(new Set(story.chapters.map((c) => c.id)).size, story.chapters.length);
});

test('each chapter is only role, years, summary and links (plus its card, and the side-project flag)', () => {
  for (const c of story.chapters) {
    const optional = ['kind'].filter((key) => key in c);
    assert.deepEqual(
      Object.keys(c).sort(),
      ['color', 'id', 'image', 'links', 'name', 'period', 'role', 'summary', ...optional].sort(),
      `${c.id} has extra or missing fields`,
    );
    // The flag takes one value: a side project.
    if ('kind' in c) assert.equal(c.kind, 'side', `${c.id}.kind`);
    // The card wears the company's color (Suphian's pick), as a hex the white logo sits on.
    assert.match(c.color, /^#[0-9A-F]{6}$/i, `${c.id} needs a company color`);
    // Every card is a logo, and the logo and its optical nudge travel together
    // (logo-geometry.test.mjs checks the values).
    assert.deepEqual(Object.keys(c.image).sort(), ['nudge', 'src'], `${c.id}.image`);
    assert.ok(Number.isFinite(c.image.nudge) && Math.abs(c.image.nudge) <= 0.2, `${c.id}.image.nudge`);
    for (const key of ['name', 'role', 'period', 'summary']) assert.ok(c[key], `${c.id}.${key}`);
    assert.ok(c.links.length > 0, `${c.id} links`);
  }
});

test('no rules, receipts or placeholders anywhere in the story', () => {
  for (const text of strings(story)) {
    assert.ok(!/NEEDS SUPHIAN|TODO|lorem/i.test(text), text);
    assert.ok(!/\b(rule|receipt)s?\b/i.test(text), text);
    assert.ok(!/where the money moves/i.test(text), text);
  }
});

test('the headline and intro are Suphian’s own words, exactly', () => {
  assert.equal(`${story.heading.join(' ')}.`, 'Good ideas deserve to get made.');
  assert.equal(
    story.intro,
    'I’m Suphian. I work in product and like turning ideas into things people can try, use, or enjoy. I care about how they work, how they look, and what happens when they meet the real world. In my free time I build cool stuff with Abacus Labs.',
  );
});

test('the old site’s descriptions, in his wording', () => {
  assert.equal(
    chapter('google').summary,
    'Served as an in-house analytics advisor for CapitalG portfolio companies and high-growth D2C brands. Led incrementality testing and optimization strategies to improve marketing efficiency and scale growth across platforms like Duolingo and Chewy.com.',
  );
  assert.equal(
    chapter('huge').summary,
    'Specialized in site redesigns, A/B testing, and multivariate testing for high-impact brands. Helped improve UX and conversion for companies like Hulu, Apple and AMC Theaters.',
  );
  assert.equal(
    chapter('abacus').summary,
    'Abacus turns spreadsheet chaos into a real-time command center for MCA operators — deals, underwriting, collections, syndication, and compliance in one place. I lead product and engineering.',
  );
  // The old YouTube paragraph with "AI-powered" removed and nothing else changed.
  assert.equal(
    chapter('youtube').summary,
    'Led execution of a payment system for high-profile launches including YouTube Shorts and YouTube Premium Lite. Managed over $6 billion in music payments, optimized global operations, and ensured compliance with regulatory and contractual obligations. Also led a major fraud detection initiative that surfaced and mitigated a royalty scam covered by Billboard.',
  );
});

test('roles and years match the facts', () => {
  const facts = {
    steadily: ['Principal Product Manager', '2026 – Present'],
    youtube: ['Senior Product Manager', '2020 – 2026'],
    google: ['Principal Analytical Lead', '2018 – 2020'],
    huge: ['Senior Product Analyst', '2014 – 2018'],
    abacus: ['Side project', 'Current'],
    'suph-app': ['Side project', 'New build every month'],
  };
  for (const [id, [role, period]] of Object.entries(facts)) {
    assert.equal(chapter(id).role, role, id);
    assert.equal(chapter(id).period, period, id);
  }
  // A side project's line must not read as a job title.
  for (const id of SIDE) assert.doesNotMatch(chapter(id).role, /manager|lead|head|founder|ceo|cto/i, id);
});

test('side projects are marked as side projects, not jobs (Suphian)', () => {
  // The flag: exactly Abacus Labs and suph.app; the four jobs carry none.
  assert.deepEqual(story.chapters.filter((c) => c.kind === 'side').map((c) => c.id), SIDE);
  for (const id of JOBS) assert.equal(chapter(id).kind, undefined, id);
  // The meta line beside each name, and the role line of the open view.
  assert.equal(metaLine(chapter('abacus')), 'Side project · Current');
  assert.equal(metaLine(chapter('suph-app')), 'Side project · New build every month');
  // The second list's label and its divider: sentence case, not a tiny uppercase label.
  assert.equal(story.labels.sideProjects, 'Side projects');
  assert.equal(story.labels.list, 'Work');
});

test('the list is two labelled lists with one continuous index', () => {
  const groups = chapterGroups(story.chapters, { work: story.labels.list, side: story.labels.sideProjects });
  assert.deepEqual(
    groups.map((g) => [g.label, g.start, g.chapters.map((c) => c.id)]),
    [
      ['Work', 0, JOBS],
      ['Side projects', 4, SIDE],
    ],
  );
  // The order on screen is the content order: the side projects are already last.
  assert.deepEqual(groups.flatMap((g) => g.chapters), story.chapters);
  assert.deepEqual(story.chapters.map((_, i) => groupIndexOf(groups, i)), [0, 0, 0, 0, 1, 1]);
});

test('keyboard stepping crosses the divider: Huge ↓ Abacus Labs, Abacus Labs ↑ Huge', () => {
  const order = chapterGroups(story.chapters).flatMap((g) => g.chapters.map((c) => c.id));
  const count = order.length;
  const huge = order.indexOf('huge');
  const abacus = order.indexOf('abacus');
  assert.equal(order[stepIndex(huge, 'ArrowDown', count)], 'abacus');
  assert.equal(order[stepIndex(abacus, 'ArrowUp', count)], 'huge');
  // And it runs end to end across both lists.
  assert.equal(order[stepIndex(0, 'End', count)], 'suph-app');
  assert.equal(order[stepIndex(count - 1, 'Home', count)], 'steadily');
});

test('suph.app: Suphian’s monthly build, with his facts only', () => {
  const app = chapter('suph-app');
  assert.equal(app.name, 'suph.app');
  // The game's crown as a white logo on the crown's deep gold, like every other card
  // (Suphian: "just put the crown logo"), not a screenshot.
  assert.equal(app.color, '#AC8243');
  assert.deepEqual(app.image, { src: '/work/suph-app.svg', nudge: 0 });
  assert.equal(
    app.summary,
    'Every month I make something. This month it’s The Toga Is Dead, a 3D board game you play in the browser: 2–4 players, with solo practice, same-screen play and online invitations, set in a medieval coastal kingdom or the Roman empire.',
  );
  assert.deepEqual(app.links, [{ label: 'Play The Toga Is Dead', href: 'https://suph.app' }]);
});

test('AI is never tied to YouTube', () => {
  for (const text of strings(chapter('youtube'))) {
    if (text.startsWith('https://')) continue;
    assert.doesNotMatch(text, /\bAI\b|AI-|machine (learning|translation)|\bML\b/i, text);
  }
  // Nor through a link: the old site's machine-translation research post is out.
  assert.deepEqual(
    chapter('youtube').links.map((link) => new URL(link.href).hostname),
    ['blog.youtube', 'blog.youtube', 'www.billboard.com', 'blog.youtube'],
  );
  for (const text of strings({ site: content.site, seo: content.seo, structuredData: content.structuredData, hero })) {
    assert.doesNotMatch(text, /AI-(powered|driven)|payments and AI|AI (at|to solve|initiatives)/i, text);
  }
  assert.equal(content.structuredData.faq, undefined, 'no invisible FAQ markup');
});

test('the podcast is gone from content.js', () => {
  assert.equal(content.podcast, undefined);
  assert.equal(content.seo.podcast, undefined);
  for (const text of strings(content)) assert.doesNotMatch(text, /podcast|GenAI_Solves/i, text);
});

test('Abacus links to abacuslabs.co only', () => {
  assert.deepEqual(chapter('abacus').links.map((l) => l.href), ['https://abacuslabs.co']);
});

test('links are absolute https with labels', () => {
  for (const c of story.chapters) {
    for (const link of c.links) {
      assert.ok(link.label, `${c.id} link label`);
      assert.match(link.href, /^https:\/\//, link.href);
    }
  }
});

test('every card image exists in public/', () => {
  for (const c of story.chapters) {
    assert.match(c.image.src, /^\/work\/[\w-]+\.(svg|png|webp|jpe?g)$/, c.image.src);
    assert.ok(existsSync(new URL(c.image.src.slice(1), publicDir)), `${c.image.src} is missing`);
  }
});

test('the story offers no resume or CV action, and no podcast', () => {
  assert.equal(story.ctas, undefined);
  for (const text of strings(story)) assert.doesNotMatch(text, /resume|\bCV\b|podcast/i, text);
});

test('nav and the hero cue point at the index', () => {
  assert.ok(nav.links.some((link) => link.id === story.id));
  assert.equal(hero.cueHref, `#${story.id}`);
});

test('the retired sections are gone from content.js', () => {
  for (const key of ['about', 'work', 'projects', 'podcast']) assert.equal(content[key], undefined, key);
  for (const key of ['index', 'kicker', 'intro', 'heading', 'label']) assert.equal(content.contact[key], undefined, `contact.${key}`);
  // Nothing reads these any more: the 404's legacy logo video and the old scroll-progress label.
  assert.equal(content.notFound, undefined);
  assert.equal(content.common.scrollProgress, undefined);
});
