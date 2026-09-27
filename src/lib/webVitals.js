// Core Web Vitals -> GA4, ported from suphian.com main.tsx. gtag only exists
// where index.html loaded it (suphian.com), so elsewhere this reports nothing.
export function reportWebVitals() {
  import('web-vitals')
    .then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
      const report = (metric) => {
        if (typeof window.gtag !== 'function') return;
        window.gtag('event', metric.name, {
          value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
          metric_id: metric.id,
          metric_value: metric.value,
          non_interaction: true,
        });
      };
      onCLS(report);
      onINP(report);
      onLCP(report);
      onFCP(report);
      onTTFB(report);
    })
    .catch(() => {});
}
