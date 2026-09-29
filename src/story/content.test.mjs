import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import test from 'node:test';
import * as content from '../content.js';
import { buildsOf, chapterGroups, formatMonth, groupIndexOf, metaLine, stepIndex } from './logic.js';

const { story, hero } = content;
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
// Everything that carries a card image: a chapter, or each of its builds.
const cards = (c) => (buildsOf(c).length ? buildsOf(c).map((build) => ({ ...build, id: `${c.id}/${build.slug}` })) : [c]);
// Everything that carries a summary and links: every chapter, and each of its builds.
const entries = (c) => [c, ...buildsOf(c).map((build) => ({ ...build, id: `${c.id}/${build.slug}` }))];

test('jobs run newest to oldest, then the side projects: Steadily → YouTube → Google → Huge → Abacus Labs → suph.app', () => {
  assert.deepEqual(story.chapters.map((c) => c.id), ['steadily', 'youtube', 'google', 'huge', 'abacus', 'suph-app']);
  assert.equal(new Set(story.chapters.map((c) => c.id)).size, story.chapters.length);
});

test('each chapter is only role, years, place, summary and links (plus its card, and the side-project flag)', () => {
  for (const c of story.chapters) {
    // Optional: the side-project flag, an accent for a card color too dark to see as a mark,
    // and the role (suph.app has none: "Maybe I don't need a title on it", Suphian 2026-09-28).
    const optional = ['kind', 'accent', 'role'].filter((key) => key in c);
    // A chapter of builds (suph.app) carries them in place of its own card.
    const own = 'builds' in c ? ['builds'] : ['image'];
    assert.deepEqual(
      Object.keys(c).sort(),
      ['color', 'id', 'links', 'location', 'name', 'period', 'summary', ...own, ...optional].sort(),
      `${c.id} has extra or missing fields`,
    );
    // The flag takes one value: a side project.
    if ('kind' in c) assert.equal(c.kind, 'side', `${c.id}.kind`);
    // The card wears the company's color (Suphian's pick), as a hex the white logo sits on.
    assert.match(c.color, /^#[0-9A-F]{6}$/i, `${c.id} needs a company color`);
    if ('accent' in c) assert.match(c.accent, /^#[0-9A-F]{6}$/i, `${c.id}.accent`);
    for (const key of ['name', 'period']) assert.ok(c[key], `${c.id}.${key}`);
    // Every chapter but suph.app has a role line.
    if (c.id !== 'suph-app') assert.ok(c.role, `${c.id}.role`);
    for (const e of cards(c)) {
      // Every card is a logo, and the logo and its optical nudge travel together
      // (logo-geometry.test.mjs checks the values).
      assert.deepEqual(Object.keys(e.image).sort(), ['nudge', 'src'], `${e.id}.image`);
      assert.ok(Number.isFinite(e.image.nudge) && Math.abs(e.image.nudge) <= 0.2, `${e.id}.image.nudge`);
    }
    for (const e of entries(c)) {
      assert.ok(e.summary, `${e.id}.summary`);
      assert.ok(e.links.length > 0, `${e.id} links`);
    }
  }
});

test('suph.app’s builds: newest first, one per month, each with its own slug, name, card and links', () => {
  const builds = chapter('suph-app').builds;
  // Suphian 2026-09-28: The Toga Is Dead "from last month", Quran Art "from the previous month".
  assert.deepEqual(builds.map((b) => [b.month, b.slug, b.name]), [
    ['2026-08', 'toga', 'The Toga Is Dead'],
    ['2026-07', 'quran', 'Quran Art'],
  ]);
  for (const build of builds) {
    const optional = ['color'].filter((key) => key in build);
    assert.deepEqual(Object.keys(build).sort(), ['image', 'links', 'month', 'name', 'slug', 'summary', ...optional].sort(), build.month);
    assert.match(build.month, /^\d{4}-(0[1-9]|1[0-2])$/, `${build.name}: month is YYYY-MM`);
    assert.ok(formatMonth(build.month), build.month);
    // One path per build is the plan (suph.app/<slug>): short, lowercase, URL-safe.
    assert.match(build.slug, /^[a-z0-9]+(-[a-z0-9]+)*$/, `${build.name}: slug`);
    if ('color' in build) assert.match(build.color, /^#[0-9A-F]{6}$/i, `${build.name}.color`);
  }
  // Newest first, and never two builds in one month or on one slug.
  const months = builds.map((b) => b.month);
  assert.deepEqual(months, [...months].sort().reverse(), 'newest first');
  assert.equal(new Set(months).size, months.length, 'one build per month');
  assert.equal(new Set(builds.map((b) => b.slug)).size, builds.length, 'unique slugs');
  // Only suph.app is made of builds.
  assert.deepEqual(story.chapters.filter((c) => 'builds' in c).map((c) => c.id), ['suph-app']);
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
    'I’m Suphian. I work in product and like turning ideas into things people can try, use, or enjoy. I care about how they work, how they look, and what happens when they meet the real world. I also founded Abacus Labs, and suph.app is where I play with new ideas.',
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
    'Abacus turns spreadsheet chaos into a real-time command center for MCA operators — deals, underwriting, collections, syndication, and compliance in one place. I founded it, built it, and run it for paying customers.',
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
    abacus: ['Founder', 'Current'],
    // Abacus Labs' format, without a title (Suphian 2026-09-28: "Maybe I don't need a title on it").
    'suph-app': [undefined, 'Current'],
  };
  for (const [id, [role, period]] of Object.entries(facts)) {
    assert.equal(chapter(id).role, role, id);
    assert.equal(chapter(id).period, period, id);
  }
  assert.ok(!('role' in chapter('suph-app')), 'suph.app has no role at all, not an empty one');
  // A studio line must not read as an employee's title. "Founder" is allowed only because
  // Suphian confirmed it for Abacus Labs (2026-09-28); nothing claims CEO or CTO.
  for (const id of SIDE) assert.doesNotMatch(chapter(id).role ?? '', /manager|lead|head|ceo|cto/i, id);
  assert.equal(SIDE.filter((id) => /founder/i.test(chapter(id).role ?? '')).join(), 'abacus');
});

test('side projects are marked as side projects, not jobs (Suphian)', () => {
  // The flag: exactly Abacus Labs and suph.app; the four jobs carry none.
  assert.deepEqual(story.chapters.filter((c) => c.kind === 'side').map((c) => c.id), SIDE);
  for (const id of JOBS) assert.equal(chapter(id).kind, undefined, id);
  // The meta line beside each name, in one format (Suphian 2026-09-28: "the same format as
  // Abacus Labs"). suph.app has no role, so it reads just its years, with no stray separator.
  assert.equal(metaLine(chapter('abacus')), 'Founder · Current');
  assert.equal(metaLine(chapter('suph-app')), 'Current');
  // The second list's label and its divider: sentence case, not a tiny uppercase label.
  assert.equal(story.labels.sideProjects, 'Studio'); // Suphian 2026-09-28: not "side projects"
  assert.equal(story.labels.list, 'Work');
});

test('the list is two labelled lists with one continuous index', () => {
  const groups = chapterGroups(story.chapters, { work: story.labels.list, side: story.labels.sideProjects });
  assert.deepEqual(
    groups.map((g) => [g.label, g.start, g.chapters.map((c) => c.id)]),
    [
      ['Work', 0, JOBS],
      ['Studio', 4, SIDE],
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

test('suph.app: Suphian’s projects, with his facts only', () => {
  const app = chapter('suph-app');
  assert.equal(app.name, 'suph.app');
  // The Quran site's forest green fills the card and every project token unless a build sets
  // its own (none does); its pale sage is the accent (Suphian 2026-09-28: "maybe green, the
  // kind of forest green that the Quran website uses").
  assert.equal(app.color, '#243F39');
  assert.equal(app.accent, '#AAB8A7');
  // His paragraph, lightly tightened: the card's summary, like any chapter's.
  assert.equal(
    app.summary,
    'Small things I build to explore. When a new model or tool comes out, I like to spend a weekend with it and use it to solve a real problem. I don’t plan to support them; they’re experiments I think are worth sharing.',
  );
  // A link to suph.app for the no-JavaScript profile and llms-full.txt; the card lists the
  // projects in its place ("Just keep the projects").
  assert.deepEqual(app.links, [{ label: 'Visit suph.app', href: 'https://suph.app' }]);
  // Every build is in the card: no cap, no setting for one.
  assert.equal(content.BUILDS_IN_CARD, undefined);
  const [toga, quran] = app.builds;
  // The game's crown as a white logo, like every other card (Suphian: "just put the crown
  // logo"), not a screenshot. Facts from the game's README (dev/ceoisdead/README.md). Each
  // summary sits under its build's name, so it doesn't repeat it.
  assert.deepEqual(toga.image, { src: '/work/suph-app.svg', nudge: 0 });
  assert.equal(toga.color, undefined);
  assert.equal(
    toga.summary,
    'A 3D board game you play in the browser: 2–4 players, with solo practice, same-screen play and online invitations, set in a medieval coastal kingdom or the Roman empire.',
  );
  assert.deepEqual(toga.links, [{ label: 'Play The Toga Is Dead', href: 'https://suph.app/toga' }]);
  // Quran Art: from its README only, without the dataset attribution (it looks wrong).
  // Its star is a placeholder until Suphian supplies artwork.
  assert.deepEqual(quran.image, { src: '/work/quran-art.svg', nudge: 0 });
  assert.equal(quran.color, undefined);
  assert.equal(
    quran.summary,
    'Simple geometric artwork from how the Qur’an uses Arabic demonstratives, words like hādhā (“this”): one image per surah, gathered in a gallery.',
  );
  for (const build of app.builds) assert.ok(!build.summary.includes(build.name), `${build.slug}: the summary repeats the name`);
  assert.doesNotMatch(quran.summary, /Qatar|Oxford|corpus|dataset/i);
  assert.deepEqual(quran.links, [{ label: 'See Quran Art', href: 'https://suph.app/quran' }]);
  // suph.app went live 2026-09-28 with a page per build at suph.app/<slug> (suph.app/toga,
  // suph.app/quran): every build's first link, the one its card row opens, is exactly that page.
  for (const build of app.builds) assert.equal(build.links[0].href, `https://suph.app/${build.slug}`, build.slug);
});

test('suph.app promises no schedule: nothing says "every month" any more', () => {
  // Suphian 2026-09-28: he doesn't want to commit to a project every month. The builds keep
  // their month, which says when each was made, not when the next one is due.
  const published = strings({ site: content.site, hero, story, seo: content.seo, structuredData: content.structuredData });
  for (const text of published) assert.doesNotMatch(text, /every month|each month|monthly|new build/i, text);
  assert.match(content.seo.home.description, /Shares weekend experiments at suph\.app\.$/);
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
  for (const e of story.chapters.flatMap(entries)) {
    for (const link of e.links) {
      assert.ok(link.label, `${e.id} link label`);
      assert.match(link.href, /^https:\/\//, link.href);
    }
  }
});

test('every card image exists in public/, each build’s included', () => {
  const images = story.chapters.flatMap(cards).map((e) => e.image.src);
  assert.ok(images.includes('/work/quran-art.svg'), 'the builds are checked too');
  for (const src of images) {
    assert.match(src, /^\/work\/[\w-]+\.(svg|png|webp|jpe?g)$/, src);
    assert.ok(existsSync(new URL(src.slice(1), publicDir)), `${src} is missing`);
  }
});

test('the story offers no resume or CV action, and no podcast', () => {
  assert.equal(story.ctas, undefined);
  for (const text of strings(story)) assert.doesNotMatch(text, /resume|\bCV\b|podcast/i, text);
});

test('the hero cue points at the index', () => {
  assert.equal(hero.cueHref, `#${story.id}`);
});

test('the retired sections are gone from content.js', () => {
  for (const key of ['about', 'work', 'projects', 'podcast']) assert.equal(content[key], undefined, key);
  for (const key of ['index', 'kicker', 'intro', 'heading', 'label']) assert.equal(content.contact[key], undefined, `contact.${key}`);
  // Nothing reads these any more: the 404's legacy logo video and the old scroll-progress label.
  assert.equal(content.notFound, undefined);
  assert.equal(content.common.scrollProgress, undefined);
});

test('jobs name the city he worked in; side projects live on the internet', () => {
  // Suphian 2026-09-27: shown in the open card after the years.
  const where = Object.fromEntries(story.chapters.map((chapter) => [chapter.id, chapter.location]));
  assert.deepEqual(where, {
    steadily: 'Austin, Texas',
    youtube: 'New York City',
    google: 'Ann Arbor, Michigan',
    huge: 'DUMBO, Brooklyn',
    abacus: 'Internet',
    'suph-app': 'Internet',
  });
});
