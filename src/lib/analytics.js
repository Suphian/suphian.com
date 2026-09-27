// Product analytics: custom events to PostHog, and the same events to GA4
// wherever index.html loaded gtag. A silent no-op until POSTHOG_KEY is set, and
// outside suphian.com unless the debug flag is on. docs/launch.md lists the events.

// PostHog project API key (phc_…). Public by design, like the GA4 ID in index.html.
export const POSTHOG_KEY = '';
// PostHog cloud region, 'us' or 'eu'. The /ingest rewrites in vercel.json must match.
export const POSTHOG_REGION = 'us';
// Same-origin reverse proxy (vercel.json rewrites), so ad blockers keep the events.
export const POSTHOG_API_HOST = '/ingest';

// Same gate as GA4 in index.html: local and preview builds send nothing.
const PRODUCTION_HOST = /^(www\.)?suphian\.com$/;
// localStorage.setItem('analytics-debug', '1') turns analytics on anywhere, dev
// included, and PostHog logs every event to the console. removeItem turns it off.
export const DEBUG_KEY = 'analytics-debug';

// Custom events only: no autocapture, replay, surveys, heatmaps or web vitals
// (webVitals.js sends those to GA4). No remote scripts and no /flags call either,
// so nothing loads beyond the bundled chunk and connect-src 'self' covers it all.
export const posthogConfig = ({ debug = false } = {}) => ({
  api_host: POSTHOG_API_HOST,
  ui_host: `https://${POSTHOG_REGION}.posthog.com`,
  person_profiles: 'identified_only',
  capture_pageview: false, // startAnalytics sends the one $pageview itself.
  capture_pageleave: false,
  autocapture: false,
  rageclick: false,
  capture_dead_clicks: false,
  capture_heatmaps: false,
  capture_performance: false,
  capture_exceptions: false,
  disable_session_recording: true,
  disable_surveys: true,
  disable_product_tours: true,
  disable_conversations: true,
  disable_web_experiments: true,
  disable_external_dependency_loading: true,
  advanced_disable_flags: true,
  debug,
});

/** On with a key, on suphian.com's production build or with the debug flag. */
export const shouldTrack = ({ key, prod, hostname, debug }) =>
  Boolean(key) && (Boolean(debug) || (Boolean(prod) && PRODUCTION_HOST.test(hostname ?? '')));

const defined = (props) => Object.fromEntries(Object.entries(props ?? {}).filter(([, value]) => value !== undefined));

/**
 * The event pipe, apart from the loader so node tests can drive it. Events wait
 * in order until ready() hands over the PostHog client (null if it failed to
 * load), then go to PostHog with their original time and to gtag if it exists.
 * Never throws: analytics must not break a click.
 */
export function createTracker({ enabled, gtag = () => undefined }) {
  const queue = [];
  const once = new Set();
  let posthog = null;
  let ready = false;

  function send({ event, props, timestamp }, queued) {
    try {
      // Any capture options make PostHog skip its batch and send at once, so
      // only events that waited for the load pass their original time.
      if (queued) posthog?.capture(event, props, { timestamp });
      else posthog?.capture(event, props);
    } catch {
      // Dropped.
    }
    // GA4 records its own page_view, and its event names can't start with '$'.
    if (event.startsWith('$')) return;
    try {
      const fn = gtag();
      if (typeof fn === 'function') fn('event', event, props);
    } catch {
      // Dropped.
    }
  }

  function track(event, props) {
    if (!enabled) return;
    try {
      const item = { event, props: defined(props), timestamp: new Date() };
      if (ready) send(item, false);
      else queue.push(item);
    } catch {
      // Dropped.
    }
  }

  return {
    enabled,
    track,
    /** track(), at most once per page load for the same event and props. */
    trackOnce(event, props) {
      if (!enabled) return;
      try {
        const key = `${event} ${JSON.stringify(defined(props))}`;
        if (once.has(key)) return;
        once.add(key);
      } catch {
        return;
      }
      track(event, props);
    },
    ready(client) {
      if (ready) return;
      ready = true;
      posthog = client ?? null;
      queue.splice(0).forEach((item) => send(item, true));
    },
    get queued() {
      return queue.length;
    },
  };
}

const browser = typeof window !== 'undefined';
// undefined under node --test, which imports this file without Vite.
const env = import.meta.env ?? {};

function debugFlag() {
  try {
    return window.localStorage.getItem(DEBUG_KEY) === '1';
  } catch {
    return false;
  }
}

const debug = browser && debugFlag();
const tracker = createTracker({
  enabled: shouldTrack({ key: POSTHOG_KEY, prod: env.PROD, hostname: browser ? window.location.hostname : '', debug }),
  gtag: () => window.gtag,
});

export const analyticsEnabled = tracker.enabled;
export const { track, trackOnce } = tracker;

let started = false;

/**
 * Queues the one $pageview, then loads posthog-js after the first interaction
 * or 3s after load: the GA4 deferral in index.html, so it never competes with
 * the first paint. Anything tracked before then waits in the queue.
 */
export function startAnalytics() {
  if (!tracker.enabled || started) return;
  started = true;
  trackOnce('$pageview');

  let loading = false;
  const load = () => {
    if (loading) return;
    loading = true;
    import('posthog-js')
      .then(({ default: posthog }) => {
        posthog.init(POSTHOG_KEY, posthogConfig({ debug }));
        tracker.ready(posthog);
      })
      .catch(() => tracker.ready(null)); // GA4 still gets the queue.
  };
  ['mousedown', 'touchstart', 'keydown', 'scroll'].forEach((type) => {
    document.addEventListener(type, load, { once: true, passive: true });
  });
  if (document.readyState === 'complete') setTimeout(load, 3000);
  else window.addEventListener('load', () => setTimeout(load, 3000), { once: true });
}

/** How much of a section must show to count as viewed: half of it, or half the screen if it's taller. */
export const viewThreshold = (height, viewport) => (height > 0 && viewport > 0 ? Math.min(0.5, (viewport / 2) / height) : 0.5);
