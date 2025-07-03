import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize Google Analytics tracking
import './utils/analytics/googleAnalytics';

// Initialize Secure Supabase event tracking
import './utils/analytics/secureEventTracker';

// Log when the page loads to help debug favicon issues
window.addEventListener('load', () => {
  console.log('🔒 Secure page loaded, including stylesheets and images');
  
  // Check if favicon is in document
  const faviconLinks = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
  console.log(`Found ${faviconLinks.length} favicon link elements`);
});

// Initialize the root component
createRoot(document.getElementById("root")!).render(<App />);