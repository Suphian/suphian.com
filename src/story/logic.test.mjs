import assert from 'node:assert/strict';
import test from 'node:test';
import {
  accentFor,
  accentOf,
  buildsOf,
  cardImage,
  chapterGroups,
  chapterView,
  clampIndex,
  distanceBucket,
  flipDelta,
  followScroll,
  formatMonth,
  groupIndexOf,
  indexFromProgress,
  isVisibleRect,
  logoShift,
  logoWidth,
  metaLine,
  panelBuild,
  stepIndex,
  toTransform,
  trackProgress,
} from './logic.js';

test('clampIndex keeps indexes inside the list', () => {
  assert.equal(clampIndex(-3, 5), 0);
  assert.equal(clampIndex(2, 5), 2);
  assert.equal(clampIndex(2.6, 5), 3);
  assert.equal(clampIndex(9, 5), 4);
  assert.equal(clampIndex(NaN, 5), 0);
  assert.equal(clampIndex(3, 0), 0);
});

test('trackProgress maps the pinned track from 0 to 1', () => {
  // Track 3000px tall in a 1000px viewport: 2000px of travel.
  assert.equal(trackProgress(400, 3000, 1000), 0); // not reached yet
  assert.equal(trackProgress(0, 3000, 1000), 0);
  assert.equal(trackProgress(-1000, 3000, 1000), 0.5);
  assert.equal(trackProgress(-2000, 3000, 1000), 1);
  assert.equal(trackProgress(-5000, 3000, 1000), 1); // scrolled past
  assert.equal(trackProgress(-100, 800, 1000), 0); // no travel
  assert.equal(trackProgress(NaN, 3000, 1000), 0);
});

test('indexFromProgress splits progress into equal, finite bands', () => {
  assert.equal(indexFromProgress(0, 5), 0);
  assert.equal(indexFromProgress(0.199, 5), 0);
  assert.equal(indexFromProgress(0.2, 5), 1);
  assert.equal(indexFromProgress(0.5, 5), 2);
  assert.equal(indexFromProgress(0.99, 5), 4);
  assert.equal(indexFromProgress(1, 5), 4); // the end stays on the last item, no wrap
  assert.equal(indexFromProgress(1.4, 5), 4);
  assert.equal(indexFromProgress(-0.2, 5), 0);
  assert.equal(indexFromProgress(NaN, 5), 0);
  assert.equal(indexFromProgress(0.5, 0), 0);
});

// Suphian 2026-09-27: scroll alone picks the chapter; hover no longer does, and
// the only other pick is the keyboard's (arrow keys, keyboard focus).
test('followScroll only overrides a keyboard pick when the band changes', () => {
  assert.equal(followScroll(1, 1, 3), 3); // same band: keep the pick
  assert.equal(followScroll(1, 2, 3), 2); // new band: scroll wins
  assert.equal(followScroll(-1, 0, 0), 0); // first measurement
});

test('stepIndex steps with arrows, jumps with Home/End, stops at the ends', () => {
  assert.equal(stepIndex(0, 'ArrowDown', 5), 1);
  assert.equal(stepIndex(4, 'ArrowDown', 5), 4);
  assert.equal(stepIndex(2, 'ArrowUp', 5), 1);
  assert.equal(stepIndex(0, 'ArrowUp', 5), 0);
  assert.equal(stepIndex(2, 'ArrowRight', 5), 3);
  assert.equal(stepIndex(2, 'ArrowLeft', 5), 1);
  assert.equal(stepIndex(3, 'Home', 5), 0);
  assert.equal(stepIndex(1, 'End', 5), 4);
  assert.equal(stepIndex(1, 'Enter', 5), null);
  assert.equal(stepIndex(1, 'a', 5), null);
  assert.equal(stepIndex(0, 'ArrowDown', 0), null);
  assert.equal(stepIndex(9, 'ArrowUp', 5), 3); // out-of-range input is clamped first
});

test('distanceBucket caps at 2', () => {
  assert.deepEqual([0, 1, 2, 3, 4].map((i) => distanceBucket(i, 1)), [1, 0, 1, 2, 2]);
});

test('cardImage reads { src, nudge }, a bare path, or nothing', () => {
  assert.deepEqual(cardImage({ src: '/work/huge.svg', nudge: 0.026 }), { src: '/work/huge.svg', nudge: 0.026 });
  assert.deepEqual(cardImage('/work/abacus-white.png'), { src: '/work/abacus-white.png', nudge: 0 });
  assert.deepEqual(cardImage(undefined), { src: null, nudge: 0 });
  assert.deepEqual(cardImage({ src: '' }), { src: null, nudge: 0 });
  assert.deepEqual(cardImage({ src: '/a.svg', nudge: NaN }), { src: '/a.svg', nudge: 0 });
  assert.deepEqual(cardImage({ src: '/a.svg', nudge: 3 }), { src: '/a.svg', nudge: 0.25 }); // never flung off the card
  assert.deepEqual(cardImage({ src: '/work/suph-app.svg', nudge: 0 }), { src: '/work/suph-app.svg', nudge: 0 });
  assert.deepEqual(cardImage({ src: '/a.svg' }), { src: '/a.svg', nudge: 0 }); // no nudge stored: none applied
});

test('logoShift turns the nudge into a translate of the logo’s own height', () => {
  assert.equal(logoShift(0.026), 'translateY(2.6%)');
  assert.equal(logoShift(0.018), 'translateY(1.8%)');
  assert.equal(logoShift(0.112), 'translateY(11.2%)');
  assert.equal(logoShift(-0.05), 'translateY(-5%)');
  assert.equal(logoShift(0), undefined);
  assert.equal(logoShift(0.0001), undefined);
  assert.equal(logoShift(NaN), undefined);
});

test('metaLine joins role and period, skipping an empty part', () => {
  assert.equal(metaLine({ role: 'Senior Product Manager', period: '2020 – 2026' }), 'Senior Product Manager · 2020 – 2026');
  assert.equal(metaLine({ role: 'Founder', period: 'Current' }), 'Founder · Current');
  assert.equal(metaLine({ role: 'Role' }), 'Role');
  // No role (suph.app): just the years, with no stray separator.
  assert.equal(metaLine({ period: 'Current' }), 'Current');
  assert.equal(metaLine({ role: '', period: 'Current' }), 'Current');
});

// A made-up chapter of builds, shaped like suph.app (no role): fixtures only, nothing here is published.
const WITH_BUILDS = {
  id: 'fixture',
  name: 'fixture.app',
  period: 'Current',
  location: 'Internet',
  color: '#AC8243',
  accent: '#AAB8A7',
  builds: [
    { month: '2026-10', slug: 'newer', name: 'Newer', summary: 'Newer summary.', image: { src: '/work/newer.svg', nudge: 0 }, color: '#123456', links: [{ label: 'Newer', href: 'https://example.com/newer' }] },
    { month: '2026-08', slug: 'older', name: 'Older', summary: 'Older summary.', image: { src: '/work/older.svg', nudge: 0.01 }, links: [{ label: 'Older', href: 'https://example.com/older' }] },
  ],
};

test('formatMonth writes a build’s month out in full: "September 2026"', () => {
  assert.equal(formatMonth('2026-09'), 'September 2026');
  assert.equal(formatMonth('2025-07'), 'July 2025');
  assert.equal(formatMonth('2027-01'), 'January 2027');
  assert.equal(formatMonth('2026-12'), 'December 2026');
  // Never abbreviated, and the same names Intl uses for en-US.
  for (let m = 1; m <= 12; m++) {
    const month = `2026-${String(m).padStart(2, '0')}`;
    const expected = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(Date.UTC(2026, m - 1, 1));
    assert.equal(formatMonth(month), expected, month);
  }
  for (const bad of ['2026-9', '2026-13', '2026-00', 'September 2026', '2026-09-01', '', null, undefined]) assert.equal(formatMonth(bad), '', String(bad));
});

test('buildsOf: a chapter’s builds, or none', () => {
  assert.deepEqual(buildsOf({ id: 'job' }), []);
  assert.deepEqual(buildsOf(null), []);
  assert.equal(buildsOf(WITH_BUILDS), WITH_BUILDS.builds);
});

test('chapterView wears one build’s image and color: the newest unless asked', () => {
  const newest = chapterView(WITH_BUILDS);
  assert.equal(newest.id, 'fixture');
  assert.equal(newest.name, 'fixture.app', 'the chapter keeps its own name');
  assert.equal(newest.period, 'Current', 'and its own years');
  assert.equal(newest.accent, '#AAB8A7', 'and its accent');
  assert.deepEqual(newest.image, { src: '/work/newer.svg', nudge: 0 });
  assert.equal(newest.color, '#123456', 'a build’s own color wins');
  const older = chapterView(WITH_BUILDS, 1);
  assert.deepEqual(older.image, { src: '/work/older.svg', nudge: 0.01 });
  assert.equal(older.color, '#AC8243', 'otherwise the chapter’s color');
  // Out-of-range indexes stop at the ends.
  assert.equal(chapterView(WITH_BUILDS, 9).image.src, '/work/older.svg');
  assert.equal(chapterView(WITH_BUILDS, -1).image.src, '/work/newer.svg');
  // A chapter without builds comes back as it is.
  const job = { id: 'job', role: 'Role', period: 'Years', image: { src: '/work/job.svg', nudge: 0 }, summary: 'S', links: [] };
  assert.equal(chapterView(job), job);
});

test('metaLine: a chapter of builds reads like any other, never a build or its month', () => {
  // Suphian 2026-09-28: suph.app takes Abacus Labs' format ("founder, current, internet"), without a title.
  assert.equal(metaLine(WITH_BUILDS), 'Current');
  assert.equal(metaLine({ ...WITH_BUILDS, role: 'Maker' }), 'Maker · Current');
  assert.doesNotMatch(metaLine(WITH_BUILDS), /Newer|October|Internet/);
});

test('accentOf: a chapter’s own accent, else its color’s (accentFor)', () => {
  // suph.app: the forest green fill is too dark as a mark on the page, so its accent is the pale sage.
  assert.equal(accentOf({ color: '#243F39', accent: '#AAB8A7' }), '#AAB8A7');
  // Without one, the color's own accent: the color itself, or white when too dark to see.
  assert.equal(accentOf({ color: '#FF0000' }), '#FF0000');
  assert.equal(accentOf({ color: '#000000' }), '#FFFFFF');
  assert.equal(accentOf({ color: '#243F39' }), accentFor('#243F39'));
  assert.equal(accentOf({}), '#FFFFFF');
  assert.equal(accentOf(undefined), '#FFFFFF');
  // chapterView keeps the chapter's accent, whatever build it shows.
  assert.equal(accentOf(chapterView(WITH_BUILDS, 1)), '#AAB8A7');
  assert.equal(accentOf(chapterView({ ...WITH_BUILDS, accent: undefined }, 1)), '#AC8243');
});

test('panelBuild: a mouse or keyboard focus picks the build in the panel; a finger never does', () => {
  const mouse = { pointerType: 'mouse', finePointer: true };
  // A mouse resting on a build shows it; leaving the list goes back to the newest.
  assert.equal(panelBuild(0, { type: 'enter', index: 1, ...mouse }), 1);
  assert.equal(panelBuild(1, { type: 'enter', index: 0, ...mouse }), 0);
  assert.equal(panelBuild(1, { type: 'leave', ...mouse }), 0);
  // Touch: the panel stays on the newest, whatever the finger does.
  assert.equal(panelBuild(0, { type: 'enter', index: 1, pointerType: 'touch', finePointer: true }), 0);
  assert.equal(panelBuild(0, { type: 'enter', index: 1, pointerType: 'pen', finePointer: false }), 0);
  // A mouse on a screen without fine hover (a tablet's emulated pointer) doesn't count either.
  assert.equal(panelBuild(0, { type: 'enter', index: 1, pointerType: 'mouse', finePointer: false }), 0);
  assert.equal(panelBuild(1, { type: 'leave', pointerType: 'touch', finePointer: false }), 1);
  // Keyboard focus inside a build shows it; the focus a tap or click leaves doesn't.
  assert.equal(panelBuild(0, { type: 'focus', index: 1, keyboard: true }), 1);
  assert.equal(panelBuild(0, { type: 'focus', index: 1, keyboard: false }), 0);
  // Focus moving within the list keeps the build; leaving the list goes back to the newest.
  assert.equal(panelBuild(1, { type: 'blur', inside: true }), 1);
  assert.equal(panelBuild(1, { type: 'blur', inside: false }), 0);
  // Anything else, or a malformed event, changes nothing.
  for (const odd of [undefined, null, {}, { type: 'click', index: 1 }, { type: 'enter', ...mouse }, { type: 'focus', keyboard: true }]) {
    assert.equal(panelBuild(1, odd), 1, JSON.stringify(odd));
  }
});

test('chapterGroups: jobs first, then side projects, one continuous index', () => {
  const job = (id) => ({ id });
  const side = (id) => ({ id, kind: 'side' });
  const ids = (groups) => groups.map((g) => [g.kind, g.label, g.start, g.chapters.map((c) => c.id)]);
  const labels = { work: 'Work', side: 'Side projects' };
  assert.deepEqual(ids(chapterGroups([job('a'), job('b'), side('x'), side('y')], labels)), [
    ['work', 'Work', 0, ['a', 'b']],
    ['side', 'Side projects', 2, ['x', 'y']],
  ]);
  // Each list keeps its content order, even when the two are interleaved.
  assert.deepEqual(ids(chapterGroups([side('x'), job('a'), side('y'), job('b')], labels)), [
    ['work', 'Work', 0, ['a', 'b']],
    ['side', 'Side projects', 2, ['x', 'y']],
  ]);
  // An empty list is dropped, so there is never a divider with nothing under it.
  assert.deepEqual(ids(chapterGroups([job('a')], labels)), [['work', 'Work', 0, ['a']]]);
  assert.deepEqual(ids(chapterGroups([side('x')], labels)), [['side', 'Side projects', 0, ['x']]]);
  assert.deepEqual(chapterGroups([]), []);
  assert.deepEqual(chapterGroups(undefined), []);
});

test('groupIndexOf counts the dividers above an index', () => {
  const groups = chapterGroups([{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'x', kind: 'side' }]);
  assert.deepEqual([0, 1, 2, 3].map((i) => groupIndexOf(groups, i)), [0, 0, 0, 1]);
  assert.equal(groupIndexOf(chapterGroups([{ id: 'a' }]), 0), 0);
  assert.equal(groupIndexOf([], 0), 0);
});

test('flipDelta inverts a move and a resize', () => {
  const first = { left: 100, top: 400, width: 200, height: 40 };
  const last = { left: 40, top: 120, width: 800, height: 160 };
  assert.deepEqual(flipDelta(first, last), { x: 60, y: 280, sx: 0.25, sy: 0.25 });
  assert.deepEqual(flipDelta(first, last, { scale: 0.3 }), { x: 60, y: 280, sx: 0.3, sy: 0.3 });
  assert.deepEqual(flipDelta(first, { left: 0, top: 0, width: 0, height: 0 }), { x: 100, y: 400, sx: 1, sy: 1 });
  assert.equal(toTransform({ x: 1, y: 2, sx: 0.5, sy: 0.25 }), 'translate(1px, 2px) scale(0.5, 0.25)');
});

test('isVisibleRect needs size and an overlap with the viewport', () => {
  const rect = (top, height = 100) => ({ top, bottom: top + height, left: 10, right: 110, width: 100, height });
  assert.equal(isVisibleRect(rect(100), 1200, 800), true);
  assert.equal(isVisibleRect(rect(900), 1200, 800), false);
  assert.equal(isVisibleRect(rect(-200), 1200, 800), false);
  assert.equal(isVisibleRect(rect(100, 0), 1200, 800), false);
  assert.equal(isVisibleRect(null, 1200, 800), false);
});

test('logoWidth keeps logo area constant across aspect ratios', () => {
  // Width grows with the square root of the aspect: a mark 4x as wide is 2x the width.
  assert.equal(logoWidth(1), 24);
  assert.equal(logoWidth(4), 48);
  const huge = logoWidth(98.42 / 41.6);
  const youtube = logoWidth(89.58 / 20);
  assert.ok(huge > 30 && huge < 45, String(huge));
  assert.ok(youtube > huge, 'wider marks get wider');
  // suph.app's crown (76 x 59) is compact: narrower than the wordmarks, the same visual area.
  const crown = logoWidth(76 / 59);
  assert.ok(crown > 24 && crown < huge, String(crown));
  // Visual area (width * height, height = width / aspect) is equal inside the clamp.
  const area = (a) => logoWidth(a) ** 2 / a;
  assert.ok(Math.abs(area(2) - area(4)) / area(4) < 0.01);
  // Clamped at both ends; unknown aspects get a middle size.
  assert.equal(logoWidth(20), 68);
  assert.equal(logoWidth(0.1), 18);
  for (const bad of [0, -1, NaN, Infinity, null, undefined]) assert.equal(logoWidth(bad), 40);
});

test('accentFor: company colors tint the marks; black falls back to white', async () => {
  const { accentFor } = await import('./logic.js');
  assert.equal(accentFor('#FF0000'), '#FF0000');
  assert.equal(accentFor('#6C1D72'), '#6C1D72');
  assert.equal(accentFor('#000000'), '#FFFFFF');
  assert.equal(accentFor(undefined), '#FFFFFF');
  assert.equal(accentFor('not a color', '#fb2726'), '#fb2726');
});
