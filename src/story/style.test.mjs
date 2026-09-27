import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { story } from '../content.js';
import { accentFor } from './logic.js';

// Guards for the story index's type and color rules (DESIGN-BRIEF.md and Suphian's
// 2026-09-26 notes), checked against the stylesheet and components as written.
const css = readFileSync(new URL('./story.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const jsx = ['StoryIndex.jsx', 'StoryDetail.jsx', 'StoryCard.jsx']
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

test('each chapter’s accent is its company color, or white when too dark to see', () => {
  const accents = Object.fromEntries(story.chapters.map((c) => [c.id, accentFor(c.color)]));
  assert.deepEqual(accents, {
    steadily: '#6C1D72',
    youtube: '#FF0000',
    google: '#4285F4',
    huge: '#FF0090',
    abacus: '#FFFFFF',
    'suph-app': '#AC8243',
  });
});

test('every white logo reads on its card: at least 3:1, the WCAG contrast for graphics', () => {
  const luminance = (hex) => {
    const [r, g, b] = [1, 3, 5]
      .map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
      .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  const onWhite = (hex) => 1.05 / (luminance(hex) + 0.05);
  for (const c of story.chapters) assert.ok(onWhite(c.color) >= 3, `${c.id}: white on ${c.color} is ${onWhite(c.color).toFixed(2)}:1`);
  // Why suph.app's card is the crown gradient's deep gold, not its lighter gold.
  assert.ok(onWhite('#C19C56') < 3);
});

// One rule's declarations, comments stripped: `.a .b { x: y; }` → "x: y;".
const rule = (selector) => {
  const match = new RegExp(`(?:^|\\})\\s*${selector.replace(/[.[\]"()]/g, '\\$&')}\\s*\\{([^}]*)\\}`).exec(css);
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

test('the "Side projects" divider is a quiet label: readable, sentence case, secondary gray', () => {
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
