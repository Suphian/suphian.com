import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { story } from '../content.js';
import { inkMass, opticalNudge, pathBounds, pathEdges, svgGlyphs } from './logo-geometry.js';

const publicDir = new URL('../../public/', import.meta.url);
const read = (src) => readFileSync(new URL(src.slice(1), publicDir), 'utf8');
const near = (actual, expected, tolerance = 1e-6) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} is not ${expected}`);
const box = ({ left, top, right, bottom }) => ({ left, top, right, bottom });

test('pathBounds: lines, relative commands and closes', () => {
  assert.deepEqual(pathBounds('M0 0H10V5H0Z'), { left: 0, top: 0, right: 10, bottom: 5 });
  assert.deepEqual(pathBounds('m2 3h4v5h-4z'), { left: 2, top: 3, right: 6, bottom: 8 });
  // Packed numbers, as SVG exporters write them: "1.5.5" is 1.5 then .5.
  assert.deepEqual(pathBounds('M1.5.5l-1.5-.5'), { left: 0, top: 0, right: 1.5, bottom: 0.5 });
  // Extra pairs after a move are line-tos.
  assert.deepEqual(pathBounds('M0 0 4 4 8 0'), { left: 0, top: 0, right: 8, bottom: 4 });
});

test('pathBounds: curve extrema, not just end points', () => {
  // A cubic arch from (0,0) to (10,0) with both controls at y=-8 peaks at y=-6.
  const arch = pathBounds('M0 0C0 -8 10 -8 10 0');
  near(arch.top, -6);
  near(arch.bottom, 0);
  // The same arch drawn relative, then mirrored with S.
  const wave = pathBounds('m0 0c0-8 10-8 10 0s10 8 10 0');
  near(wave.top, -6);
  near(wave.bottom, 6);
  near(wave.right, 20);
  // A quadratic from (0,0) through control (5,10) to (10,0) peaks at y=5.
  near(pathBounds('M0 0Q5 10 10 0').bottom, 5);
});

test('pathBounds: elliptical arcs, drawn the way the SVG spec draws them', () => {
  const bounds = (d) => Object.values(pathBounds(d));
  const exact = (d, expected) => bounds(d).forEach((value, n) => near(value, expected[n], 1e-9));
  // A half circle from (0,0) to (10,0), radius 5: the sweep flag picks the side
  // (1 turns clockwise on screen, over the top; 0 under the bottom).
  exact('M0 0A5 5 0 0 1 10 0', [0, -5, 10, 0]);
  exact('M0 0A5 5 0 0 0 10 0', [0, 0, 10, 5]);
  // Relative, and with the flags packed into the next number ("0110 0" is 0, 1, then 10 0).
  exact('m0 0a5 5 0 0 1 10 0', [0, -5, 10, 0]);
  exact('M0 0A5 5 0 0110 0', [0, -5, 10, 0]);
  // Radii too small to span the chord grow until they do; a zero radius is a straight line;
  // an arc that ends where it starts draws nothing.
  exact('M0 0A1 1 0 0 1 10 0', [0, -5, 10, 0]);
  exact('M0 0A0 5 0 0 1 10 0', [0, 0, 10, 0]);
  exact('M3 4A5 5 0 0 1 3 4', [3, 4, 3, 4]);
  // The large-arc flag takes the long way round: a quarter circle, or three quarters of it.
  exact('M5 0A5 5 0 0 1 10 5', [5, 0, 10, 5]);
  exact('M5 0A5 5 0 1 0 10 5', [0, 0, 10, 10]);
  // A whole circle from two halves (the crown's jewels), and an ellipse turned 90°.
  exact('M10 5A5 5 0 1 0 0 5A5 5 0 1 0 10 5Z', [0, 0, 10, 10]);
  exact('M0 0A10 5 90 0 1 0 20', [0, 0, 5, 20]);
  // At other angles the extremes fall inside a piece: within the cubics' 0.03% of the radius.
  // An ellipse (20 by 10) turned 30° spans 2√(20²cos²30° + 10²sin²30°) by 2√(20²sin²30° + 10²cos²30°).
  const tilted = pathBounds('M0 0A20 10 30 1 1 0 .001');
  near(tilted.right - tilted.left, 2 * Math.sqrt(325), 20 * 3e-4);
  near(tilted.bottom - tilted.top, 2 * Math.sqrt(175), 20 * 3e-4);
});

test('pathBounds refuses what it cannot measure', () => {
  assert.throws(() => pathBounds('M0 0A5 5 0 2 1 10 0'), /arc flag/);
  assert.throws(() => pathBounds('M0 0Z 4 4'), /command/);
  assert.throws(() => pathBounds(''), /Empty/);
});

test('pathEdges closes every subpath, as a renderer fills it', () => {
  // An open triangle gets its closing edge; a closed square gets exactly four.
  assert.deepEqual(pathEdges('M0 0L4 0L4 4'), [[0, 0, 4, 0], [4, 0, 4, 4], [4, 4, 0, 0]]);
  assert.equal(pathEdges('M0 0H4V4H0Z').length, 4);
  // Curves are split into straight pieces that end exactly on the curve's end point.
  const arch = pathEdges('M0 0C0 -8 10 -8 10 0Z', { steps: 8 });
  assert.equal(arch.length, 9);
  assert.deepEqual(arch[7].slice(2), [10, 0]);
});

test('svgGlyphs reads the viewBox and one glyph per path or rect', () => {
  const svg = '<svg viewBox="0 0 20 10"><path d="M0 0H5V10H0Z"/><rect x="10" y="2" width="4" height="8"/></svg>';
  const { viewBox, glyphs } = svgGlyphs(svg);
  assert.deepEqual(viewBox, { x: 0, y: 0, width: 20, height: 10 });
  assert.deepEqual(box(glyphs[0]), { left: 0, top: 0, right: 5, bottom: 10 });
  assert.deepEqual(box(glyphs[1]), { left: 10, top: 2, right: 14, bottom: 10 });
  assert.equal(glyphs[1].edges.length, 4);
  assert.equal(glyphs[0].rule, 'nonzero');
  assert.equal(svgGlyphs('<svg viewBox="0 0 1 1"><path fill-rule="evenodd" d="M0 0H1V1Z"/></svg>').glyphs[0].rule, 'evenodd');
  assert.throws(() => svgGlyphs('<svg viewBox="0 0 1 1"><g transform="scale(2)"><path d="M0 0H1V1Z"/></g></svg>'), /transforms/);
});

test('inkMass: area and centre of mass, by fill rule, overlaps counted once', () => {
  const glyphs = (body) => svgGlyphs(`<svg viewBox="0 0 40 40">${body}</svg>`).glyphs;
  // Sampled in thin slices, so allow a slice's worth of error.
  const area = (actual, expected) => near(actual, expected, expected * 1e-3);
  // A 10 x 20 bar from y=10 to 30: area 200, centre 20. Clipped to y ≤ 15: area 50, centre 12.5.
  const bar = glyphs('<rect x="0" y="10" width="10" height="20"/>');
  area(inkMass(bar, { from: 0, to: 40 }).mass, 200);
  near(inkMass(bar, { from: 0, to: 40 }).centre, 20, 0.01);
  area(inkMass(bar, { from: 0, to: 15 }).mass, 50);
  near(inkMass(bar, { from: 0, to: 15 }).centre, 12.5, 0.01);
  // A 20 x 20 square with a 10 x 10 hole wound the same way: evenodd leaves the hole
  // empty (300), nonzero fills it (400).
  const ring = 'M0 0H20V20H0Z M5 5H15V15H5Z';
  area(inkMass(glyphs(`<path fill-rule="evenodd" d="${ring}"/>`), { from: 0, to: 40 }).mass, 300);
  area(inkMass(glyphs(`<path d="${ring}"/>`), { from: 0, to: 40 }).mass, 400);
  // Two overlapping squares cover 10x10 + 10x10 - 5x5 = 175, not 200.
  area(inkMass(glyphs('<rect x="0" y="0" width="10" height="10"/><rect x="5" y="5" width="10" height="10"/>'), { from: 0, to: 40 }).mass, 175);
  // A circle drawn as two arcs: area πr², centred on its centre.
  const circle = inkMass(glyphs('<path d="M30 20A10 10 0 1 0 10 20A10 10 0 1 0 30 20Z"/>'), { from: 0, to: 40 });
  area(circle.mass, Math.PI * 100);
  near(circle.centre, 20, 0.01);
  // Nothing to measure.
  assert.ok(Number.isNaN(inkMass(bar, { from: 35, to: 40 }).centre));
});

test('opticalNudge centres the ink above the baseline, only when a glyph descends', () => {
  // An 8-wide "H" from 0 to 30 (the cap line to the baseline), an 8-wide "u" from 10
  // to 30, and a "g" from 10 to 40 whose tail hangs 10 below the baseline. Box 0..40.
  const withG = '<svg viewBox="0 0 40 40"><path d="M0 0H8V30H0Z"/><path d="M10 10H18V30H10Z"/><path d="M20 10H28V40H20Z"/></svg>';
  // Ink above the baseline: 240 centred at 15, then 160 and 160 centred at 20:
  // centre 10000 / 560 = 17.857. The box centre is 20, so move down 2.143 / 40.
  assert.equal(opticalNudge(withG), 0.054);
  // Full-height mark beside lower text (YouTube's button): not a descender.
  const button = '<svg viewBox="0 0 40 20"><path d="M0 0H10V20H0Z"/><path d="M12 2H20V18H12Z"/><path d="M22 6H30V18H22Z"/></svg>';
  assert.equal(opticalNudge(button), 0);
});

test('the real logos: Huge and Google descend and move down a little; YouTube, Steadily and the crown stay put', () => {
  const nudge = (id) => opticalNudge(read(`/work/${id}.svg`));
  // Small by design: the tail of a g weighs little, so the correction is a few percent
  // of the logo's height, not the whole descender.
  assert.ok(nudge('huge') > 0.01 && nudge('huge') < 0.05, `huge ${nudge('huge')}`);
  assert.ok(nudge('google') > 0.005 && nudge('google') < 0.05, `google ${nudge('google')}`);
  assert.equal(nudge('youtube'), 0);
  assert.equal(nudge('steadily'), 0);
  // suph.app's crown is a mark, not a word: nothing descends, so it is centred like the rest.
  // So is Quran Art's star.
  assert.equal(nudge('suph-app'), 0);
  assert.equal(nudge('quran-art'), 0);
});

test('the suph.app crown reads as the game’s emblem: one white mark with its details knocked out', () => {
  const { viewBox, glyphs } = svgGlyphs(read('/work/suph-app.svg'));
  assert.deepEqual(viewBox, { x: 22, y: 25, width: 76, height: 59 });
  // One even-odd path: the jewels (arcs) and the two engraved lines are holes in the white.
  assert.equal(glyphs.length, 1);
  assert.equal(glyphs[0].rule, 'evenodd');
  // Ink = the crown's body (2018) and band (60 x 10), less three jewels (r 5, 3, 3) and
  // two 1.4-high engraved lines (52 and 48 long). Filled solid, or with nonzero, the
  // area would come out larger.
  const expected = 2018 + 600 - Math.PI * (25 + 9 + 9) - 1.4 * (52 + 48);
  const { mass } = inkMass(glyphs, { from: viewBox.y, to: viewBox.y + viewBox.height });
  near(mass, expected, expected * 1e-3);
});

test('every logo’s viewBox is tight to its ink, so the box centre is the ink centre', () => {
  for (const id of ['huge', 'google', 'youtube', 'steadily', 'suph-app', 'quran-art']) {
    const { viewBox, glyphs } = svgGlyphs(read(`/work/${id}.svg`));
    const ink = {
      left: Math.min(...glyphs.map((g) => g.left)),
      top: Math.min(...glyphs.map((g) => g.top)),
      right: Math.max(...glyphs.map((g) => g.right)),
      bottom: Math.max(...glyphs.map((g) => g.bottom)),
    };
    // Within 0.1% of the logo's size on every side.
    const slackX = viewBox.width * 0.001;
    const slackY = viewBox.height * 0.001;
    near(ink.left, viewBox.x, slackX);
    near(ink.right, viewBox.x + viewBox.width, slackX);
    near(ink.top, viewBox.y, slackY);
    near(ink.bottom, viewBox.y + viewBox.height, slackY);
  }
});

test('content.js stores exactly the measured nudge for every logo card', () => {
  // A chapter's card, or each of suph.app's monthly builds' cards.
  const cards = story.chapters.flatMap((chapter) =>
    chapter.builds ? chapter.builds.map((build) => [`${chapter.id}/${build.slug}`, build.image]) : [[chapter.id, chapter.image]],
  );
  assert.ok(cards.some(([, image]) => image.src === '/work/quran-art.svg'), 'the builds are measured too');
  for (const [id, { src, nudge }] of cards) {
    // Every card is a logo card, suph.app's crown included: each stores its measured nudge.
    // SVGs are measured from their paths. The Abacus PNG is a symmetric mark with even
    // 4px margins on every side and no descender, so its nudge is 0.
    const measured = src.endsWith('.svg') ? opticalNudge(read(src)) : 0;
    assert.equal(nudge, measured, `${id}: stored ${nudge}, measured ${measured}`);
  }
});

test('Quran Art’s placeholder star: one white mark, two squares with a round knockout', () => {
  // Placeholder until Suphian supplies artwork (content.js). An eight-point star, the union
  // of a 70.71 square and the same square turned 45°, with a circle (r 9) knocked out.
  const { viewBox, glyphs } = svgGlyphs(read('/work/quran-art.svg'));
  assert.deepEqual(viewBox, { x: 0, y: 0, width: 100, height: 100 });
  assert.equal(glyphs.length, 1);
  assert.equal(glyphs[0].rule, 'evenodd');
  // Two squares of 5000 overlap in a regular octagon of 8 · 35.355² · tan 22.5°.
  const side = 50 / Math.SQRT2;
  const expected = 2 * 5000 - 8 * side * side * Math.tan(Math.PI / 8) - Math.PI * 81;
  const { mass, centre } = inkMass(glyphs, { from: 0, to: 100 });
  near(mass, expected, expected * 1e-3);
  near(centre, 50, 0.05); // symmetric: nothing to nudge
});
