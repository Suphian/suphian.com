/**
 * node --test "src/favicon/*.test.mjs"
 *
 * Pure frame math for the SUPH favicon (the original wave and the hop, jelly
 * and puff variants), the icon layout, and the browser controller (bursts and
 * the ambient beat) driven through a fake DOM and a manual clock.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_VARIANT, GECKO_JIGGLE, GECKO_MOTIONS, HOP, JELLY, JIGGLE, LETTER_COUNT, MOTIONS, ORDER, PUFF, REST_POSE,
  VARIANT_NAMES, burstDuration, burstFrames, clampStrength, envelope, frameCount, frameIndexAt, framePoses, frameTimes,
  isRest, letterPose, motionFor,
} from './frame-math.js';
import { BASELINE, INK, RED, SUPH, TILE_COLOR, VARIANTS, iconLayout, letterMatrix } from './layout.js';
import {
  BURST_MS, FAVICON_DEFAULTS, LINK_ID, _faviconState, createRenderer, iconSize, initFavicon, isGecko, jiggle,
} from './favicon.js';
import { flattenPath, transformPolys } from '../../tests/lib/raster.mjs';

const FIREFOX_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:143.0) Gecko/20100101 Firefox/143.0';
const FIREFOX_ANDROID_UA = 'Mozilla/5.0 (Android 15; Mobile; rv:143.0) Gecko/143.0 Firefox/143.0';
const CHROME_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const SAFARI_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15';
const FIREFOX_IOS_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) FxiOS/143.0 Mobile/15E148 Safari/605.1.15';

const STRENGTHS = [0.25, 0.7, 0.85, 1, 1.6];
const apply = (m, [x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];

// ---------- frame math ----------
test('SUPH order and letter count match the lettering', () => {
  assert.equal(LETTER_COUNT, 4);
  assert.deepEqual(ORDER, SUPH.map((l) => l.char));
});

test('every burst starts and ends exactly at rest', () => {
  for (const s of STRENGTHS) {
    const frames = burstFrames(s);
    assert.ok(frames[0].poses.every(isRest), `first frame at rest (strength ${s})`);
    assert.ok(frames.at(-1).poses.every(isRest), `last frame at rest (strength ${s})`);
    assert.ok(frames.slice(1, -1).some((f) => !f.poses.every(isRest)), 'something moves in between');
  }
  for (const t of [-1, -0.001, 0, burstDuration(), burstDuration() + 0.001, 5]) {
    assert.ok(framePoses(t, 1).every(isRest), `rest outside the burst at t=${t}`);
  }
});

test('burst length and frame count match the parameters', () => {
  const duration = burstDuration();
  assert.equal(duration, (LETTER_COUNT - 1) * JIGGLE.stagger + JIGGLE.ring);
  assert.ok(duration >= 0.8 && duration <= 1.4, `burst lasts ${duration}s`);
  assert.ok(JIGGLE.fps >= 24 && JIGGLE.fps <= 30);
  const times = frameTimes();
  assert.equal(times.length, frameCount());
  assert.equal(frameCount(), Math.ceil(duration * JIGGLE.fps) + 1);
  assert.equal(times[0], 0);
  assert.equal(times.at(-1), duration);
  for (let i = 1; i < times.length; i++) assert.ok(times[i] > times[i - 1], 'times increase');
  assert.equal(burstFrames().length, frameCount());
  assert.equal(frameIndexAt(-1), 0);
  assert.equal(frameIndexAt(0), 0);
  assert.equal(frameIndexAt(1 / JIGGLE.fps + 1e-6), 1);
  assert.equal(frameIndexAt(99), frameCount() - 1);
  assert.equal(BURST_MS, Math.round(duration * 1000));
  // H is still moving shortly before the end, so the burst isn't padded with dead frames.
  assert.ok(!isRest(letterPose(duration - 0.25, 3, 1)));
});

test('poses are bounded and never NaN, whatever the input', () => {
  const lim = JIGGLE.maxBulge;
  const leanCap = JIGGLE.lean * JIGGLE.maxStrength;
  const inputs = [...STRENGTHS, 0, -1, 99, NaN, Infinity, 'x', undefined];
  for (const s of inputs) {
    for (let ms = -100; ms <= 1600; ms += 1) {
      for (const pose of framePoses(ms / 1000, s)) {
        for (const v of [pose.sx, pose.sy, pose.skew]) assert.ok(Number.isFinite(v), `finite at ${ms}ms, strength ${s}`);
        assert.ok(pose.sx >= 1 / lim - 1e-12 && pose.sx <= lim + 1e-12);
        assert.ok(pose.sy >= 1 / lim - 1e-12 && pose.sy <= lim + 1e-12);
        assert.ok(Math.abs(pose.skew) <= leanCap + 1e-12);
      }
    }
  }
  assert.equal(clampStrength(-1), 0);
  assert.equal(clampStrength(99), JIGGLE.maxStrength);
  assert.equal(clampStrength('x'), 1);
});

test('letters are kicked in S, U, P, H order, one stagger apart', () => {
  const firstMove = [0, 1, 2, 3].map((i) => {
    for (let ms = 0; ms <= 1000; ms += 1) if (!isRest(letterPose(ms / 1000, i, 1))) return ms;
    return Infinity;
  });
  for (let i = 1; i < 4; i++) {
    assert.ok(firstMove[i] > firstMove[i - 1], `${ORDER[i]} moves after ${ORDER[i - 1]}`);
    assert.ok(Math.abs(firstMove[i] - firstMove[i - 1] - JIGGLE.stagger * 1000) <= 1);
  }
  // At the first rendered frame after the kick, only S has moved.
  const early = framePoses(1 / JIGGLE.fps, 1);
  assert.ok(!isRest(early[0]) && early.slice(1).every(isRest));
});

test('each letter squashes first, overshoots into a stretch, then settles', () => {
  for (let i = 0; i < 4; i++) {
    const sy = [];
    for (let ms = 0; ms <= burstDuration() * 1000; ms += 5) sy.push(letterPose(ms / 1000, i, 1).sy);
    const minAt = sy.indexOf(Math.min(...sy));
    const maxAt = sy.indexOf(Math.max(...sy));
    assert.ok(Math.min(...sy) < 1 - JIGGLE.amplitude * 0.9, 'squash reaches about the amplitude');
    assert.ok(Math.max(...sy) > 1.05, 'overshoot into a stretch');
    assert.ok(minAt < maxAt, 'squash comes before the stretch');
    const firstMoving = sy.findIndex((v) => v !== 1);
    assert.ok(sy[firstMoving] < 1, 'the very first motion is a squash');
    // Settling: the tail is smaller than the first swing.
    const tail = sy.slice(-Math.round(sy.length / 3)).map((v) => Math.abs(v - 1));
    assert.ok(Math.max(...tail) < JIGGLE.amplitude * 0.25);
    // Squash widens, stretch thins (volume-ish).
    const squashed = letterPose((minAt * 5) / 1000, i, 1);
    assert.ok(squashed.sx > 1);
  }
});

/** Deepest squash (1 - min sy) and tallest stretch (max sy - 1) of letter i over the given times. */
function peaks(i, times, params = JIGGLE) {
  let lo = 1;
  let hi = 1;
  for (const t of times) {
    const { sy } = letterPose(t, i, 1, params);
    lo = Math.min(lo, sy);
    hi = Math.max(hi, sy);
  }
  return { squash: 1 - lo, stretch: hi - 1 };
}

test('Firefox sampling: same motion, frames far enough apart to each be shown, peaks kept', () => {
  assert.equal(burstDuration(GECKO_JIGGLE), burstDuration(JIGGLE));
  const times = frameTimes(GECKO_JIGGLE);
  assert.equal(times[0], 0);
  assert.equal(times.at(-1), burstDuration());
  // Firefox loads the newest <link rel=icon> at most once per 100 ms batch;
  // 125 ms or more between changes lets each frame get its own batch.
  for (let i = 1; i < times.length; i++) {
    assert.ok(times[i] - times[i - 1] >= 0.125 - 1e-9, `gap ${Math.round((times[i] - times[i - 1]) * 1000)} ms before frame ${i}`);
  }
  const frames = burstFrames(1, GECKO_JIGGLE);
  assert.ok(frames[0].poses.every(isRest) && frames.at(-1).poses.every(isRest));
  // The sampled frames land near the spring's peaks for every letter.
  const continuous = Array.from({ length: 1401 }, (_, ms) => ms / 1000);
  for (let i = 0; i < 4; i++) {
    const full = peaks(i, continuous);
    const shown = peaks(i, times, GECKO_JIGGLE);
    assert.ok(shown.squash >= 0.77 * full.squash, `${ORDER[i]} squash ${(shown.squash / full.squash).toFixed(2)}`);
    assert.ok(shown.stretch >= 0.77 * full.stretch, `${ORDER[i]} stretch ${(shown.stretch / full.stretch).toFixed(2)}`);
  }
});

test('Gecko is detected from the user agent (not WebKit or Blink "like Gecko")', () => {
  assert.equal(isGecko(FIREFOX_UA), true);
  assert.equal(isGecko(FIREFOX_ANDROID_UA), true);
  assert.equal(isGecko(CHROME_UA), false);
  assert.equal(isGecko(SAFARI_UA), false);
  assert.equal(isGecko(FIREFOX_IOS_UA), false, 'Firefox on iOS is WebKit');
  assert.equal(isGecko(''), false);
  assert.equal(isGecko(), false);
});

test('frame math is deterministic and strength scales it', () => {
  assert.deepEqual(burstFrames(0.85), burstFrames(0.85));
  const weak = letterPose(0.07, 0, 0.5);
  const strong = letterPose(0.07, 0, 1);
  assert.ok(1 - weak.sy < 1 - strong.sy);
  assert.ok(framePoses(0.3, 0).every(isRest));
  assert.equal(envelope(0), 0);
  assert.equal(envelope(JIGGLE.ring), 0);
});

// ---------- layout ----------
test('letters squash about their own baseline centre', () => {
  const layout = iconLayout(32);
  for (let i = 0; i < 4; i++) {
    const anchor = [SUPH[i].width / 2, BASELINE];
    const rest = apply(letterMatrix(i, { sx: 1, sy: 1, skew: 0 }, layout), anchor);
    const moved = apply(letterMatrix(i, { sx: 1.2, sy: 0.8, skew: 5 }, layout), anchor);
    assert.ok(Math.abs(rest[0] - moved[0]) < 1e-9 && Math.abs(rest[1] - moved[1]) < 1e-9);
  }
  for (const size of [16, 32, 48, 64]) {
    const b16 = (iconLayout(size).baselinePx * 16) / size;
    assert.equal(b16, Math.round(b16), `baseline on a 16 px pixel row at ${size}px`);
  }
});

test('the jiggling word stays inside the favicon tile', () => {
  for (const size of [16, 32, 64]) {
    const layout = iconLayout(size);
    for (const { poses } of burstFrames(JIGGLE.maxStrength)) {
      poses.forEach((pose, i) => {
        const m = letterMatrix(i, pose, layout);
        const l = SUPH[i];
        const corners = [[0, INK.top], [l.width, INK.top], [0, INK.bottom], [l.width, INK.bottom]];
        for (const [x, y] of corners.map((c) => apply(m, c))) {
          assert.ok(y >= 0 && y <= size, `y ${y} inside ${size}px`);
          assert.ok(x >= -0.06 * size && x <= size * 1.06, `x ${x} near ${size}px`);
        }
      });
    }
  }
  assert.equal(iconSize(1), 32);
  assert.equal(iconSize(2), 32);
  assert.equal(iconSize(3), 48);
  assert.equal(iconSize(8), 64);
});

test('SUPH sits centred in the tile at rest, not sunk towards the bottom', () => {
  const margins = (size, variant) => {
    const L = iconLayout(size, variant);
    return { top: INK.top * L.k + L.oy, bottom: size - (INK.bottom * L.k + L.oy) };
  };
  // Favicon sizes (baseline snapped to the 16 px grid): within 0.5 px of centre at 16 px scale,
  // and never lower than centre.
  for (const size of [16, 32, 48, 64]) {
    const { top, bottom } = margins(size, 'favicon');
    const unit = size / 16;
    assert.ok(Math.abs(top - bottom) / unit <= 0.5, `${size}px: top ${top.toFixed(2)} vs bottom ${bottom.toFixed(2)}`);
    assert.ok(top <= bottom, `${size}px: ink not below centre`);
  }
  assert.equal(iconLayout(16).baselinePx, 12);
  assert.equal(iconLayout(32).baselinePx, 24);
  assert.equal(iconLayout(64).baselinePx, 48);
  // Static icons: centred, or lifted by at most 2% of the size, never low.
  for (const [variant, size] of [['touch', 180], ['any', 192], ['any', 512], ['maskable', 512]]) {
    const { top, bottom } = margins(size, variant);
    assert.ok(top <= bottom && (bottom - top) / size <= 0.04, `${variant} ${size}: top ${top.toFixed(1)} vs bottom ${bottom.toFixed(1)}`);
  }
  for (const v of Object.values(VARIANTS)) assert.ok(v.center <= 0.5, 'no variant sits below centre');
});

// ---------- variants: wave, hop, jelly, puff ----------
const bothSamplings = (name) => [MOTIONS[name], GECKO_MOTIONS[name]];
const unison = (poses) => poses.every((p) => JSON.stringify(p) === JSON.stringify(poses[0]));
const near = (pose) => Math.abs(pose.sx - 1) < 0.01 && Math.abs(pose.sy - 1) < 0.01 && Math.abs(pose.skew) < 0.25
  && Math.abs(pose.x) < 2 && Math.abs(pose.y) < 2;

test('four variants by name; the default is one of them and is what initFavicon plays', () => {
  assert.deepEqual([...VARIANT_NAMES], ['wave', 'hop', 'jelly', 'puff']);
  assert.ok(VARIANT_NAMES.includes(DEFAULT_VARIANT));
  assert.equal(FAVICON_DEFAULTS.variant, DEFAULT_VARIANT);
  assert.equal(MOTIONS.wave, JIGGLE);
  assert.equal(GECKO_MOTIONS.wave, GECKO_JIGGLE);
  for (const name of VARIANT_NAMES) {
    assert.equal(MOTIONS[name].variant, name);
    assert.equal(GECKO_MOTIONS[name].variant, name);
    assert.equal(motionFor(name), MOTIONS[name]);
    assert.equal(motionFor(name, { gecko: true }), GECKO_MOTIONS[name]);
  }
  assert.equal(motionFor(), MOTIONS[DEFAULT_VARIANT]);
  assert.throws(() => motionFor('bounce'), RangeError);
  assert.throws(() => letterPose(0.5, 0, 1, { ...HOP, variant: 'bounce' }), RangeError);
});

test('every variant starts and ends exactly at rest, with no snap at either end', () => {
  for (const name of VARIANT_NAMES) {
    for (const params of bothSamplings(name)) {
      const end = burstDuration(params);
      const label = `${name} at ${params.fps} fps`;
      for (const s of STRENGTHS) {
        const frames = burstFrames(s, params);
        assert.ok(frames[0].poses.every(isRest), `${label}, strength ${s}: first frame at rest`);
        assert.ok(frames.at(-1).poses.every(isRest), `${label}, strength ${s}: last frame at rest`);
        assert.ok(frames.slice(1, -1).some((f) => !f.poses.every(isRest)), `${label}: something moves in between`);
      }
      for (const t of [-1, -0.001, 0, end, end + 0.001, 5, NaN]) assert.ok(framePoses(t, 1, params).every(isRest), `${label}: rest at t=${t}`);
      assert.ok(framePoses(end / 2, 0, params).every(isRest), `${label}: strength 0 is rest`);
      // Eased in and faded out: a millisecond from either end is already next to rest.
      for (const s of [1, params.maxStrength]) {
        assert.ok(framePoses(0.001, s, params).every(near), `${label}: eases in`);
        assert.ok(framePoses(end - 0.001, s, params).every(near), `${label}: settles before the end`);
      }
    }
  }
});

test('every variant lasts 0.9-1.6 s, keeps the wave beat, and has the right frame counts at 30 fps and at 8 fps on Firefox', () => {
  const expectedCount = (p) => {
    const end = burstDuration(p);
    const first = p.offset > 0 ? p.offset : 1 / p.fps;
    return 2 + Math.max(0, Math.ceil((end - 0.5 / p.fps - first) * p.fps - 1e-9));
  };
  for (const name of VARIANT_NAMES) {
    const [chrome, gecko] = bothSamplings(name);
    const d = burstDuration(chrome);
    assert.ok(d >= 0.9 && d <= 1.6, `${name} lasts ${d} s`);
    assert.equal(d, burstDuration(JIGGLE), `${name} keeps the wave's beat, so switching variants never changes the timing`);
    assert.equal(burstDuration(gecko), d, `${name}: Firefox plays the same motion for as long`);
    assert.equal(chrome.fps, 30);
    assert.equal(gecko.fps, 8);
    for (const params of [chrome, gecko]) {
      const times = frameTimes(params);
      assert.equal(times.length, frameCount(params));
      assert.equal(times.length, expectedCount(params), `${name} at ${params.fps} fps`);
      assert.equal(times[0], 0);
      assert.equal(times.at(-1), d);
      for (let i = 2; i < times.length - 1; i++) assert.ok(Math.abs(times[i] - times[i - 1] - 1 / params.fps) < 1e-9, 'moving frames one step apart');
      const tail = d - times.at(-2);
      assert.ok(tail >= 0.5 / params.fps - 1e-9 && tail < 1.5 / params.fps, 'no flash frame just before the rest frame');
      times.forEach((t, k) => assert.equal(frameIndexAt(t + 1e-6, params, times), k));
    }
    assert.equal(frameCount(chrome), frameCount(JIGGLE), `${name}: as many frames as the wave at 30 fps`);
    assert.equal(frameCount(gecko), frameCount(GECKO_JIGGLE), `${name}: as many frames as the wave at 8 fps`);
    const gt = frameTimes(gecko);
    for (let i = 1; i < gt.length; i++) {
      assert.ok(gt[i] - gt[i - 1] >= 0.125 - 1e-9, `${name}: Firefox gap ${Math.round((gt[i] - gt[i - 1]) * 1000)} ms before frame ${i}`);
    }
  }
  assert.equal(frameCount(JIGGLE), 36);
  assert.equal(frameCount(GECKO_JIGGLE), 10);
});

test('hop, jelly and puff poses are bounded and never NaN, whatever the strength', () => {
  const inputs = [...STRENGTHS, 0, -1, 99, NaN, Infinity, 'x', undefined];
  const tan = (deg) => Math.tan((deg * Math.PI) / 180);
  const eps = 1e-9;
  for (const s of inputs) {
    for (let ms = -100; ms <= 1700; ms += 2) {
      const t = ms / 1000;
      for (const name of ['hop', 'jelly', 'puff']) {
        const p = MOTIONS[name];
        for (const pose of framePoses(t, s, p)) {
          for (const v of Object.values(pose)) assert.ok(Number.isFinite(v), `${name} finite at ${ms} ms, strength ${s}`);
          if (name === 'hop') {
            assert.ok(pose.skew === 0 && pose.x === 0);
            assert.ok(pose.y >= 0 && pose.y <= p.maxHeight + eps, `hop lift ${pose.y}`);
            for (const v of [pose.sx, pose.sy]) assert.ok(v >= 1 / p.maxBulge - eps && v <= p.maxBulge + eps);
          } else if (name === 'jelly') {
            assert.equal(pose.y, 0);
            assert.ok(Math.abs(pose.skew) <= p.maxLean + eps, `jelly lean ${pose.skew}`);
            assert.ok(pose.sy >= 1 - p.bob - eps && pose.sy <= 1 + eps);
            assert.ok(Math.abs(pose.x) <= tan(p.maxLean) * p.pivot + eps);
          } else {
            assert.ok(pose.skew === 0 && pose.x === 0);
            for (const v of [pose.sx, pose.sy]) assert.ok(v >= 1 / p.maxScale - eps && v <= p.maxScale + eps);
            assert.ok(Math.abs(pose.y - (1 - pose.sy) * p.pivot) < 1e-9);
          }
        }
      }
    }
  }
});

// Real letter outlines, for checking where the ink goes.
const GLYPH_POLYS = SUPH.map((l) => flattenPath(l.path, 12));
const clampTo = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
/** How far (px) any ink reaches outside the rounded favicon tile at `size` (negative: that far inside). */
function inkOutsideTile(poses, size) {
  const L = iconLayout(size);
  const r = L.radius;
  let worst = -Infinity;
  poses.forEach((pose, i) => {
    for (const poly of transformPolys(GLYPH_POLYS[i], letterMatrix(i, pose, L))) {
      for (const [x, y] of poly) {
        const straight = (x >= r && x <= size - r) || (y >= r && y <= size - r);
        const d = straight
          ? Math.max(-x, x - size, -y, y - size)
          : Math.hypot(x - clampTo(x, r, size - r), y - clampTo(y, r, size - r)) - r;
        worst = Math.max(worst, d);
      }
    }
  });
  return worst;
}
test('every variant keeps SUPH inside the favicon tile, checked on the real letter outlines', () => {
  for (const name of VARIANT_NAMES) {
    for (const params of bothSamplings(name)) {
      for (const s of [0.7, 1, params.maxStrength]) {
        const frames = burstFrames(s, params);
        let worst = -Infinity;
        for (const { poses } of frames) worst = Math.max(worst, inkOutsideTile(poses, 16));
        // At the strengths the site uses, nothing to speak of; at max strength, less than half a pixel.
        const allowed = s <= 1 ? 0.1 : 0.4;
        assert.ok(worst <= allowed, `${name} at ${params.fps} fps, strength ${s}: ink ${worst.toFixed(2)} px outside the tile`);
        // Ink boxes, at every favicon size: never above or below the tile.
        for (const size of [16, 32, 64]) {
          const layout = iconLayout(size);
          for (const { poses } of frames) {
            poses.forEach((pose, i) => {
              const m = letterMatrix(i, pose, layout);
              const box = [[0, INK.top], [SUPH[i].width, INK.top], [0, INK.bottom], [SUPH[i].width, INK.bottom]];
              for (const [x, y] of box.map((c) => apply(m, c))) {
                assert.ok(y >= 0 && y <= size, `${name}: y ${y} inside ${size} px`);
                assert.ok(x >= -0.06 * size && x <= size * 1.06, `${name}: x ${x} near ${size} px`);
              }
            });
          }
        }
      }
    }
  }
});

test('hop: the whole word crouches, jumps 2 px, lands with a squash deeper than the crouch, rebounds once and settles', () => {
  const takeOff = HOP.crouchTime + HOP.launchTime;
  const touchdown = takeOff + HOP.airTime;
  let crouch = 1;
  let landing = 1;
  let lift = 0;
  let liftAt = 0;
  let rebound = 0;
  for (let ms = 1; ms < 1160; ms++) {
    const t = ms / 1000;
    const poses = framePoses(t, 1, HOP);
    assert.ok(unison(poses), `all four letters move as one at ${ms} ms`);
    const { sx, sy, y } = poses[0];
    if (sy < 1) assert.ok(sx > 1, 'wider when squashed');
    if (t < takeOff) {
      assert.equal(y, 0, 'on the ground while crouching');
      crouch = Math.min(crouch, sy);
    } else if (t < touchdown) {
      if (y > lift) [lift, liftAt] = [y, t];
    } else {
      landing = Math.min(landing, sy);
      rebound = Math.max(rebound, y);
    }
  }
  assert.ok(crouch <= 1 - 0.9 * HOP.crouch, `crouches first (${crouch.toFixed(3)})`);
  assert.ok(Math.abs(lift - HOP.height) < 0.01, 'peak lift is the hop height');
  assert.ok(lift * iconLayout(16).k >= 2, `jumps ${(lift * iconLayout(16).k).toFixed(2)} px at 16 px`);
  assert.ok(Math.abs(liftAt - (takeOff + touchdown) / 2) <= 0.001, 'highest halfway through the air');
  assert.ok(landing < crouch - 0.05, `the landing squash (${landing.toFixed(3)}) is deeper than the crouch`);
  assert.ok(rebound > 0.15 * lift && rebound < 0.5 * lift, 'one small rebound');
  // Stronger bursts jump higher, up to the cap that keeps the word in the tile.
  assert.ok(letterPose(liftAt, 0, 0.7, HOP).y < letterPose(liftAt, 0, 1, HOP).y);
  assert.ok(Math.abs(letterPose(liftAt, 0, HOP.maxStrength, HOP).y - HOP.maxHeight) < 0.01);
});

test('jelly: the word rocks side to side about its middle, each swing smaller, and never leaves the baseline', () => {
  const layout = iconLayout(32);
  const firstPeakAt = [];
  for (let i = 0; i < 4; i++) {
    const middle = [SUPH[i].width / 2, BASELINE - JELLY.pivot];
    const still = apply(letterMatrix(i, REST_POSE, layout), middle);
    const swings = []; // Largest lean of each swing, signed.
    let swing = 0;
    let peakAt = 0;
    for (let ms = 1; ms < 1160; ms++) {
      const pose = letterPose(ms / 1000, i, 1, JELLY);
      assert.equal(pose.y, 0, 'on the baseline');
      // The letter pivots about the middle of the ink: that point never moves.
      const moved = apply(letterMatrix(i, pose, layout), middle);
      assert.ok(Math.abs(moved[0] - still[0]) < 1e-9, `${ORDER[i]} rocks about its middle`);
      if (swing !== 0 && pose.skew !== 0 && Math.sign(pose.skew) !== Math.sign(swing)) {
        swings.push(swing);
        swing = 0;
      }
      if (Math.abs(pose.skew) > Math.abs(swing)) {
        swing = pose.skew;
        if (swings.length === 0) peakAt = ms;
      }
    }
    swings.push(swing);
    firstPeakAt.push(peakAt);
    assert.ok(swings.length >= 4, `${ORDER[i]} swings back and forth ${swings.length} times`);
    assert.ok(Math.abs(swings[0]) >= 0.9 * JELLY.lean, `${ORDER[i]}'s first swing leans ${swings[0].toFixed(1)} degrees`);
    for (let k = 1; k < swings.length; k++) {
      assert.equal(Math.sign(swings[k]), -Math.sign(swings[k - 1]), 'side to side');
      assert.ok(Math.abs(swings[k]) < Math.abs(swings[k - 1]), 'each swing smaller than the last');
    }
  }
  for (let i = 1; i < 4; i++) assert.ok(firstPeakAt[i] > firstPeakAt[i - 1], `${ORDER[i]} lags ${ORDER[i - 1]} a little`);
});

test('puff: the word inflates about its middle, shrinks past rest when the air goes, and wobbles back', () => {
  const layout = iconLayout(32);
  const middle = [SUPH[0].width / 2, BASELINE - PUFF.pivot];
  const still = apply(letterMatrix(0, REST_POSE, layout), middle);
  let full = REST_POSE;
  let fullAt = 0;
  let empty = REST_POSE;
  let emptyAt = 0;
  let after = 1;
  for (let ms = 1; ms < 1160; ms++) {
    const t = ms / 1000;
    const poses = framePoses(t, 1, PUFF);
    assert.ok(unison(poses), `all four letters puff together at ${ms} ms`);
    const p = poses[0];
    assert.equal(p.skew, 0);
    assert.ok((p.sx - 1) * (p.sy - 1) >= 0, 'grows or shrinks both ways at once, like a balloon');
    assert.ok(Math.abs(apply(letterMatrix(0, p, layout), middle)[1] - still[1]) < 1e-9, 'about the middle of the ink');
    if (p.sy > full.sy) [full, fullAt] = [p, t];
    if (p.sy < empty.sy) [empty, emptyAt] = [p, t];
    if (emptyAt && t > emptyAt) after = Math.max(after, p.sy);
  }
  assert.ok(Math.abs(full.sy - (1 + PUFF.grow)) < 1e-9 && Math.abs(full.sx - (1 + PUFF.widen)) < 1e-9 && full.sx > 1.05, 'fills up');
  assert.ok(emptyAt > fullAt, 'then lets the air out');
  assert.ok(empty.sy <= 1 - 0.95 * PUFF.grow * PUFF.undershoot, `past rest (${empty.sy.toFixed(3)})`);
  assert.ok(after > 1.01, 'and wobbles back through rest');
});

test('the four variants are distinct motions, visibly different at 16 px', () => {
  const layout = iconLayout(16);
  const corners = (poses) => poses.flatMap((pose, i) => {
    const m = letterMatrix(i, pose, layout);
    return [[0, INK.top], [SUPH[i].width, INK.top], [0, INK.bottom], [SUPH[i].width, INK.bottom]].map((c) => apply(m, c));
  });
  const track = (name) => frameTimes(JIGGLE).map((t) => corners(framePoses(t, 1, MOTIONS[name])));
  for (let a = 0; a < VARIANT_NAMES.length; a++) {
    for (let b = a + 1; b < VARIANT_NAMES.length; b++) {
      const A = track(VARIANT_NAMES[a]);
      const B = track(VARIANT_NAMES[b]);
      let most = 0;
      A.forEach((frame, f) => frame.forEach(([x, y], c) => { most = Math.max(most, Math.hypot(x - B[f][c][0], y - B[f][c][1])); }));
      assert.ok(most >= 1.5, `${VARIANT_NAMES[a]} and ${VARIANT_NAMES[b]} never differ by more than ${most.toFixed(2)} px`);
    }
  }
  // Each has its own signature.
  const sig = (name) => {
    const out = { lift: 0, lean: 0, grow: 0, apart: false };
    for (let ms = 1; ms < 1160; ms++) {
      const poses = framePoses(ms / 1000, 1, MOTIONS[name]);
      out.apart ||= !unison(poses);
      for (const p of poses) {
        out.lift = Math.max(out.lift, p.y);
        out.lean = Math.max(out.lean, Math.abs(p.skew));
        out.grow = Math.max(out.grow, Math.min(p.sx, p.sy) - 1);
      }
    }
    return out;
  };
  const wave = sig('wave');
  const hop = sig('hop');
  const jelly = sig('jelly');
  const puff = sig('puff');
  assert.ok(wave.apart && wave.lift === 0 && wave.grow <= 0, 'wave: letters squash in turn, on the baseline');
  assert.ok(!hop.apart && hop.lift >= 140 && hop.lean === 0, 'hop: the word leaves the ground as one');
  assert.ok(jelly.lean >= 10 && jelly.lift === 0, 'jelly: leans, stays down');
  assert.ok(!puff.apart && puff.grow >= 0.06 && puff.lean === 0, 'puff: grows both ways as one (about its middle, see above)');
});

/** Share of letter i's largest `value` between t0 and t1 that `params`' sampled frames keep. */
function kept(params, i, t0, t1, value) {
  const motion = MOTIONS[params.variant];
  const best = (times) => Math.max(0, ...times.filter((t) => t >= t0 && t <= t1).map((t) => value(letterPose(t, i, 1, motion))));
  return best(frameTimes(params)) / best(Array.from({ length: 1601 }, (_, ms) => ms / 1000));
}

test('Firefox sampling keeps each variant\'s key poses', () => {
  const g = GECKO_MOTIONS;
  const takeOff = HOP.crouchTime + HOP.launchTime;
  const touchdown = takeOff + HOP.airTime;
  const hop = {
    crouch: [kept(g.hop, 0, 0, takeOff, (p) => 1 - p.sy), 0.85],
    lift: [kept(g.hop, 0, takeOff, touchdown, (p) => p.y), 0.95],
    landing: [kept(g.hop, 0, touchdown, touchdown + 0.15, (p) => 1 - p.sy), 0.95],
    rebound: [kept(g.hop, 0, touchdown, touchdown + 0.4, (p) => p.y), 0.9],
  };
  for (const [what, [share, min]] of Object.entries(hop)) assert.ok(share >= min, `hop ${what}: ${share.toFixed(2)} kept`);
  for (let i = 0; i < 4; i++) {
    for (const [t0, t1, side] of [[0, 0.3, 1], [0.25, 0.55, -1], [0.5, 0.8, 1]]) {
      const share = kept(g.jelly, i, t0, t1, (p) => side * p.skew);
      assert.ok(share >= 0.9, `jelly ${ORDER[i]} swing ${t0}-${t1} s: ${share.toFixed(2)} kept`);
    }
  }
  const puff = {
    full: [kept(g.puff, 0, 0.2, 0.47, (p) => p.sy - 1), 0.95],
    empty: [kept(g.puff, 0, 0.5, 0.7, (p) => 1 - p.sy), 0.8],
    overshoot: [kept(g.puff, 0, 0.65, 0.95, (p) => p.sy - 1), 0.8],
  };
  for (const [what, [share, min]] of Object.entries(puff)) assert.ok(share >= min, `puff ${what}: ${share.toFixed(2)} kept`);
});

// ---------- controller with a fake DOM ----------
// Tests that check one burst in isolation, down to "idle with no timers", turn
// the ambient beat off. The ambient beat tests further down cover it.
const NO_BEAT = { ambientEvery: null };

function fakeWorld({ reduced = false, hidden = false, readyState = 'complete', userAgent = CHROME_UA } = {}) {
  let clock = 0;
  let nextId = 1;
  const timers = new Map();
  const observers = new Set();
  let draws = 0;

  class El {
    constructor(tag) { this.tagName = tag; this.attrs = new Map(); this.parent = null; }
    get id() { return this.attrs.get('id') ?? ''; }
    set id(v) { this.attrs.set('id', v); }
    getAttribute(n) { return this.attrs.has(n) ? this.attrs.get(n) : null; }
    setAttribute(n, v) {
      const old = this.getAttribute(n);
      this.attrs.set(n, String(v));
      if (this === doc.documentElement) for (const o of observers) o.notify(n, old);
    }
    removeAttribute(n) { this.attrs.delete(n); }
    remove() { if (this.parent) this.parent.children.splice(this.parent.children.indexOf(this), 1); this.parent = null; }
  }
  const head = new El('head');
  head.children = [];
  head.appendChild = (el) => { head.children.push(el); el.parent = head; };
  head.querySelectorAll = (sel) => {
    assert.equal(sel, 'link[rel~="icon"]');
    return head.children.filter((el) => (el.getAttribute('rel') ?? '').split(/\s+/).includes('icon'));
  };
  const listeners = {};
  const winListeners = {};
  const doc = {
    head,
    documentElement: new El('html'),
    visibilityState: hidden ? 'hidden' : 'visible',
    readyState,
    getElementById: (id) => head.children.find((el) => el.id === id) ?? null,
    createElement(tag) {
      const el = new El(tag);
      if (tag === 'canvas') {
        el.getContext = () => ({ setTransform() {}, clearRect() {}, fill() {}, set fillStyle(v) {} });
        el.toDataURL = () => `data:image/png;base64,frame${++draws}`;
      }
      return el;
    },
    addEventListener: (type, fn) => { (listeners[type] ??= new Set()).add(fn); },
    removeEventListener: (type, fn) => listeners[type]?.delete(fn),
  };
  const mq = { matches: reduced, handlers: new Set(), addEventListener(_, fn) { this.handlers.add(fn); }, removeEventListener(_, fn) { this.handlers.delete(fn); } };
  class MO {
    constructor(cb) { this.cb = cb; }
    observe(target, opts) { assert.equal(target, doc.documentElement); this.filter = opts.attributeFilter; observers.add(this); }
    disconnect() { observers.delete(this); }
    notify(name, oldValue) { if (this.filter.includes(name)) this.cb([{ attributeName: name, oldValue }]); }
  }
  // Static icons from index.html.
  const svgIcon = doc.createElement('link');
  svgIcon.setAttribute('rel', 'icon');
  svgIcon.setAttribute('href', '/favicon-suph.svg');
  const pngIcon = doc.createElement('link');
  pngIcon.setAttribute('rel', 'icon');
  pngIcon.setAttribute('href', '/icons/favicon-32.png');
  const touch = doc.createElement('link');
  touch.setAttribute('rel', 'apple-touch-icon');
  head.appendChild(svgIcon);
  head.appendChild(pngIcon);
  head.appendChild(touch);

  const win = {
    devicePixelRatio: 2,
    matchMedia: () => mq,
    addEventListener: (type, fn) => { (winListeners[type] ??= new Set()).add(fn); },
    removeEventListener: (type, fn) => winListeners[type]?.delete(fn),
  };
  const env = {
    document: doc,
    window: win,
    userAgent,
    MutationObserver: MO,
    Path2D: class { constructor(d) { this.d = d; } },
    now: () => clock,
    setTimeout: (fn, ms) => { const id = nextId++; timers.set(id, { fn, at: clock + ms }); return id; },
    clearTimeout: (id) => timers.delete(id),
  };
  const href = () => doc.getElementById(LINK_ID)?.getAttribute('href') ?? null;
  const world = {
    env, doc, mq, svgIcon, pngIcon, touch, timers, observers,
    /** Every icon change made by a timer: { at, href }. */
    changes: [],
    get draws() { return draws; },
    get now() { return clock; },
    link: () => doc.getElementById(LINK_ID),
    href,
    /** Advances the clock, firing due timers in order. Returns hrefs set along the way. */
    advance(ms) {
      const end = clock + ms;
      const seen = [];
      for (;;) {
        const due = [...timers.entries()].filter(([, t]) => t.at <= end).sort((a, b) => a[1].at - b[1].at)[0];
        if (!due) break;
        timers.delete(due[0]);
        clock = Math.max(clock, due[1].at);
        const before = href();
        due[1].fn();
        const after = href();
        if (after && after !== before) world.changes.push({ at: clock, href: after });
        if (after && seen.at(-1) !== after) seen.push(after);
      }
      clock = end;
      return seen;
    },
    setVisibility(state) {
      doc.visibilityState = state;
      for (const fn of listeners.visibilitychange ?? []) fn();
    },
    /** The document finishes loading: readyState "complete", then load and pageshow on window. */
    finishLoading() {
      doc.readyState = 'complete';
      for (const type of ['load', 'pageshow']) for (const fn of [...(winListeners[type] ?? [])]) fn({ type, persisted: false });
    },
    setDocked(value) { doc.documentElement.setAttribute('data-docked', value); },
    listenerCount: () => [listeners, winListeners].reduce((n, map) => n + Object.values(map).reduce((m, s) => m + s.size, 0), 0),
  };
  return world;
}

test('first load plays one burst, then goes idle with no timers', (t) => {
  const w = fakeWorld();
  const teardown = initFavicon({ env: w.env, ...NO_BEAT });
  t.after(teardown);
  assert.equal(w.link(), null, 'nothing is touched before the first burst');
  assert.equal(w.timers.size, 1, 'only the load delay is scheduled');
  assert.equal(_faviconState().fps, JIGGLE.fps, 'Chromium: full 30 fps sampling');
  const hrefs = w.advance(450 + BURST_MS + 200);
  assert.ok(w.link(), 'dynamic link created');
  assert.equal(w.link().getAttribute('rel'), 'icon');
  assert.equal(w.link().getAttribute('type'), 'image/png');
  assert.ok(hrefs.length >= frameCount() - 2, `many frames shown (${hrefs.length})`);
  assert.equal(hrefs[0], hrefs.at(-1), 'starts and ends on the cached rest frame');
  assert.equal(w.timers.size, 0, 'idle: no loop left running');
  assert.equal(_faviconState().playing, false);
  assert.equal(w.svgIcon.getAttribute('rel'), 'x-suph-parked-icon', 'static icons parked while JS owns the icon');
  assert.equal(w.touch.getAttribute('rel'), 'apple-touch-icon', 'apple-touch-icon untouched');
  // A second burst at the same strength reuses cached frames.
  const drawsBefore = w.draws;
  assert.equal(jiggle(0.85), true);
  w.advance(BURST_MS + 100);
  assert.equal(w.draws, drawsBefore);
});

test('docking triggers a burst only on the false -> true transition', (t) => {
  const w = fakeWorld();
  const root = w.doc.documentElement;
  root.setAttribute('data-docked', 'false');
  const teardown = initFavicon({ env: w.env, loadDelay: null });
  t.after(teardown);
  assert.equal(w.timers.size, 0);
  root.setAttribute('data-docked', 'false');
  assert.equal(w.timers.size, 0, 'no burst while undocked');
  root.setAttribute('data-docked', 'true');
  assert.equal(_faviconState().playing, true, 'landing starts a burst');
  w.advance(BURST_MS + 100);
  root.setAttribute('data-docked', 'true'); // Wordmark re-sets the same value
  assert.equal(_faviconState().playing, false, 'same value again does nothing');
  root.setAttribute('data-docked', 'false');
  w.advance(1000);
  root.setAttribute('data-docked', 'true');
  assert.equal(_faviconState().playing, true, 'docking again jiggles again');
});

test('a page that renders already docked is not a landing: the first data-docked value is a baseline', (t) => {
  // Deep link or 404: Wordmark mounts docked and writes "true" in its first
  // layout effect, shortly after initFavicon() ran with the attribute unset.
  const w = fakeWorld();
  const teardown = initFavicon({ env: w.env, ...NO_BEAT });
  t.after(teardown);
  w.advance(60);
  w.setDocked('true');
  assert.equal(_faviconState().playing, false, 'null -> "true" is not a dock');
  assert.equal(w.link(), null, 'icon untouched');
  assert.equal(_faviconState().loadScheduled, true, 'the load burst is still owed');
  w.advance(450 - 60 - 1);
  assert.equal(w.link(), null, 'nothing before loadDelay');
  w.advance(1);
  assert.equal(_faviconState().playing, true, 'the load burst plays on time');
  w.advance(BURST_MS + 5000);
  assert.equal(w.changes[0].at, 450);
  assert.equal(w.changes.at(-1).at, 450 + BURST_MS, 'exactly one burst, the load burst');
  assert.equal(w.changes[0].href, w.changes.at(-1).href);
  assert.equal(w.timers.size, 0);
  // Once there is a baseline, a real false -> true landing still jiggles.
  w.setDocked('false');
  w.setDocked('true');
  assert.equal(_faviconState().playing, true);
});

test('home page: the first "false" is the baseline and a later landing jiggles', (t) => {
  const w = fakeWorld();
  const teardown = initFavicon({ env: w.env, loadDelay: null });
  t.after(teardown);
  w.setDocked('false');
  assert.equal(_faviconState().playing, false);
  w.setDocked('true');
  assert.equal(_faviconState().playing, true);
});

test('docking after load but before the load burst plays once, not twice', (t) => {
  const w = fakeWorld();
  w.setDocked('false');
  const teardown = initFavicon({ env: w.env, ...NO_BEAT });
  t.after(teardown);
  w.advance(100);
  w.setDocked('true');
  assert.equal(_faviconState().playing, true, 'dock burst');
  assert.equal(_faviconState().loadScheduled, false, 'it doubles as the load burst');
  w.advance(BURST_MS + 5000);
  assert.equal(w.changes.at(-1).at, 100 + BURST_MS, 'no second burst after it');
  assert.equal(w.timers.size, 0);
});

test('nothing plays or changes before the page has loaded; the load burst is timed from pageshow', (t) => {
  const w = fakeWorld({ readyState: 'interactive' }); // Module scripts run before load.
  const teardown = initFavicon({ env: w.env });
  t.after(teardown);
  assert.equal(_faviconState().loaded, false);
  assert.equal(w.timers.size, 0, 'no load timer yet');
  assert.equal(jiggle(), false, 'a burst requested before load is refused');
  w.setDocked('false');
  w.setDocked('true'); // A real landing, but before load.
  assert.equal(_faviconState().playing, false, 'docking before load does nothing');
  w.advance(5000);
  assert.equal(w.link(), null, 'icon element untouched before load');
  assert.equal(w.svgIcon.getAttribute('rel'), 'icon', 'static icons not parked');
  assert.equal(w.changes.length, 0);
  w.finishLoading();
  assert.equal(_faviconState().loaded, true);
  assert.equal(w.timers.size, 1, 'load burst scheduled from pageshow');
  assert.equal(w.listenerCount(), 1, 'pageshow listener removed (visibilitychange stays)');
  w.advance(449);
  assert.equal(w.link(), null);
  w.advance(1);
  assert.equal(_faviconState().playing, true, 'load burst 450 ms after pageshow');
  assert.equal(w.changes[0].at, 5450);
  w.advance(BURST_MS);
  assert.equal(jiggle(), true, 'manual bursts work after load');
});

test('teardown before load removes the pageshow listener', () => {
  const w = fakeWorld({ readyState: 'loading' });
  const teardown = initFavicon({ env: w.env });
  assert.equal(w.listenerCount(), 2, 'visibilitychange + pageshow');
  teardown();
  assert.equal(w.listenerCount(), 0);
  w.finishLoading();
  assert.equal(w.timers.size, 0);
  assert.equal(w.link(), null);
});

test('on Firefox the burst is sampled at 8 fps: one icon change per 125 ms or more', (t) => {
  const w = fakeWorld({ userAgent: FIREFOX_UA });
  const teardown = initFavicon({ env: w.env, ...NO_BEAT });
  t.after(teardown);
  assert.equal(_faviconState().fps, GECKO_JIGGLE.fps);
  assert.equal(_faviconState().frames, frameCount(GECKO_JIGGLE));
  w.advance(450 + BURST_MS + 500);
  const at = w.changes.map((c) => c.at);
  assert.equal(at.length, frameCount(GECKO_JIGGLE), 'every sampled frame is set once');
  assert.equal(at.at(-1) - at[0], BURST_MS, 'same duration as elsewhere');
  for (let i = 1; i < at.length; i++) assert.ok(at[i] - at[i - 1] >= 125 - 1e-6, `gap ${at[i] - at[i - 1]} ms`);
  assert.equal(w.changes[0].href, w.changes.at(-1).href, 'rest to rest');
  assert.equal(w.timers.size, 0);
});

test('hiding stops a burst at rest; returning after a while jiggles, a quick flick does not', (t) => {
  const w = fakeWorld();
  const teardown = initFavicon({ env: w.env });
  t.after(teardown);
  w.advance(450);
  const rest = w.href();
  assert.ok(rest, 'the load burst starts on the rest frame');
  w.advance(200);
  assert.equal(_faviconState().playing, true);
  assert.notEqual(w.href(), rest, 'a squashed mid-burst frame is showing');
  w.setVisibility('hidden');
  assert.equal(_faviconState().playing, false);
  assert.equal(w.href(), rest, 'the hidden tab is left on the rest frame');
  assert.equal(w.timers.size, 0, 'no background timers');
  assert.equal(jiggle(), false, 'no manual bursts while hidden');
  w.advance(500);
  w.setVisibility('visible');
  assert.equal(_faviconState().playing, false, 'short absence: no burst');
  w.setVisibility('hidden');
  w.advance(5000);
  w.setVisibility('visible');
  assert.equal(_faviconState().playing, true, 'real return: burst');
});

test('a tab opened in the background plays its load burst when first shown', (t) => {
  const w = fakeWorld({ hidden: true });
  const teardown = initFavicon({ env: w.env });
  t.after(teardown);
  assert.equal(w.timers.size, 0);
  w.advance(10000);
  assert.equal(w.link(), null);
  w.setVisibility('visible');
  assert.equal(_faviconState().playing, true);
});

test('reduced motion: static icon, no timers, observers or listeners', (t) => {
  const w = fakeWorld({ reduced: true });
  const teardown = initFavicon({ env: w.env });
  t.after(teardown);
  w.doc.documentElement.setAttribute('data-docked', 'true');
  w.advance(5000);
  assert.equal(jiggle(), false);
  assert.equal(w.link(), null);
  assert.equal(w.timers.size, 0);
  assert.equal(w.observers.size, 0);
  assert.equal(w.listenerCount(), 0);
  assert.equal(w.svgIcon.getAttribute('rel'), 'icon');
  // Switching the preference off arms the triggers (without a late load burst).
  w.mq.matches = false;
  for (const fn of w.mq.handlers) fn();
  assert.equal(w.observers.size, 1);
  assert.equal(w.timers.size, 0);
  // And back on mid-burst stops it, on the rest frame.
  assert.equal(jiggle(), true);
  const rest = w.href();
  w.advance(200);
  assert.notEqual(w.href(), rest, 'mid-burst');
  w.mq.matches = true;
  for (const fn of w.mq.handlers) fn();
  assert.equal(w.href(), rest, 'snapped back to the rest frame');
  assert.equal(_faviconState().playing, false);
  assert.equal(w.timers.size, 0);
  assert.equal(w.observers.size, 0);
});

test('teardown stops everything and restores the static icons', () => {
  const w = fakeWorld();
  const teardown = initFavicon({ env: w.env });
  assert.equal(initFavicon({ env: w.env }), teardown, 'idempotent');
  w.advance(450 + 100);
  assert.equal(_faviconState().playing, true);
  teardown();
  assert.equal(w.timers.size, 0);
  assert.equal(w.observers.size, 0);
  assert.equal(w.listenerCount(), 0);
  assert.equal(w.mq.handlers.size, 0);
  assert.equal(w.link(), null, 'dynamic link removed');
  assert.equal(w.svgIcon.getAttribute('rel'), 'icon');
  assert.equal(w.pngIcon.getAttribute('rel'), 'icon');
  assert.equal(jiggle(), false);
  assert.equal(_faviconState(), null);
  teardown(); // Safe twice.
});

test('an existing #favicon-dynamic is reused and restored', () => {
  const w = fakeWorld();
  const own = w.doc.createElement('link');
  own.id = LINK_ID;
  own.setAttribute('rel', 'icon');
  own.setAttribute('type', 'image/svg+xml');
  own.setAttribute('href', '/favicon-suph.svg');
  w.doc.head.appendChild(own);
  const teardown = initFavicon({ env: w.env });
  w.advance(450 + 100);
  assert.equal(w.link(), own);
  assert.match(own.getAttribute('href'), /^data:image\/png/);
  teardown();
  assert.equal(own.getAttribute('href'), '/favicon-suph.svg');
  assert.equal(own.getAttribute('type'), 'image/svg+xml');
  assert.equal(w.doc.head.children.includes(own), true);
});

// ---------- variants in the controller ----------
test('the variant option picks the motion and its Firefox twin; unknown names fall back to the default', () => {
  const cases = [
    [undefined, CHROME_UA, DEFAULT_VARIANT, false],
    ['jelly', CHROME_UA, 'jelly', false],
    ['puff', FIREFOX_UA, 'puff', true],
    ['wave', FIREFOX_UA, 'wave', true],
    ['hop', SAFARI_UA, 'hop', false],
    ['bounce', CHROME_UA, DEFAULT_VARIANT, false],
  ];
  for (const [variant, userAgent, expected, gecko] of cases) {
    const w = fakeWorld({ userAgent });
    const teardown = initFavicon({ env: w.env, variant });
    const state = _faviconState();
    const params = motionFor(expected, { gecko });
    assert.equal(state.variant, expected, `variant ${variant}`);
    assert.equal(state.fps, params.fps);
    assert.equal(state.frames, frameCount(params));
    w.advance(450 + BURST_MS + 100);
    assert.equal(w.changes.length, state.frames, `${expected}: every frame shown once, rest to rest`);
    assert.equal(w.changes[0].href, w.changes.at(-1).href);
    teardown();
  }
});

test('the renderer keeps letters on the tile: drawn source-atop over it, then back to source-over', () => {
  const fills = [];
  const ctx = {
    globalCompositeOperation: 'source-over',
    fillStyle: '',
    setTransform() {},
    clearRect() {},
    fill(path) { fills.push({ op: this.globalCompositeOperation, color: this.fillStyle, d: path.d }); },
  };
  const env = {
    document: { createElement: () => ({ getContext: () => ctx, toDataURL: () => 'data:image/png;base64,x' }) },
    Path2D: class { constructor(d) { this.d = d; } },
  };
  const renderer = createRenderer(env, 32);
  assert.equal(renderer.draw(framePoses(0.3, 1, HOP)), 'data:image/png;base64,x');
  assert.deepEqual(fills.map((f) => f.op), ['source-over', 'source-atop', 'source-atop', 'source-atop', 'source-atop']);
  assert.deepEqual(fills.map((f) => f.color), [TILE_COLOR, RED, RED, RED, RED]);
  assert.deepEqual(fills.slice(1).map((f) => f.d), SUPH.map((l) => l.path));
  assert.equal(ctx.globalCompositeOperation, 'source-over', 'left as found');
});

// ---------- ambient beat ----------
/** Stand-in for Math.random: the given values in turn, then the last one forever. */
const randoms = (...values) => {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
};
/** Times (ms) at which bursts ended: each one ends by setting the rest frame again. */
const burstEnds = (w) => w.changes.slice(1).filter((c) => c.href === w.changes[0].href).map((c) => c.at);

test('ambient beat: after the first burst, another plays every 15 s, give or take 3 s, while the tab stays visible', (t) => {
  assert.equal(FAVICON_DEFAULTS.ambientEvery, 15000);
  assert.equal(FAVICON_DEFAULTS.ambientJitter, 3000);
  const w = fakeWorld();
  w.env.random = randoms(0.5, 0, 0.9999999, 0.25);
  const teardown = initFavicon({ env: w.env });
  t.after(teardown);
  assert.equal(_faviconState().ambientScheduled, false, 'nothing ticks before the first burst');
  w.advance(450 + BURST_MS);
  assert.equal(_faviconState().playing, false);
  assert.equal(_faviconState().ambientScheduled, true);
  assert.equal(w.timers.size, 1, 'idle: the only timer is the next beat');
  w.advance(15000 - 1);
  assert.equal(_faviconState().playing, false, 'not a moment early');
  w.advance(1);
  assert.equal(_faviconState().playing, true, 'the first beat, 15 s after the load burst ended (no jitter drawn)');
  assert.equal(_faviconState().ambientScheduled, false, 'no beat is pending while a burst plays');
  w.advance(120000);
  const ends = burstEnds(w);
  assert.equal(ends[0], 450 + BURST_MS, 'the load burst');
  const waits = ends.slice(1).map((end, k) => end - BURST_MS - ends[k]);
  assert.deepEqual(waits.slice(0, 4).map(Math.round), [15000, 12000, 18000, 13500]);
  for (const wait of waits) assert.ok(wait >= 12000 - 1e-6 && wait <= 18000 + 1e-6, `wait ${wait} ms`);
  assert.ok(ends.length >= 8, `${ends.length} bursts in two minutes`);
});

test('ambient beat: gone the moment the tab is hidden, never runs in the background, and counts again on return', (t) => {
  const w = fakeWorld();
  w.env.random = () => 0.5;
  const teardown = initFavicon({ env: w.env });
  t.after(teardown);
  w.advance(450 + BURST_MS + 5000); // 5 s into the first wait.
  w.setVisibility('hidden');
  assert.equal(_faviconState().ambientScheduled, false);
  assert.equal(w.timers.size, 0, 'a hidden tab has no timers');
  w.advance(500);
  w.setVisibility('visible'); // A quick flick: no return burst, but the beat counts again from now.
  assert.equal(_faviconState().playing, false);
  assert.equal(_faviconState().ambientScheduled, true);
  w.advance(15000 - 1);
  assert.equal(_faviconState().playing, false, 'the old beat, due 10 s after the flick, is gone');
  w.advance(1);
  assert.equal(_faviconState().playing, true, '15 s after the tab came back');
  w.advance(200);
  w.setVisibility('hidden'); // Hidden mid-burst: it stops at rest, and nothing is left to wake up.
  assert.equal(_faviconState().playing, false);
  assert.equal(w.timers.size, 0);
  const shown = w.changes.length;
  w.advance(10 * 60 * 1000);
  assert.equal(w.changes.length, shown, 'ten minutes in the background: not one frame');
  assert.equal(w.timers.size, 0);
  w.setVisibility('visible'); // A real return: its burst, then the beat.
  assert.equal(_faviconState().playing, true);
  w.advance(BURST_MS);
  assert.equal(_faviconState().ambientScheduled, true);
});

test('no ambient beat before load, under reduced motion, after teardown, or when it is turned off', () => {
  {
    const w = fakeWorld({ readyState: 'loading' });
    const teardown = initFavicon({ env: w.env });
    w.advance(120000);
    assert.equal(w.timers.size, 0, 'before load');
    assert.equal(w.changes.length, 0);
    teardown();
  }
  {
    const w = fakeWorld({ reduced: true });
    const teardown = initFavicon({ env: w.env });
    w.advance(120000);
    assert.equal(w.timers.size, 0, 'reduced motion');
    assert.equal(w.changes.length, 0);
    teardown();
  }
  {
    // Reduced motion switched on while a beat waits clears it; switched off again, the beat comes back.
    const w = fakeWorld();
    const teardown = initFavicon({ env: w.env });
    w.advance(450 + BURST_MS);
    assert.equal(_faviconState().ambientScheduled, true);
    w.mq.matches = true;
    for (const fn of w.mq.handlers) fn();
    assert.equal(w.timers.size, 0);
    const shown = w.changes.length;
    w.advance(120000);
    assert.equal(w.changes.length, shown);
    w.mq.matches = false;
    for (const fn of w.mq.handlers) fn();
    assert.equal(_faviconState().ambientScheduled, true, 'the beat resumes');
    assert.equal(w.timers.size, 1);
    teardown();
    assert.equal(w.timers.size, 0, 'teardown clears it');
    w.advance(120000);
    assert.equal(w.changes.length, shown);
  }
  for (const off of [null, 0]) {
    const w = fakeWorld();
    const teardown = initFavicon({ env: w.env, ambientEvery: off });
    w.advance(450 + BURST_MS + 120000);
    assert.equal(w.timers.size, 0, `ambientEvery: ${off}`);
    assert.equal(burstEnds(w).length, 1, 'only the load burst');
    teardown();
  }
});

test('any other burst restarts the ambient count, and a beat never comes sooner than the 600 ms cooldown', () => {
  {
    const w = fakeWorld();
    w.env.random = () => 0.5;
    w.setDocked('false');
    const teardown = initFavicon({ env: w.env });
    w.advance(450 + BURST_MS + 10000); // 10 s into the 15 s wait.
    w.setDocked('true');
    assert.equal(_faviconState().playing, true, 'docking plays');
    assert.equal(_faviconState().ambientScheduled, false);
    w.advance(BURST_MS + 15000 - 1);
    assert.equal(_faviconState().playing, false, 'the beat that was due 5 s after docking did not play');
    w.advance(1);
    assert.equal(_faviconState().playing, true, 'the next beat comes 15 s after the dock burst');
    w.advance(BURST_MS + 3000);
    assert.equal(jiggle(), true); // A manual burst restarts the count too.
    w.advance(BURST_MS + 15000 - 1);
    assert.equal(_faviconState().playing, false);
    w.advance(1);
    assert.equal(_faviconState().playing, true);
    teardown();
  }
  {
    const w = fakeWorld();
    const teardown = initFavicon({ env: w.env, ambientEvery: 1, ambientJitter: 0 });
    w.advance(450 + 8 * (BURST_MS + 600));
    const ends = burstEnds(w);
    assert.ok(ends.length >= 6);
    for (let k = 1; k < ends.length; k++) assert.equal(ends[k] - BURST_MS - ends[k - 1], FAVICON_DEFAULTS.cooldown);
    teardown();
  }
});
