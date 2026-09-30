// Product analytics: PostHog is the only tool. $pageview, $pageleave, $web_vitals
// (webVitals.js), $exception (errors.js) and the custom events all go to it. A
// silent no-op until POSTHOG_KEY is set, and outside suphian.com unless the
// debug flag is on.
// docs/launch.md lists the events.

import { afterFirstPaint } from './afterFirstPaint.js';

// PostHog project API key (phc_…). Public by design: it can only send events.
export const POSTHOG_KEY = 'phc_rd4iSE4nLz5RbL3Nskbbm8YCKYdx7u2zz9SQmQF3wdZ7'; // Suph.ai org, project 631302 (US)
// PostHog cloud region, 'us' or 'eu'. The /ingest rewrites in vercel.json must match.
export const POSTHOG_REGION = 'us';
// Same-origin reverse proxy (vercel.json rewrites), so ad blockers keep the events.
export const POSTHOG_API_HOST = '/ingest';

// Production hostnames only: local and preview builds send nothing.
const PRODUCTION_HOST = /^(www\.)?suphian\.com$/;
// localStorage.setItem('analytics-debug', '1') turns analytics on anywhere, dev
// included, and PostHog logs every event to the console. removeItem turns it off.
export const DEBUG_KEY = 'analytics-debug';

// Custom events, the one $pageview and $pageleave (time on page and scroll depth)
// only: no autocapture, replay, surveys or heatmaps. PostHog's own web vitals
// need remote config and a remote script, so webVitals.js sends $web_vitals
// instead, and its exception autocapture (capture_exceptions) needs a remote
// script too, so errors.js reports errors through captureException. No remote
// scripts and no /flags call either, so nothing loads beyond the bundled chunks
// and connect-src 'self' covers it all.
export const posthogConfig = ({ debug = false } = {}) => ({
  api_host: POSTHOG_API_HOST,
  ui_host: `https://${POSTHOG_REGION}.posthog.com`,
  person_profiles: 'identified_only',
  capture_pageview: false, // startAnalytics sends the one $pageview itself.
  // true, not the default 'if_capture_pageview', which capture_pageview: false turns off.
  capture_pageleave: true,
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
 * The event pipe, apart from the loader so node tests can drive it. Events and
 * exceptions wait in order until ready() hands over the PostHog client (null if
 * it failed to load), then go to PostHog, events with their original time.
 * Never throws: analytics must not break a click.
 */
export function createTracker({ enabled }) {
  const queue = [];
  const once = new Set();
  let posthog = null;
  let ready = false;

  function send({ event, props, timestamp, exception }, queued) {
    try {
      // captureException takes no time: a queued one is stamped when PostHog
      // loads, at most a couple of seconds late.
      if (exception) posthog?.captureException?.(exception.error, props);
      // Any capture options make PostHog skip its batch and send at once, so
      // only events that waited for the load pass their original time.
      else if (queued) posthog?.capture(event, props, { timestamp });
      else posthog?.capture(event, props);
    } catch {
      // Dropped.
    }
  }

  function enqueue(item) {
    if (ready) send(item, false);
    else queue.push(item);
  }

  function track(event, props) {
    if (!enabled) return;
    try {
      enqueue({ event, props: defined(props), timestamp: new Date() });
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
    /** posthog.captureException(error, props), queued like track() until PostHog loads. */
    captureException(error, props) {
      if (!enabled) return;
      try {
        enqueue({ exception: { error }, props: defined(props) });
      } catch {
        // Dropped.
      }
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
});

export const analyticsEnabled = tracker.enabled;
export const { track, trackOnce, captureException } = tracker;

let started = false;

/**
 * Loads posthog-js and the exceptions extension side by side and inits
 * PostHog. The slim build: capture, $pageleave, scroll depth and beacon sends,
 * without the extensions this config turns off (autocapture, replay, web vitals
 * and more). The one extension it gets is exceptions, which captureException
 * needs (posthogExceptions.js), through posthog-js's own __extensionClasses
 * option (lib/src/types.d.ts:65), which @posthog/types' PostHogConfig leaves
 * out, so it is added here rather than in posthogConfig. The extension is
 * optional: if its chunk fails to load, PostHog starts without it and
 * captureException does nothing (lib/src/posthog-core.js:3753), so a missing
 * chunk costs the errors, never the visit. Rejects only if posthog-js itself
 * fails. The loaders are parameters for the tests.
 */
export async function initPostHog({
  debug: debugging = false,
  loadPostHog = () => import('posthog-js/dist/module.slim.js'),
  loadExceptions = () => import('./posthogExceptions.js'),
} = {}) {
  const [{ default: posthog }, extension] = await Promise.all([loadPostHog(), loadExceptions().catch(() => null)]);
  const config = posthogConfig({ debug: debugging });
  const exceptions = extension?.PostHogExceptions;
  posthog.init(POSTHOG_KEY, exceptions ? { ...config, __extensionClasses: { exceptions } } : config);
  return posthog;
}

/**
 * Queues the one $pageview, then loads posthog-js once the first paint is done
 * (afterFirstPaint: load and first contentful paint, then idle, 2 s at most),
 * without waiting for an interaction, so a visit that never scrolls or clicks
 * still counts. The $pageview keeps its queued time, so $pageleave's duration
 * starts at page load. Hiding the page before then starts the load at once.
 * Anything tracked before PostHog loads waits in the queue.
 */
export function startAnalytics() {
  if (!tracker.enabled || started) return;
  started = true;
  trackOnce('$pageview');

  let loading = false;
  const load = () => {
    if (loading) return;
    loading = true;
    initPostHog({ debug })
      .then((posthog) => tracker.ready(posthog))
      .catch(() => tracker.ready(null)); // Empties the queue: nothing else would send it.
  };
  afterFirstPaint(load);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') load();
  });
}

/** How much of a section must show to count as viewed: half of it, or half the screen if it's taller. */
export const viewThreshold = (height, viewport) => (height > 0 && viewport > 0 ? Math.min(0.5, (viewport / 2) / height) : 0.5);
