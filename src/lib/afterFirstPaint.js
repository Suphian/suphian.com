/**
 * Runs `task` after load and the first contentful paint, once the main thread
 * is free: work the first paint doesn't need, so it never competes with it
 * (Suphian 2026-09-27: snappier in aggregate). Safari has no requestIdleCallback.
 */
export function afterFirstPaint(task) {
  const loaded = new Promise((resolve) => {
    if (document.readyState === 'complete') resolve();
    else window.addEventListener('load', resolve, { once: true });
  });
  const painted = new Promise((resolve) => {
    try {
      const observer = new PerformanceObserver((list) => {
        if (!list.getEntriesByName('first-contentful-paint').length) return;
        observer.disconnect();
        resolve();
      });
      observer.observe({ type: 'paint', buffered: true });
    } catch {
      resolve(); // No paint timing: load alone.
    }
  });
  Promise.all([loaded, painted]).then(() => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(task, { timeout: 2000 });
    else setTimeout(task, 200);
  });
}
