
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize Google Analytics tracking
import './utils/analytics/googleAnalytics';

// Initialize Secure Supabase event tracking (replaces old eventTracker)
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

// -------- SECURE TRACKING EXAMPLE USAGE --------
/*
import React from "react";
import { secureEventTracker } from '@/utils/analytics/secureEventTracker';

function MyButton() {
  const handleClick = () => {
    secureEventTracker.track("button_click", {
      label: "Download CV",
      page: window.location.pathname,
      action: "download",
    });
  };
  return <button onClick={handleClick}>Download CV</button>
}
*/
// -----------------------------------------------------
