import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerServiceWorker } from './utils/serviceWorker'
import { secureEventTracker } from './utils/analytics/secureEventTracker'

// Check if root element exists
const rootElement = document.getElementById("root");
if (!rootElement) throw new Error('Failed to find the root element');

// Initialize the root component
createRoot(rootElement).render(<App />);

// Initialize analytics tracking AFTER app renders (non-blocking)
setTimeout(() => {
  secureEventTracker.initialize().catch(err => {
    console.warn('Analytics initialization failed:', err);
  });
}, 100);

// Register service worker for efficient caching (production only)
if (import.meta.env.PROD) {
  registerServiceWorker().catch(err => {
    console.warn('Service worker registration failed:', err);
  });
}