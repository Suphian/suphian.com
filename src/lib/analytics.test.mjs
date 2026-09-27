// PostHog + GA4 custom events (analytics.js), the /ingest proxy in vercel.json,
// and the service worker leaving that proxy alone.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import {
  POSTHOG_API_HOST,
  POSTHOG_KEY,
  POSTHOG_REGION,
  createTracker,
  posthogConfig,
  shouldTrack,
  viewThreshold,
} from './analytics.js';

const read = (file) => readFileSync(new URL(file, import.meta.url), 'utf8');
const vercel = JSON.parse(read('../../vercel.json'));

function recorder() {
  const gtagCalls = [];
  const captures = [];
  return {
    gtagCalls,
    captures,
    gtag: () => (...args) => gtagCalls.push(args),
    posthog: { capture: (...args) => captures.push(args) },
  };
}

test('the key is empty or a PostHog project key, and the region is one PostHog runs', () => {
  assert.match(POSTHOG_KEY, /^(phc_[A-Za-z0-9]+)?$/);
  assert.ok(['us', 'eu'].includes(POSTHOG_REGION));
});

test('tracking needs a key, and then suphian.com in production or the debug flag', () => {
  const on = { key: 'phc_test', prod: true, hostname: 'suphian.com', debug: false };
  assert.equal(shouldTrack(on), true);
  assert.equal(shouldTrack({ ...on, hostname: 'www.suphian.com' }), true);
  assert.equal(shouldTrack({ ...on, key: '' }), false, 'no key');
  assert.equal(shouldTrack({ ...on, key: '', debug: true }), false, 'no key, even debugging');
  assert.equal(shouldTrack({ ...on, prod: false }), false, 'dev');
  assert.equal(shouldTrack({ ...on, hostname: 'suphian-abc123-suph.vercel.app' }), false, 'preview');
  assert.equal(shouldTrack({ ...on, hostname: '127.0.0.1' }), false, 'local production build');
  assert.equal(shouldTrack({ ...on, prod: false, hostname: '127.0.0.1', debug: true }), true, 'dev with the debug flag');
});

test('with the committed empty key, track() does nothing, even on suphian.com with the debug flag', async () => {
  const gtagCalls = [];
  globalThis.window = {
    location: { hostname: 'suphian.com' },
    localStorage: { getItem: () => '1' },
    gtag: (...args) => gtagCalls.push(args),
  };
  try {
    // A fresh copy of the module, evaluated under the fake window.
    const fresh = await import(`./analytics.js?window=${Date.now()}`);
    if (fresh.POSTHOG_KEY) return; // The real key is in: nothing left to check here.
    assert.equal(fresh.analyticsEnabled, false);
    fresh.track('say_hello_clicked');
    fresh.trackOnce('section_viewed', { section: 'story' });
    fresh.startAnalytics(); // Would touch document if it did anything.
    assert.deepEqual(gtagCalls, []);
  } finally {
    delete globalThis.window;
  }
});

test('a disabled tracker never queues or forwards', () => {
  const r = recorder();
  const tracker = createTracker({ enabled: false, gtag: r.gtag });
  tracker.track('contact_opened', { source: 'SayHello' });
  tracker.ready(r.posthog);
  tracker.track('contact_opened', { source: 'SayHello' });
  assert.equal(tracker.queued, 0);
  assert.deepEqual(r.captures, []);
  assert.deepEqual(r.gtagCalls, []);
});

test('events queue until PostHog loads, then flush in order with their original times', () => {
  const r = recorder();
  const tracker = createTracker({ enabled: true, gtag: r.gtag });
  const before = Date.now();
  tracker.trackOnce('$pageview');
  tracker.track('story_chapter_opened', { chapter: 'steadily' });
  tracker.track('outbound_link_clicked', { href: 'https://steadily.com', label: 'Visit steadily.com', chapter: undefined });
  assert.equal(tracker.queued, 3);
  assert.deepEqual(r.captures, [], 'nothing sent before ready');
  assert.deepEqual(r.gtagCalls, [], 'GA4 waits with the queue');

  tracker.ready(r.posthog);
  assert.equal(tracker.queued, 0);
  assert.deepEqual(r.captures.map(([event, props]) => [event, props]), [
    ['$pageview', {}],
    ['story_chapter_opened', { chapter: 'steadily' }],
    ['outbound_link_clicked', { href: 'https://steadily.com', label: 'Visit steadily.com' }],
  ]);
  for (const [, , options] of r.captures) {
    assert.ok(options.timestamp instanceof Date);
    assert.ok(options.timestamp.getTime() >= before && options.timestamp.getTime() <= Date.now());
  }

  tracker.track('email_link_clicked');
  assert.equal(r.captures.length, 4, 'after ready, events go straight out');
  // No options object: PostHog sends any capture with options unbatched.
  assert.deepEqual(r.captures[3], ['email_link_clicked', {}]);
});

test('GA4 gets the same custom events, but not $pageview (gtag config already sends page_view)', () => {
  const r = recorder();
  const tracker = createTracker({ enabled: true, gtag: r.gtag });
  tracker.trackOnce('$pageview');
  tracker.track('contact_submitted', { status: 'sent' });
  tracker.ready(r.posthog);
  tracker.track('section_viewed', { section: 'footer' });
  assert.deepEqual(r.gtagCalls, [
    ['event', 'contact_submitted', { status: 'sent' }],
    ['event', 'section_viewed', { section: 'footer' }],
  ]);
});

test('no gtag on the page is fine, and if PostHog fails to load GA4 still gets the queue', () => {
  const noGtag = recorder();
  const withoutGa = createTracker({ enabled: true, gtag: () => undefined });
  withoutGa.track('say_hello_clicked');
  withoutGa.ready(noGtag.posthog);
  assert.equal(noGtag.captures.length, 1);

  const r = recorder();
  const withoutPostHog = createTracker({ enabled: true, gtag: r.gtag });
  withoutPostHog.track('say_hello_clicked');
  withoutPostHog.ready(null);
  withoutPostHog.track('contact_opened', { source: 'SayHello' });
  assert.deepEqual(r.gtagCalls.map(([, event]) => event), ['say_hello_clicked', 'contact_opened']);
});

test('trackOnce sends a given event and props once per page load', () => {
  const r = recorder();
  const tracker = createTracker({ enabled: true, gtag: r.gtag });
  tracker.ready(r.posthog);
  for (let i = 0; i < 3; i += 1) {
    tracker.trackOnce('section_viewed', { section: 'story' });
    tracker.trackOnce('section_viewed', { section: 'say_hello' });
  }
  assert.deepEqual(r.captures.map(([, props]) => props.section), ['story', 'say_hello']);
});

test('tracking never throws, whatever PostHog or gtag do', () => {
  const r = recorder();
  const tracker = createTracker({ enabled: true, gtag: () => () => { throw new Error('gtag broke'); } });
  tracker.ready({ capture: () => { throw new Error('posthog broke'); } });
  assert.doesNotThrow(() => tracker.track('say_hello_clicked'));
  const circular = {};
  circular.self = circular;
  assert.doesNotThrow(() => tracker.trackOnce('section_viewed', circular));

  const brokenGtagGetter = createTracker({ enabled: true, gtag: () => { throw new Error('no window'); } });
  brokenGtagGetter.ready(r.posthog);
  assert.doesNotThrow(() => brokenGtagGetter.track('say_hello_clicked'));
  assert.equal(r.captures.length, 1, 'PostHog still gets it');
});

test('PostHog runs on custom events only, through the proxy, with nothing remote to load', () => {
  const config = posthogConfig();
  assert.equal(config.api_host, '/ingest');
  assert.equal(config.ui_host, `https://${POSTHOG_REGION}.posthog.com`);
  assert.equal(config.person_profiles, 'identified_only');
  for (const key of ['autocapture', 'capture_pageview', 'capture_pageleave', 'rageclick', 'capture_dead_clicks', 'capture_heatmaps', 'capture_performance', 'capture_exceptions']) {
    assert.equal(config[key], false, key);
  }
  for (const key of ['disable_session_recording', 'disable_surveys', 'disable_external_dependency_loading', 'advanced_disable_flags']) {
    assert.equal(config[key], true, key);
  }
  assert.equal(posthogConfig({ debug: true }).debug, true);
});

test('every PostHog option is one the installed posthog-js declares (no silently ignored typos)', () => {
  const require = createRequire(import.meta.url);
  const typesDir = path.dirname(createRequire(require.resolve('posthog-js')).resolve('@posthog/types'));
  const declared = readFileSync(path.join(typesDir, 'posthog-config.d.ts'), 'utf8');
  for (const key of Object.keys(posthogConfig())) {
    assert.match(declared, new RegExp(`^\\s+${key}\\??:`, 'm'), `${key} is not a PostHogConfig option`);
  }
});

test('contact_submitted sends the outcome only, never what the visitor typed', () => {
  for (const file of ['./contactSubmit.js', '../components/ContactForm.jsx']) {
    const calls = read(file).match(/track\('contact_submitted'[^)]*\)/g) ?? [];
    assert.ok(calls.length > 0, file);
    for (const call of calls) assert.match(call, /^track\('contact_submitted', \{ status: [^,}]+ \}\)$/, `${file}: ${call}`);
  }
});

test('vercel.json proxies /ingest to PostHog, ahead of the SPA fallback', () => {
  const { rewrites } = vercel;
  const sources = rewrites.map((rule) => rule.source);
  const catchAll = sources.indexOf('/(.*)');
  assert.ok(catchAll >= 0, 'the SPA fallback is still there');
  const expected = {
    [`${POSTHOG_API_HOST}/static/:path(.*)`]: `https://${POSTHOG_REGION}-assets.i.posthog.com/static/:path`,
    [`${POSTHOG_API_HOST}/array/:path(.*)`]: `https://${POSTHOG_REGION}-assets.i.posthog.com/array/:path`,
    [`${POSTHOG_API_HOST}/:path(.*)`]: `https://${POSTHOG_REGION}.i.posthog.com/:path`,
  };
  const order = Object.keys(expected).map((source) => sources.indexOf(source));
  for (const [source, destination] of Object.entries(expected)) {
    const rule = rewrites.find((item) => item.source === source);
    assert.ok(rule, `missing ${source}`);
    assert.equal(rule.destination, destination);
  }
  // Specific before general: the /ingest catch-all would swallow /static and /array.
  assert.deepEqual(order, [...order].sort((a, b) => a - b));
  assert.ok(order.every((index) => index < catchAll), '/ingest rules come before /(.*)');
});

test('the CSP already allows the same-origin proxy and bundled SDK, and no PostHog host directly', () => {
  const csp = vercel.headers
    .find((rule) => rule.source === '/(.*)')
    .headers.find((header) => header.key === 'Content-Security-Policy').value;
  const directive = (name) => csp.split(';').map((part) => part.trim().split(/\s+/)).find(([key]) => key === name)?.slice(1) ?? [];
  assert.ok(directive('connect-src').includes("'self'"), 'connect-src covers /ingest');
  assert.ok(directive('script-src').includes("'self'"), 'script-src covers the posthog-js chunk');
  assert.doesNotMatch(csp, /posthog/, 'the browser only ever talks to suphian.com/ingest');
});

test('the service worker never caches or intercepts the analytics proxy', () => {
  const sw = read('../../public/sw.js');
  const skip = sw.indexOf("url.pathname.startsWith('/ingest/')) return;");
  assert.ok(skip > 0, 'sw.js skips /ingest/');
  assert.ok(skip < sw.indexOf('getStrategy(request.url)'), 'before any cache strategy runs');
});
