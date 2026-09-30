import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { errors } from './content.js';
import { registerServiceWorker } from './lib/serviceWorker.js';
import { reportWebVitals } from './lib/webVitals.js';
import { analyticsEnabled, captureException, startAnalytics, track } from './lib/analytics.js';
import { installErrorTracking } from './lib/errors.js';
import { afterFirstPaint } from './lib/afterFirstPaint.js';
import { scrollToTop } from './lib/scroll.js';
import './fonts.css';
import './style.css';

const rootElement = document.getElementById('root');

// Uncaught errors and rejections to PostHog Error Tracking, from the start so
// the first render is covered. Only where analytics runs (suphian.com, or the
// debug flag); they wait in the queue until PostHog loads.
if (analyticsEnabled) installErrorTracking(captureException, { target: window, now: () => Date.now() });

// Plain DOM fallback when React cannot mount at all.
function showLoadError(error) {
  const box = document.createElement('div');
  box.style.cssText = 'min-height:100vh;padding:32px;background:#080808;color:#d2d2d2;font-family:var(--font-text, Arial, Helvetica, sans-serif);';
  const title = document.createElement('h1');
  title.style.cssText = 'margin:0 0 16px;font-weight:400;letter-spacing:-0.04em;';
  title.textContent = errors.appLoad.title;
  const details = document.createElement('pre');
  details.style.cssText = 'white-space:pre-wrap;padding:16px;background:#0d0d0d;border:1px solid #272727;color:#9d9d97;font-size:12px;';
  details.textContent = error instanceof Error ? `${error}\n\n${error.stack ?? ''}` : String(error);
  const reload = document.createElement('button');
  reload.type = 'button';
  reload.textContent = errors.appLoad.reload;
  reload.style.cssText = 'margin-top:16px;min-height:44px;padding:0 20px;border:1px solid #ed2921;background:none;color:#d2d2d2;font:inherit;cursor:pointer;';
  reload.addEventListener('click', () => window.location.reload());
  box.append(title, details, reload);
  rootElement.replaceChildren(box);
}

try {
  // No dead ends (Suphian): removed pages like /podcast and any unknown URL show
  // home. Vercel serves them dist/404.html with a real 404 status; this puts the
  // address back to /, as the old <Navigate to="/" replace /> did. Before the
  // first render, so SUPH never starts docked.
  if (window.location.pathname !== '/') window.history.replaceState(null, '', '/');
  // Top of the page before the first render, so the wordmark measures the hero
  // (Suphian 2026-09-27). A slow bundle leaves the static profile on screen, and
  // whatever it was scrolled to would carry over: on phones it is longer than
  // the app, so a flick down it landed at SAY HELLO. A /#section is App.jsx's.
  if (!window.location.hash) scrollToTop({ instant: true });
  createRoot(rootElement).render(<App />);
  // The animated favicon never moves before load (its first burst is 450 ms after
  // it), so its chunk loads then. If the chunk fails, the static icon stays.
  afterFirstPaint(() => import('./favicon/favicon.js').then(({ initFavicon }) => initFavicon()).catch(() => {}));
  // PostHog, the only analytics: a no-op without the key, and off suphian.com unless debugging.
  startAnalytics();

  if (import.meta.env.PROD) {
    // Core Web Vitals to PostHog (wherever analytics runs), then caching.
    // Both wait for the first paint: the metrics are buffered, and the service
    // worker's install only helps the next visit.
    afterFirstPaint(() => {
      if (analyticsEnabled) reportWebVitals(track);
      registerServiceWorker().catch((error) => console.warn('Service worker registration failed:', error));
    });
  }
} catch (error) {
  console.error('Failed to mount React app:', error);
  // Caught here, so the error listener never sees it. startAnalytics may not
  // have run yet; it runs once, so calling it again is safe.
  captureException(error, { source: 'mount' });
  startAnalytics();
  showLoadError(error);
}
