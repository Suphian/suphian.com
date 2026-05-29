import { createRoot } from 'react-dom/client'
import App from './app/App.tsx'
import './index.css'
import { registerServiceWorker } from './shared/utils/serviceWorker'

// Check if root element exists
const rootElement = document.getElementById("root");
if (!rootElement) {
  const error = new Error('Failed to find the root element');
  console.error('❌', error);
  throw error;
}

// Initialize the root component with error handling
try {
  const root = createRoot(rootElement);
  root.render(<App />);

  // Initialize analytics in the background — chained (not awaited) so it never
  // serializes ahead of React work, and deferred to idle to protect FID/INP.
  const initAnalytics = () => {
    import('./shared/utils/analytics/secureEventTracker')
      .then(({ secureEventTracker }) => secureEventTracker.initialize())
      .catch((err) => {
        if (import.meta.env.DEV) {
          console.warn('Analytics unavailable (non-critical):', err);
        }
      });
  };
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(initAnalytics);
  } else {
    setTimeout(initAnalytics, 200);
  }

  // Report Core Web Vitals (LCP/INP/CLS/FCP/TTFB) to Google Analytics for
  // real-user monitoring. Loaded as its own chunk; web-vitals' buffered
  // observers still capture metrics that fired before registration.
  if (import.meta.env.PROD) {
    import('web-vitals').then(({ onCLS, onINP, onLCP, onFCP, onTTFB }) => {
      const report = (metric: { name: string; value: number; id: string }) => {
        const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
        if (typeof gtag === 'function') {
          gtag('event', metric.name, {
            value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
            metric_id: metric.id,
            metric_value: metric.value,
            non_interaction: true,
          });
        }
      };
      onCLS(report);
      onINP(report);
      onLCP(report);
      onFCP(report);
      onTTFB(report);
    }).catch(() => {});
  }

  // Register service worker for efficient caching (production only)
  if (import.meta.env.PROD) {
    registerServiceWorker().catch(err => {
      console.warn('Service worker registration failed:', err);
    });
  }
} catch (error) {
  // Display error in the UI if React fails to mount
  console.error('Failed to mount React app:', error);
  rootElement.innerHTML = `
    <div style="padding: 2rem; background: #1a1a1a; color: #fff; min-height: 100vh; font-family: monospace;">
      <h1 style="color: #ff0000; margin-bottom: 1rem;">Error: Failed to load application</h1>
      <pre style="background: #2a2a2a; padding: 1rem; border-radius: 4px; overflow: auto;">
        ${error instanceof Error ? error.toString() : String(error)}
        ${error instanceof Error && error.stack ? '\n\n' + error.stack : ''}
      </pre>
      <button 
        onclick="window.location.reload()" 
        style="margin-top: 1rem; padding: 0.5rem 1rem; background: #ff0000; color: white; border: none; border-radius: 4px; cursor: pointer;"
      >
        Reload Page
      </button>
    </div>
  `;
}