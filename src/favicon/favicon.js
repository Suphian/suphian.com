/**
 * Animated SUPH favicon. Framework-free: call initFavicon() once (it returns a
 * teardown) and jiggle(strength) for manual triggers.
 *
 * Chromium and Safari never animate SVG or GIF favicons, so the only portable
 * animation is redrawing a small canvas and swapping <link rel="icon"> to its
 * PNG data URL. Hidden tabs get ~1 Hz timers and no rAF, so the favicon plays
 * short bursts only while the tab is visible:
 *   - first load (or the first time a tab opened in the background is shown),
 *   - the moment SUPH docks in the header (<html data-docked> going from
 *     "false" to "true"; the first value Wordmark writes is only a baseline,
 *     because after a restored scroll position SUPH is docked from its first render),
 *   - returning to the tab after it has been hidden for a while,
 *   - an ambient beat: while the tab stays visible, another burst about every
 *     15 s (ambientEvery, give or take ambientJitter so it never ticks like a
 *     clock), counted from the end of the last burst. It starts after the
 *     first burst, stops the moment the tab is hidden, and any other burst
 *     restarts the count.
 * Between bursts the only thing running is that one ambient timer. A hidden
 * tab has no timers and no loop at all.
 * prefers-reduced-motion: nothing is touched; the static icon from index.html stays.
 *
 * The motion is one of four variants from frame-math.js: 'wave', 'hop',
 * 'jelly' or 'puff'. DEFAULT_VARIANT there picks the site's, and
 * initFavicon({ variant }) overrides it.
 *
 * Nothing moves before the page has loaded (window `pageshow`, which follows
 * `load`). Chromium drops favicon changes until the load event has finished,
 * and Firefox stores any icon set before pageshow as the page's favicon in
 * bookmarks and history, which could be a mid-jiggle frame. So the first-load
 * burst is timed from pageshow, and docking or jiggle() before it does nothing.
 *
 * Firefox shows at most about 10 icon changes a second (see GECKO_JIGGLE), so
 * on Gecko the same burst is sampled at 8 fps (the variant's GECKO_ twin);
 * elsewhere it runs at 30 fps.
 *
 * The icon element is only taken over at the first burst: other rel="icon"
 * links are parked (their rel is swapped out, then restored on teardown) so
 * browsers can't prefer them, and #favicon-dynamic is created or reused.
 */
import {
  DEFAULT_VARIANT, REST_POSE, VARIANT_NAMES, burstDuration, clampStrength, frameIndexAt, framePoses, frameTimes, motionFor,
} from './frame-math.js';
import { RED, SUPH, TILE_COLOR, iconLayout, letterMatrix, roundedRectPath } from './layout.js';

export { DEFAULT_VARIANT, VARIANT_NAMES };
export const LINK_ID = 'favicon-dynamic';
const PARKED_REL = 'x-suph-parked-icon';
const REST = [REST_POSE, REST_POSE, REST_POSE, REST_POSE];

export const FAVICON_DEFAULTS = {
  variant: DEFAULT_VARIANT, // The motion: 'wave', 'hop', 'jelly' or 'puff' (frame-math.js). Unknown names fall back to DEFAULT_VARIANT.
  loadDelay: 450, // ms after the page has loaded (pageshow) before the first-load burst.
  returnAfter: 2000, // ms a tab must stay hidden before coming back earns a burst.
  ambientEvery: 15000, // ms from the end of one burst to the next ambient one while the tab stays visible. null or 0 turns the beat off.
  ambientJitter: 3000, // Each ambient wait is ambientEvery give or take up to this many ms (12 to 18 s by default).
  cooldown: 600, // ms between automatic bursts, so scrubbing the dock or alt-tabbing can't spam it.
  strengths: { load: 0.85, dock: 1, visible: 0.7, ambient: 0.7 },
  maxCachedFrames: 160, // Data URLs kept per page (one burst is ~36 frames).
  params: null, // Frame sampling: null picks the variant's GECKO_ twin on Firefox and its 30 fps params elsewhere.
};

let active = null;

/** Starts the favicon. Idempotent: a second call returns the first call's teardown. */
export function initFavicon(options = {}) {
  if (active) return active.teardown;
  const env = resolveEnv(options.env);
  if (!env) return () => {};
  active = createController(env, { ...FAVICON_DEFAULTS, ...options, strengths: { ...FAVICON_DEFAULTS.strengths, ...options.strengths } });
  return active.teardown;
}

/**
 * Plays one burst now (0..1.6, default 1). Returns false when it can't: not
 * started, the page hasn't finished loading, the tab is hidden, or reduced motion.
 */
export function jiggle(strength = 1) {
  return active ? active.play(clampStrength(strength)) : false;
}

function resolveEnv(env = {}) {
  const g = globalThis;
  const out = {
    document: env.document ?? g.document,
    window: env.window ?? g.window,
    MutationObserver: env.MutationObserver ?? g.MutationObserver,
    Path2D: env.Path2D ?? g.Path2D,
    userAgent: env.userAgent ?? g.navigator?.userAgent ?? '',
    now: env.now ?? (() => g.performance?.now?.() ?? Date.now()),
    setTimeout: env.setTimeout ?? ((fn, ms) => g.setTimeout(fn, ms)),
    clearTimeout: env.clearTimeout ?? ((id) => g.clearTimeout(id)),
    random: env.random ?? Math.random,
  };
  if (!out.document?.head || !out.Path2D) return null;
  return out;
}

/** Gecko (desktop and Android Firefox) says "Gecko/<version>"; WebKit and Blink say "like Gecko". */
export const isGecko = (userAgent = '') => /\bGecko\/\d/.test(userAgent);

/** Draws SUPH poses on a tile and returns PNG data URLs. */
export function createRenderer(env, size) {
  const canvas = env.document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  const layout = iconLayout(size, 'favicon');
  const tile = new env.Path2D(roundedRectPath(0, 0, size, size, layout.radius));
  const letters = SUPH.map((l) => new env.Path2D(l.path));
  return {
    size,
    draw(poses) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, size, size);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = TILE_COLOR;
      ctx.fill(tile);
      // Letters only land on the tile: anything a squash, lean or lift pushes
      // past its edge is cut there, never left as red specks on the tab strip.
      // (The Node renderer in raster-icon.mjs clips the same way.)
      ctx.globalCompositeOperation = 'source-atop';
      ctx.fillStyle = RED;
      poses.forEach((pose, i) => {
        ctx.setTransform(...letterMatrix(i, pose, layout));
        ctx.fill(letters[i], 'evenodd');
      });
      ctx.globalCompositeOperation = 'source-over';
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      return canvas.toDataURL('image/png');
    },
  };
}

/** Icon pixels: 32 on 1x-2x screens (a 2:1 downsample for 16 px tabs), up to 64 on 4x. */
export const iconSize = (dpr = 1) => 16 * Math.min(4, Math.max(2, Math.ceil(Number(dpr) || 1)));

function createController(env, opts) {
  const { document: doc, window: win } = env;
  const root = doc.documentElement;
  const variant = VARIANT_NAMES.includes(opts.variant) ? opts.variant : DEFAULT_VARIANT;
  const params = opts.params ?? motionFor(variant, { gecko: isGecko(env.userAgent) });
  const times = frameTimes(params);
  const n = times.length;
  const cache = new Map();
  let renderer = null;
  let link = null;
  let created = false;
  let original = null; // { href, type, rel } of a reused #favicon-dynamic
  let parked = [];
  let burst = null; // { strength, start, index, timer }
  let lastAutoStart = -Infinity;
  let hiddenAt = doc.visibilityState === 'hidden' ? env.now() : null;
  let loaded = false;
  let waitingForLoad = false;
  let pendingLoad = false; // The load burst is owed to the next time the tab is shown.
  let loadTimer = null;
  let observer = null;
  let lastDocked = null;
  let ambientTimer = null;
  let beating = false; // The ambient beat runs once the first burst has played.
  let armed = false;
  let dead = false;

  const reducedQuery = win?.matchMedia?.('(prefers-reduced-motion: reduce)') ?? null;
  const reduced = () => Boolean(reducedQuery?.matches);
  // readyState turns "complete" in the task that then fires load and pageshow.
  // Once we're listening for pageshow, only the event itself counts.
  function isLoaded() {
    if (!loaded && !waitingForLoad) loaded = (doc.readyState ?? 'complete') === 'complete';
    return loaded;
  }

  // ---------- icon element ----------
  function takeOver() {
    if (link) return true;
    renderer = createRenderer(env, iconSize(win?.devicePixelRatio));
    if (!renderer) return false;
    link = doc.getElementById(LINK_ID);
    if (link) {
      original = { href: link.getAttribute('href'), type: link.getAttribute('type'), rel: link.getAttribute('rel') };
    } else {
      link = doc.createElement('link');
      link.id = LINK_ID;
      created = true;
    }
    for (const el of doc.head.querySelectorAll('link[rel~="icon"]')) {
      if (el === link) continue;
      parked.push({ el, rel: el.getAttribute('rel') });
      el.setAttribute('rel', PARKED_REL);
    }
    link.setAttribute('rel', 'icon');
    link.setAttribute('type', 'image/png');
    link.removeAttribute?.('sizes');
    if (created) doc.head.appendChild(link);
    setHref(frameUrl(0, 0));
    return true;
  }

  function release() {
    if (!link) return;
    for (const { el, rel } of parked) el.setAttribute('rel', rel);
    parked = [];
    if (created) link.remove();
    else if (original) {
      for (const [name, value] of Object.entries(original)) {
        if (value == null) link.removeAttribute(name);
        else link.setAttribute(name, value);
      }
    }
    link = null;
    renderer = null;
    created = false;
    original = null;
    cache.clear();
  }

  function setHref(url) {
    if (link && link.getAttribute('href') !== url) link.setAttribute('href', url);
  }

  /** Data URL for frame `index` of a burst at `strength` (the rest frame is shared). */
  function frameUrl(strength, index) {
    const rest = strength === 0 || index === 0 || index === n - 1;
    const key = rest ? 'rest' : `${strength.toFixed(3)}:${index}`;
    let url = cache.get(key);
    if (!url) {
      if (cache.size >= opts.maxCachedFrames) cache.clear();
      url = renderer.draw(rest ? REST : framePoses(times[index], strength, params));
      cache.set(key, url);
    }
    return url;
  }

  // ---------- bursts ----------
  function play(strength = 1, { auto = false } = {}) {
    if (dead || reduced() || !isLoaded() || doc.visibilityState === 'hidden' || !(strength > 0)) return false;
    const now = env.now();
    if (auto && now - lastAutoStart < opts.cooldown) return false;
    if (!takeOver()) return false;
    if (auto) lastAutoStart = now;
    stop(false);
    cancelAmbient(); // Counted again from the end of this burst.
    beating = true;
    burst = { strength, start: now, index: -1, timer: null };
    tick();
    return true;
  }

  function tick() {
    if (!burst) return;
    const elapsedMs = env.now() - burst.start;
    const index = frameIndexAt(elapsedMs / 1000, params, times);
    if (index !== burst.index) {
      burst.index = index;
      setHref(frameUrl(burst.strength, index));
    }
    if (index >= n - 1) {
      burst = null; // At rest; the only timer left is the next ambient beat.
      scheduleAmbient();
      return;
    }
    burst.timer = env.setTimeout(tick, Math.max(4, times[index + 1] * 1000 - elapsedMs));
  }

  /** Cancels a running burst; with toRest, snaps the icon to the rest frame. */
  function stop(toRest = true) {
    if (!burst) return;
    if (burst.timer != null) env.clearTimeout(burst.timer);
    burst = null;
    if (toRest && link) setHref(frameUrl(0, 0));
  }

  // ---------- triggers ----------
  /**
   * Ambient beat: the next burst ambientEvery ms (give or take ambientJitter)
   * from now. Only while armed, visible and after the first burst, and never
   * sooner than the cooldown.
   */
  function scheduleAmbient() {
    cancelAmbient();
    if (!beating || !armed || dead || reduced() || !(opts.ambientEvery > 0) || doc.visibilityState === 'hidden') return;
    const jitter = opts.ambientJitter > 0 ? opts.ambientJitter * (2 * env.random() - 1) : 0;
    ambientTimer = env.setTimeout(onAmbient, Math.max(opts.cooldown, opts.ambientEvery + jitter));
  }

  function cancelAmbient() {
    if (ambientTimer != null) env.clearTimeout(ambientTimer);
    ambientTimer = null;
  }

  function onAmbient() {
    ambientTimer = null;
    // Refused (say, within the cooldown of another burst): try again next beat.
    if (!play(opts.strengths.ambient, { auto: true })) scheduleAmbient();
  }

  function scheduleLoadBurst() {
    if (opts.loadDelay == null || loadTimer != null || pendingLoad) return;
    if (doc.visibilityState === 'hidden') {
      pendingLoad = true; // Loaded in a background tab: play when first shown.
      return;
    }
    loadTimer = env.setTimeout(() => {
      loadTimer = null;
      play(opts.strengths.load, { auto: true });
    }, opts.loadDelay);
  }

  function cancelLoadBurst() {
    if (loadTimer != null) env.clearTimeout(loadTimer);
    loadTimer = null;
    pendingLoad = false;
  }

  function onPageShow() {
    stopWaitingForLoad();
    loaded = true;
    if (armed) scheduleLoadBurst();
  }

  function stopWaitingForLoad() {
    if (!waitingForLoad) return;
    waitingForLoad = false;
    win.removeEventListener('pageshow', onPageShow);
  }

  function onVisibility() {
    if (doc.visibilityState === 'hidden') {
      hiddenAt = env.now();
      if (loadTimer != null) {
        // Hidden before the load burst: owe it to the next time the tab is shown.
        env.clearTimeout(loadTimer);
        loadTimer = null;
        pendingLoad = true;
      }
      stop(true); // No 1 Hz half-jiggles in the background.
      cancelAmbient(); // And no ambient beat: a hidden tab has no timers at all.
      return;
    }
    const away = hiddenAt == null ? 0 : env.now() - hiddenAt;
    hiddenAt = null;
    if (pendingLoad) {
      pendingLoad = false;
      play(opts.strengths.load, { auto: true });
    } else if (away >= opts.returnAfter) {
      play(opts.strengths.visible, { auto: true });
    }
    if (!burst) scheduleAmbient(); // A quick flick back: the beat restarts its count.
  }

  function onMutation() {
    const docked = root.getAttribute('data-docked');
    const previous = lastDocked;
    lastDocked = docked;
    // The first value is only a baseline (Wordmark's first render, docked from
    // the start after a restored scroll position, or on an unknown URL for the
    // render before it redirects home). Only a later false -> true change is
    // SUPH actually landing in the header.
    if (previous == null || docked !== 'true' || previous === 'true') return;
    // Before load the load burst covers this moment (play() would refuse anyway).
    if (!isLoaded()) return;
    if (play(opts.strengths.dock, { auto: true })) cancelLoadBurst(); // This burst doubles as the load burst.
  }

  function arm() {
    if (armed || dead) return;
    armed = true;
    doc.addEventListener('visibilitychange', onVisibility);
    if (env.MutationObserver && root) {
      lastDocked = root.getAttribute('data-docked');
      observer = new env.MutationObserver(onMutation);
      observer.observe(root, { attributes: true, attributeFilter: ['data-docked'] });
    }
    if (isLoaded()) {
      scheduleLoadBurst();
      scheduleAmbient(); // Motion allowed again after an earlier burst: resume the beat.
    } else if (win?.addEventListener) {
      waitingForLoad = true;
      win.addEventListener('pageshow', onPageShow);
    }
  }

  function disarm() {
    if (!armed) return;
    armed = false;
    doc.removeEventListener('visibilitychange', onVisibility);
    observer?.disconnect();
    observer = null;
    stopWaitingForLoad();
    cancelLoadBurst();
    cancelAmbient();
    stop(true);
  }

  function onMotionPreference() {
    if (reduced()) disarm();
    else {
      // Once the page has loaded, wait for the next real trigger rather than playing a late load burst.
      if (isLoaded()) opts = { ...opts, loadDelay: null };
      arm();
    }
  }

  if (!reduced()) arm();
  const listen = (on) => {
    if (!reducedQuery) return;
    if (reducedQuery.addEventListener) reducedQuery[on ? 'addEventListener' : 'removeEventListener']('change', onMotionPreference);
    else reducedQuery[on ? 'addListener' : 'removeListener']?.(onMotionPreference); // Safari < 14
  };
  listen(true);

  function teardown() {
    if (dead) return;
    disarm();
    dead = true;
    listen(false);
    release();
    if (active?.teardown === teardown) active = null;
  }

  return {
    teardown,
    play: (strength) => play(strength),
    // Test hooks.
    get state() {
      return {
        armed, loaded: isLoaded(), playing: Boolean(burst), frame: burst?.index ?? null, frames: n, fps: params.fps,
        variant: params.variant, tookOver: Boolean(link), cached: cache.size, pendingLoad, loadScheduled: loadTimer != null,
        ambientScheduled: ambientTimer != null,
      };
    },
  };
}

/** Test hook: the live controller's state, or null. */
export const _faviconState = () => active?.state ?? null;
/** Length of one burst of the default variant in ms (every variant shares the wave's 1.16 s beat). */
export const BURST_MS = Math.round(burstDuration(motionFor(DEFAULT_VARIANT)) * 1000);
