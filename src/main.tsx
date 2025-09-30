import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { registerServiceWorker } from './utils/serviceWorker'

// Analytics modules are loaded by feature modules as needed to reduce initial bundle size

// In preview/dev, make sure no stale service worker is controlling the page
if ('serviceWorker' in navigator && !import.meta.env.PROD) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((reg) => reg.unregister());
    console.log('🔧 Unregistered existing Service Workers for preview');
  }).catch(() => {/* noop */});
}

// Log when the page loads to help debug favicon/issues and ensure main.tsx executed
window.addEventListener('load', () => {
  console.log('🔒 Secure page loaded, including stylesheets and images');
  
  // Check if favicon is in document
  const faviconLinks = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
  console.log(`Found ${faviconLinks.length} favicon link elements`);
});

// Initialize the root component
createRoot(document.getElementById("root")!).render(<App />);

// Register service worker for efficient caching
if (import.meta.env.PROD) {
  registerServiceWorker();
}