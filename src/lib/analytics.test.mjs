// PostHog, the only analytics: events (analytics.js), $web_vitals (webVitals.js),
// the /ingest proxy and CSP in vercel.json, and the service worker leaving that
// proxy alone.
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
import { webVitalsProperties } from './webVitals.js';

const read = (file) => readFileSync(new URL(file, import.meta.url), 'utf8');
const vercel = JSON.parse(read('../../vercel.json'));

function recorder() {
  const captures = [];
  return {
    captures,
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

test('with the committed key, a preview deployment stays silent', async () => {
  globalThis.window = {
    location: { hostname: 'suphian-abc123-suph.vercel.app' },
    localStorage: { getItem: () => null },
  };
  try {
    // A fresh copy of the module, evaluated under the fake window.
    const fresh = await import(`./analytics.js?window=${Date.now()}`);
    assert.match(fresh.POSTHOG_KEY, /^phc_/, 'the Suph.ai project key is committed (2026-09-27)');
    assert.equal(fresh.analyticsEnabled, false);
    fresh.track('say_hello_clicked');
    fresh.trackOnce('section_viewed', { section: 'story' });
    fresh.startAnalytics(); // Would touch document (undefined here) if it did anything.
  } finally {
    delete globalThis.window;
  }
});

test('a disabled tracker never queues or sends', () => {
  const r = recorder();
  const tracker = createTracker({ enabled: false });
  tracker.track('contact_opened', { source: 'SayHello' });
  tracker.ready(r.posthog);
  tracker.track('contact_opened', { source: 'SayHello' });
  assert.equal(tracker.queued, 0);
  assert.deepEqual(r.captures, []);
});

test('events queue until PostHog loads, then flush in order with their original times', () => {
  const r = recorder();
  const tracker = createTracker({ enabled: true });
  const before = Date.now();
  tracker.trackOnce('$pageview');
  tracker.track('story_chapter_opened', { chapter: 'steadily' });
  tracker.track('outbound_link_clicked', { href: 'https://steadily.com', label: 'Visit steadily.com', chapter: undefined });
  assert.equal(tracker.queued, 3);
  assert.deepEqual(r.captures, [], 'nothing sent before ready');

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

test('if PostHog fails to load, the queue empties and later events are dropped', () => {
  const tracker = createTracker({ enabled: true });
  tracker.track('say_hello_clicked');
  tracker.ready(null);
  assert.equal(tracker.queued, 0);
  assert.doesNotThrow(() => tracker.track('contact_opened', { source: 'SayHello' }));
  assert.equal(tracker.queued, 0, 'nothing waits for a client that never comes');
});

test('trackOnce sends a given event and props once per page load', () => {
  const r = recorder();
  const tracker = createTracker({ enabled: true });
  tracker.ready(r.posthog);
  for (let i = 0; i < 3; i += 1) {
    tracker.trackOnce('section_viewed', { section: 'story' });
    tracker.trackOnce('section_viewed', { section: 'say_hello' });
  }
  assert.deepEqual(r.captures.map(([, props]) => props.section), ['story', 'say_hello']);
});

test('tracking never throws, whatever PostHog does', () => {
  const tracker = createTracker({ enabled: true });
  tracker.ready({ capture: () => { throw new Error('posthog broke'); } });
  assert.doesNotThrow(() => tracker.track('say_hello_clicked'));
  const circular = {};
  circular.self = circular;
  assert.doesNotThrow(() => tracker.trackOnce('section_viewed', circular));
});

test('PostHog runs on custom events, $pageview and $pageleave only, through the proxy, with nothing remote to load', () => {
  const config = posthogConfig();
  assert.equal(config.api_host, '/ingest');
  assert.equal(config.ui_host, `https://${POSTHOG_REGION}.posthog.com`);
  assert.equal(config.person_profiles, 'identified_only');
  for (const key of ['autocapture', 'capture_pageview', 'rageclick', 'capture_dead_clicks', 'capture_heatmaps', 'capture_performance', 'capture_exceptions']) {
    assert.equal(config[key], false, key);
  }
  for (const key of ['capture_pageleave', 'disable_session_recording', 'disable_surveys', 'disable_external_dependency_loading', 'advanced_disable_flags']) {
    assert.equal(config[key], true, key);
  }
  assert.equal(posthogConfig({ debug: true }).debug, true);
});

test('posthog-js loads as the slim build after the first paint, not on a first interaction', () => {
  const source = read('./analytics.js');
  assert.match(source, /import\('posthog-js\/dist\/module\.slim\.js'\)/);
  assert.match(source, /afterFirstPaint\(load\)/);
  assert.doesNotMatch(source, /'mousedown'/);
});

test("$web_vitals carries each metric the way posthog-js's own web vitals extension does", () => {
  const metric = (name, value) => ({
    name,
    value,
    rating: 'good',
    delta: value,
    id: `v6-${name}`,
    navigationType: 'navigate',
    navigationId: 1,
    entries: [{}],
    $current_url: 'https://suphian.com/',
    timestamp: 1790000000000,
  });
  const event = (name, value) => ({ name, value, rating: 'good', delta: value, id: `v6-${name}`, navigationType: 'navigate', $current_url: 'https://suphian.com/', timestamp: 1790000000000 });
  assert.deepEqual(webVitalsProperties([metric('LCP', 1712.5), metric('CLS', 0.02)]), {
    $web_vitals_LCP_event: event('LCP', 1712.5),
    $web_vitals_LCP_value: 1712.5,
    $web_vitals_CLS_event: event('CLS', 0.02),
    $web_vitals_CLS_value: 0.02,
  });
});

test('GA4 is gone from the page', () => {
  assert.doesNotMatch(read('../../index.html'), /gtag|googletagmanager|G-8S5FL37K8X/);
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

test('vercel.json proxies /ingest to PostHog, and no catch-all rewrite swallows unknown paths', () => {
  const { rewrites } = vercel;
  const sources = rewrites.map((rule) => rule.source);
  // Unknown paths get dist/404.html with a real 404 status (vite.config.js notFoundPage),
  // so a catch-all rewrite to /index.html must not come back.
  assert.equal(sources.indexOf('/(.*)'), -1, 'no SPA catch-all rewrite');
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
});

test('the CSP already allows the same-origin proxy and bundled SDK, and no PostHog or Google host directly', () => {
  const csp = vercel.headers
    .find((rule) => rule.source === '/(.*)')
    .headers.find((header) => header.key === 'Content-Security-Policy').value;
  const directive = (name) => csp.split(';').map((part) => part.trim().split(/\s+/)).find(([key]) => key === name)?.slice(1) ?? [];
  assert.ok(directive('connect-src').includes("'self'"), 'connect-src covers /ingest');
  assert.ok(directive('script-src').includes("'self'"), 'script-src covers the posthog-js chunk');
  assert.doesNotMatch(csp, /posthog/, 'the browser only ever talks to suphian.com/ingest');
  assert.doesNotMatch(csp, /google/, 'no GA4 hosts');
  // Violation reports go to PostHog's CSP reporting through the same proxy.
  assert.deepEqual(directive('report-uri'), [`${POSTHOG_API_HOST}/report/?token=${POSTHOG_KEY}`]);
});

test('the service worker never caches or intercepts the analytics proxy', () => {
  const sw = read('../../public/sw.js');
  const skip = sw.indexOf("url.pathname.startsWith('/ingest/')) return;");
  assert.ok(skip > 0, 'sw.js skips /ingest/');
  assert.ok(skip < sw.indexOf('getStrategy(request.url)'), 'before any cache strategy runs');
});
