import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { story } from '../content.js';
import { accentFor, accentOf, chapterView } from './logic.js';

// WCAG relative luminance and contrast; PAGE is the story's near-black.
const PAGE = '#080808';
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5]
    .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

// Guards for the story index's type and color rules (DESIGN-BRIEF.md and Suphian's
// 2026-09-26 notes), checked against the stylesheet and components as written.
const css = readFileSync(new URL('./story.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const jsx = ['StoryIndex.jsx', 'StoryDetail.jsx', 'StoryCard.jsx', 'StoryBuilds.jsx']
  .map((name) => readFileSync(new URL(`./${name}`, import.meta.url), 'utf8'))
  .join('\n');

test('every font-family goes through the type tokens', () => {
  const families = [...css.matchAll(/font-family\s*:\s*([^;}]+)/g)].map((m) => m[1].trim());
  assert.ok(families.length > 0);
  for (const family of families) assert.match(family, /^var\(--font-(display|text|mono)\)$/, family);
  assert.doesNotMatch(jsx, /fontFamily/);
});

test('no tiny or uppercase labels: sentence case, nothing under 16px', () => {
  assert.doesNotMatch(css, /text-transform\s*:\s*uppercase/i);
  for (const [, value] of css.matchAll(/font-size\s*:\s*([^;}]+)/g)) {
    // The smallest size a declaration can produce: a px value, or a clamp()'s minimum.
    const px = /^clamp\(\s*(\d+(?:\.\d+)?)px/.exec(value) ?? /^(\d+(?:\.\d+)?)px$/.exec(value.trim());
    if (px) assert.ok(Number(px[1]) >= 16, `font-size ${value}`);
    else assert.match(value, /cqw/, `unexpected font-size ${value}`); // the card fallback scales with its card
  }
  // Two weights only: Regular and the strong token.
  for (const [, value] of css.matchAll(/font-weight\s*:\s*([^;}]+)/g)) {
    assert.match(value.trim(), /^(400|var\(--weight-strong\))$/, `font-weight ${value}`);
  }
});

test('no story mark is hard-coded red: marks take the chapter accent', () => {
  assert.doesNotMatch(css, /var\(--red\)|#fb2726|#fa2322|#ed2921/i);
  assert.doesNotMatch(jsx, /--red\b|#fb2726|#ed2921/i);
  for (const mark of ['.story-marker', '.story-back-arrow', '.story-detail-period', '.story-link .link-arrow']) {
    const rule = new RegExp(`${mark.replace(/[.]/g, '\\.')}\\s*\\{[^}]*(background|color)\\s*:\\s*var\\(--accent`);
    assert.match(css, rule, `${mark} follows --accent`);
  }
  assert.match(css, /\.story-item-arrow\s*\{[^}]*color\s*:\s*var\(--item-accent/);
});

test('each chapter’s accent is its company color, white when too dark to see, or its own', () => {
  const accents = Object.fromEntries(story.chapters.map((c) => [c.id, accentOf(chapterView(c))]));
  assert.deepEqual(accents, {
    steadily: '#6C1D72',
    youtube: '#FF0000',
    google: '#4285F4',
    huge: '#FF0090',
    abacus: '#FFFFFF',
    // The Quran site's pale sage: its forest green fill would be a 1.7:1 mark on the page.
    'suph-app': '#AAB8A7',
  });
  const suph = story.chapters.find((c) => c.id === 'suph-app');
  assert.equal(accentFor(suph.color), suph.color, 'accentFor alone would keep the dark green');
  assert.ok(contrast(suph.color, PAGE) < 2, `${contrast(suph.color, PAGE).toFixed(2)}:1`);
  assert.ok(contrast(suph.accent, PAGE) >= 3, `the sage is ${contrast(suph.accent, PAGE).toFixed(2)}:1 on the page`);
  // Both call sites use accentOf: the list's marks and the open card's.
  assert.match(jsx, /const ACCENTS = VIEWS\.map\(accentOf\);/);
  assert.match(jsx, /'--accent': accentOf\(chapterView\(chapter\)\)/);
  assert.doesNotMatch(jsx, /accentFor\(/, 'no call site skips a chapter’s own accent');
});

test('every white logo reads on its card: at least 3:1, the WCAG contrast for graphics', () => {
  const onWhite = (hex) => contrast(hex, '#FFFFFF');
  for (const c of story.chapters) assert.ok(onWhite(c.color) >= 3, `${c.id}: white on ${c.color} is ${onWhite(c.color).toFixed(2)}:1`);
  // A build may bring its own card color (content.js build.color): the same bar.
  for (const build of story.chapters.flatMap((c) => c.builds ?? []).filter((b) => b.color)) {
    assert.ok(onWhite(build.color) >= 3, `${build.slug}: white on ${build.color} is ${onWhite(build.color).toFixed(2)}:1`);
  }
  // Why suph.app's card is the Quran site's forest green and its sage only the accent:
  // white on the sage would be about 2:1.
  assert.ok(onWhite('#243F39') >= 3);
  assert.ok(onWhite('#AAB8A7') < 3);
});

// One rule's declarations, comments stripped: `.a .b { x: y; }` → "x: y;".
const rule = (selector) => {
  const match = new RegExp(`(?:^|\\})\\s*${selector.replace(/[.[\]"()+]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(css);
  assert.ok(match, `${selector} has a rule`);
  return match[1].replace(/\s+/g, ' ');
};

test('logos sit inside their cards, with a margin of color', () => {
  // The suph.app screenshot is retired (Suphian: "just put the crown logo"): no rule for it is left.
  assert.doesNotMatch(css, /\.story-card-shot/);
  const logo = rule('.story-card-logo');
  assert.ok(logo.includes('object-fit: contain'), 'logos are contained, not cropped');
  assert.match(logo, /max-height: 42%/, 'logos keep a margin of color around them');
  assert.doesNotMatch(logo, /object-fit: cover|position: absolute|inset:/, 'logos never fill the card');
  // The card clips to its rounded corners, and the hairline stays on every card.
  const card = rule('.story-card');
  assert.match(card, /position: relative/);
  assert.match(card, /overflow: hidden/);
  assert.match(card, /border: 1px solid/);
});

test('the "Studio" divider is a quiet label: readable, sentence case, secondary gray', () => {
  const divider = rule('.story-divider');
  assert.match(divider, /font-size: 16px/);
  assert.match(divider, /font-weight: 400/);
  assert.match(divider, /color: var\(--ink-muted\)/);
  assert.match(divider, /height: var\(--story-divider\)/, 'the marker steps over exactly this height');
  assert.match(rule('.story-divider::after'), /background: var\(--hairline\)/);
  // The marker steps over the divider below it.
  assert.match(rule('.story-marker'), /var\(--story-divider\) \* var\(--active-group, 0\)/);
  // JSX and CSS agree on the single-column breakpoint.
  const stacked = /const STACKED = '([^']+)'/.exec(jsx)[1];
  assert.ok(css.includes(`@media ${stacked} {`), `story.css has @media ${stacked}`);
});

// Top-level blocks of the stylesheet: { prelude, body } per rule or @media block.
const blocks = (source) => {
  const out = [];
  let depth = 0;
  let start = 0;
  let open = 0;
  for (let i = 0; i < source.length; i++) {
    if (source[i] === '{') {
      if (depth === 0) open = i;
      depth += 1;
    } else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) {
        out.push({ prelude: source.slice(start, open).trim(), body: source.slice(open + 1, i) });
        start = i + 1;
      }
    }
  }
  return out;
};

test('scroll alone picks the chapter: nothing on hover or pointer movement picks one', () => {
  // Suphian 2026-09-27: "remove the hover state and have it function only through
  // scroll. Having both is a little confusing. If you click, maybe it opens it."
  const index = readFileSync(new URL('./StoryIndex.jsx', import.meta.url), 'utf8');
  assert.doesNotMatch(index, /on(Pointer|Mouse)(Move|Enter|Over|Leave|Out)\b/, 'no hover or pointer-move handler in the index');
  assert.doesNotMatch(index, /addEventListener\(\s*'(pointer|mouse)(move|over|enter)'/);
  // A click on a row or a rail card opens its chapter, active or not.
  assert.match(index, /onClick=\{\(\) => onOpen\(index\)\}[\s\S]*onClick=\{\(\) => onOpen\(index\)\}/);
  // The one place a chapter opens, so the event fires exactly once per open.
  assert.equal(index.match(/trackEvent\(/g).length, 1);
  assert.match(index, /const openAt = useCallback\(\(index\) => \{\s*trackEvent\('story_chapter_opened', \{ chapter: CHAPTERS\[index\]\.id \}\);/);
});

test('hover is a faint lift for a mouse only, never the active white, and never sticks after a tap', () => {
  const hoverMedia = /^@media \(hover: hover\) and \(pointer: fine\)/;
  for (const { prelude, body } of blocks(css)) {
    if (!prelude.startsWith('@media')) {
      assert.doesNotMatch(prelude, /:hover/, `${prelude}: hover outside a (hover: hover) block sticks after a tap on iOS`);
      continue;
    }
    if (hoverMedia.test(prelude)) continue;
    for (const rule of blocks(body)) {
      if (!rule.prelude.includes(':hover')) continue;
      // Reduced motion may only switch a hover's movement off.
      assert.match(prelude, /prefers-reduced-motion/, rule.prelude);
      assert.match(rule.body.trim(), /^transform: none;?$/, rule.prelude);
    }
  }
  // The row's hover: pinned layout only, rows other than the active one, and a
  // mid gray, so a hovered row never looks like the chapter scroll picked.
  const row = blocks(css).find((b) => b.prelude.includes('min-width: 801px') && hoverMedia.test(b.prelude));
  assert.ok(row, 'a hover block for the pinned list');
  assert.match(row.prelude, /\(min-height: 561px\)/);
  const rules = blocks(row.body);
  assert.deepEqual(rules.map((r) => r.prelude), ['.story-item:not([data-distance="0"]) .story-button:hover']);
  assert.match(rules[0].body, /color: var\(--ink-muted\)/);
  assert.doesNotMatch(rules[0].body, /var\(--ink\)|#fff|opacity|transform/i);
});

test('suph.app’s builds are one-line rows in the links’ rhythm: no toggle, no summaries, no pills', () => {
  // Suphian 2026-09-28: "It should just be a list", then "Condense… Maybe you don't need the description".
  assert.doesNotMatch(css, /story-month|story-build-summary/, 'the retired toggle and summaries left no rules behind');
  assert.doesNotMatch(jsx, /StoryMonths|suph_app_month_viewed|aria-live/);
  // Hairlines above the first row and under every row, as .story-links has them, and the
  // links' place: the same top margin under the summary (Suphian 2026-09-28: the rows sit
  // where other chapters' links do).
  assert.match(rule('.story-builds'), /border-top: 1px solid var\(--hairline\)/);
  const topMargin = (selector) => /margin: (\d+px) 0 0/.exec(rule(selector))?.[1];
  assert.equal(topMargin('.story-builds'), '40px');
  assert.equal(topMargin('.story-builds'), topMargin('.story-links'));
  // suph.app has no role line: its years line starts where a role line would.
  assert.match(rule('.story-detail-years:first-child'), /margin-top: 0/);
  assert.match(rule('.story-build'), /border-bottom: 1px solid var\(--hairline\)/);
  // A 56px row (a 40px token and 8px above and below), never under a 44px tap target.
  assert.match(rule('.story-link.story-build-link'), /min-height: 56px; padding: 8px 0;/);
  const token = rule('.story-build-token');
  assert.match(token, /width: 40px; height: 40px;/);
  assert.match(token, /border-radius: 6px/, 'a small square, the cards’ own corners');
  assert.match(token, /background: var\(--token-color/, 'the build’s own color');
  // The name strong like a link, the month in secondary gray set right on a wide screen.
  assert.match(rule('.story-build-name'), /font-weight: var\(--weight-strong\)/);
  assert.match(rule('.story-build-name'), /color: var\(--ink\)/);
  assert.match(rule('.story-build-month'), /margin-left: auto/);
  assert.match(rule('.story-build-month'), /color: var\(--ink-muted\)/);
  for (const selector of ['.story-builds', '.story-build', '.story-build-name', '.story-build-month']) {
    assert.doesNotMatch(rule(selector), /background|border-radius|box-shadow/, `${selector}: no card or pill`);
  }
  // Phones: the month drops under the name, so the two never collide.
  const phone = blocks(css).find((b) => b.prelude === '@media (max-width: 800px)').body;
  assert.match(phone, /\.story-build-token \{ grid-row: 1 \/ span 2; \}/);
  assert.match(phone, /\.story-build-month \{ grid-column: 2; align-self: start; margin-left: 0; \}/);
  // Only a mouse moves the panel's icon, and nothing about a build restyles on hover.
  const builds = readFileSync(new URL('./StoryBuilds.jsx', import.meta.url), 'utf8');
  assert.match(builds, /const FINE_POINTER = '\(hover: hover\) and \(pointer: fine\)';/);
  assert.doesNotMatch(css, /\.story-build[^{]*:hover/);
});

test('suph.app’s panel crossfades between icons, instantly under reduced motion, and sends no event', () => {
  const detail = readFileSync(new URL('./StoryDetail.jsx', import.meta.url), 'utf8');
  // The fading copy and the fade-in are both skipped under reduced motion.
  assert.match(detail, /if \(old && !prefersReducedMotion\(\)\) \{/);
  assert.ok(detail.indexOf('fadeIn.current = true') > detail.indexOf('if (old && !prefersReducedMotion()) {'));
  const reduced = css.split('@media (prefers-reduced-motion: reduce)')[1];
  assert.ok(reduced.includes('.story-card--panel'), 'no color transition either');
  // The copy and the new icon share the card's one grid cell.
  assert.match(css, /\.story-card > \* \{ grid-area: 1 \/ 1; \}/);
  // No new analytics: the open is counted once in StoryIndex, the links by ExternalLink.
  assert.doesNotMatch(jsx.replace(readFileSync(new URL('./StoryIndex.jsx', import.meta.url), 'utf8'), ''), /\btrack(Event)?\(/);
});

test('a band change restyles the marker and the rail track, not the whole stage', () => {
  // The two rules that read the active index, and the index not inherited by the
  // cards inside the track (render.test.mjs checks where StoryIndex sets it).
  assert.match(rule('.story-marker'), /var\(--active, 0\)/);
  assert.match(rule('.story-rail-track'), /var\(--active, 0\)/);
  assert.match(css, /@property --active \{\s*syntax: '<number>';\s*inherits: false;\s*initial-value: 0;\s*\}/);
});

test('one gap between the list and SAY HELLO, and it is SAY HELLO’s top padding', () => {
  // Suphian: the space after the last side project was too much. It was the stage's
  // trailing padding (stacked) or its empty tail (pinned) plus SAY HELLO's own padding.
  const hello = readFileSync(new URL('../sayhello/sayhello.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const wrap = /(?:^|\})\s*\.say-hello-wrap\s*\{([^}]*)\}/.exec(hello)[1].replace(/\s+/g, ' ');
  assert.match(wrap, /padding: var\(--space-section\) /, 'the gap is the page’s section spacing');
  assert.match(wrap, /position: relative/, 'above the pinned stage it overlaps, for paint and pointer');
  for (const [, body] of hello.matchAll(/@media[^{]*\{\s*\.say-hello-wrap\s*\{([^}]*)\}/g)) {
    assert.doesNotMatch(body, /padding(-top)?\s*:\s*\d/, 'no breakpoint puts a fixed top padding back');
  }

  // Pinned: the track gives back the stage's empty tail below the lower of the list and
  // the card (both centred), so SAY HELLO starts where they end. Its height, and so the
  // point where the pin lets go, is unchanged.
  assert.match(rule('.story'), /--stage-tail: calc\(\(100svh - var\(--stage-top\) - var\(--stage-bottom\) - max\(var\(--count, 6\) \* var\(--story-row\) \+ var\(--story-divider\), var\(--card-h\)\)\) \/ 2 \+ var\(--stage-bottom\)\)/);
  const track = rule('.story-track');
  assert.match(track, /height: calc\(100svh \+ var\(--count, 5\) \* var\(--band\)\)/);
  assert.match(track, /margin-bottom: calc\(-1 \* max\(0px, var\(--stage-tail\)\)\)/);

  // Stacked: no pin, no tail, and the stage adds no space after the last row.
  const stackedBlock = css.split(/@media \(max-width: 800px\), \(max-height: 560px\) \{/)[1];
  assert.match(stackedBlock, /\.story-track\s*\{[^}]*margin-bottom: 0/);
  assert.match(stackedBlock, /\.story-stage\s*\{[^}]*padding: 0;/);
});
