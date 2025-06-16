
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Initialize Google Analytics tracking
import './utils/analytics/googleAnalytics';

// Log when the page loads to help debug favicon issues
window.addEventListener('load', () => {
  console.log('Page fully loaded, including stylesheets and images');
  
  // Check if favicon is in document
  const faviconLinks = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
  console.log(`Found ${faviconLinks.length} favicon link elements`);
});

// Initialize the root component
createRoot(document.getElementById("root")!).render(<App />);

// -------- EXAMPLE USAGE (for your components) --------
/*
import React from "react";
function MyButton() {
  const handleClick = () => {
    window.trackEvent("button_click", {
      label: "Download CV",
      page: window.location.pathname,
      customProperty: "Value",
    });
  };
  return <button onClick={handleClick}>Download CV</button>
}
*/
// -----------------------------------------------------
