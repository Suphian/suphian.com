import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerServiceWorker } from './utils/serviceWorker'

console.log('🚀 React app initializing...');

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

  // Initialize analytics tracking AFTER app renders (non-blocking)
  // Use dynamic import to prevent blocking if analytics files are blocked by ad blockers
  setTimeout(async () => {
    try {
      const { secureEventTracker } = await import('./utils/analytics/secureEventTracker');
      secureEventTracker.initialize().catch(err => {
        console.warn('Analytics initialization failed (non-critical):', err);
      });
    } catch (err) {
      // Silently fail if analytics can't be loaded (e.g., blocked by ad blocker)
      if (import.meta.env.DEV) {
        console.warn('Analytics module could not be loaded (may be blocked by ad blocker):', err);
      }
    }
  }, 100);

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