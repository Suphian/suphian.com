// Core Web Vitals to PostHog as $web_vitals events, shaped like the ones
// posthog-js's own web vitals extension sends (lib/src/extensions/web-vitals),
// so PostHog's web vitals views read them. That extension needs remote config
// and an external script, both off here (analytics.js), so this sends them.

// The metrics PostHog records, and its cut-off: values of 15 minutes or more are glitches.
const METRICS = ['CLS', 'FCP', 'INP', 'LCP'];
const MAX_VALUE = 15 * 60 * 1000;
// Like PostHog: send what has arrived 5 s after the first metric.
const FLUSH_DELAY = 5000;
// What $web_vitals_<NAME>_event keeps of a metric: web-vitals' fields minus
// entries (performance entries that serialize to {}), plus the page and when.
const EVENT_FIELDS = ['name', 'value', 'rating', 'delta', 'id', 'navigationType', '$current_url', 'timestamp'];

/** The $web_vitals properties for buffered metrics: each one's event and value, by name. */
export function webVitalsProperties(metrics) {
  const properties = {};
  for (const metric of metrics) {
    properties[`$web_vitals_${metric.name}_event`] = Object.fromEntries(EVENT_FIELDS.map((key) => [key, metric[key]]));
    properties[`$web_vitals_${metric.name}_value`] = metric.value;
  }
  return properties;
}

/**
 * Buffers CLS, FCP, INP and LCP and hands capture one $web_vitals event for
 * them: 5 s after the first metric, as soon as all four are in, or when the
 * page is hidden, whichever comes first. A metric reported after that (CLS and
 * INP report on hide) starts the next one. Everything it touches is in deps
 * (the web-vitals callbacks, the clock, the timer, the document and the page
 * URL), which the tests replace.
 */
export function collectWebVitals(capture, deps) {
  const { onCLS, onFCP, onINP, onLCP, now, setTimeout: schedule, clearTimeout: cancel, document: doc, href } = deps;
  const buffer = new Map();
  let timer;
  const flush = () => {
    cancel(timer);
    timer = undefined;
    if (!buffer.size) return;
    capture('$web_vitals', webVitalsProperties([...buffer.values()]));
    buffer.clear();
  };
  const add = (metric) => {
    if (metric.value >= MAX_VALUE) return;
    buffer.set(metric.name, { ...metric, $current_url: href(), timestamp: now() });
    if (buffer.size === METRICS.length) flush();
    else if (timer === undefined) timer = schedule(flush, FLUSH_DELAY);
  };
  onCLS(add);
  onFCP(add);
  onINP(add);
  onLCP(add);
  // web-vitals reports on hide from capture listeners on window, which run
  // before this one on document, so the flush includes those final values.
  doc.addEventListener('visibilitychange', () => {
    if (doc.visibilityState === 'hidden') flush();
  });
}

/** Loads the bundled web-vitals package and reports its metrics to capture. */
export function reportWebVitals(capture) {
  import('web-vitals')
    .then(({ onCLS, onFCP, onINP, onLCP }) =>
      collectWebVitals(capture, {
        onCLS,
        onFCP,
        onINP,
        onLCP,
        now: () => Date.now(),
        setTimeout: (fn, ms) => setTimeout(fn, ms),
        clearTimeout: (id) => clearTimeout(id),
        document,
        href: () => window.location.href,
      }),
    )
    .catch(() => {});
}
