import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { errors } from './content.js';
import { registerServiceWorker } from './lib/serviceWorker.js';
import { reportWebVitals } from './lib/webVitals.js';
import { initFavicon } from './favicon/favicon.js';
import './fonts.css';
import './style.css';

const rootElement = document.getElementById('root');

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
  createRoot(rootElement).render(<App />);
  initFavicon();

  if (import.meta.env.PROD) {
    // Core Web Vitals to GA4 (only where index.html loaded gtag), then caching.
    reportWebVitals();
    registerServiceWorker().catch((error) => console.warn('Service worker registration failed:', error));
  }
} catch (error) {
  console.error('Failed to mount React app:', error);
  showLoadError(error);
}
