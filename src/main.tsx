
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// --- Google Analytics tracking utility additions ---

/**
 * Get rich client metadata for analytics events.
 * You can expand as needed!
 */
function getVisitorMetaData() {
  return {
    userAgent: navigator.userAgent,
    language: navigator.language,
    languages: navigator.languages,
    platform: navigator.platform,
    screen: {
      width: window.screen.width,
      height: window.screen.height
    },
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight
    },
    referrer: document.referrer,
    location: window.location.href,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Track a custom event to Google Analytics.
 *
 * @param {string} eventName - The event name (e.g., "button_click").
 * @param {object} eventData - Additional event metadata.
 *
 * Usage: window.trackEvent("button_click", {label: "CV Request", ...});
 */
window.trackEvent = (eventName, eventData = {}) => {
  if (typeof window.gtag === "function") {
    window.gtag("event", eventName, {
      ...getVisitorMetaData(),
      ...eventData,
    });
    // Optionally log for debugging
    // console.log("Tracked GA Event:", eventName, {...getVisitorMetaData(), ...eventData});
  }
};

// --- Pageview tracking with rich meta on route change ---

/**
 * Track a pageview with rich meta data.
 */
function trackPageView() {
  if (typeof window.gtag === "function") {
    window.gtag("event", "page_view", {
      ...getVisitorMetaData(),
      page_path: window.location.pathname,
    });
    // Optionally log for debugging
    // console.log("GA page_view:", { ...getVisitorMetaData(), page_path: window.location.pathname });
  }
}

// Log when the page loads to help debug favicon issues
window.addEventListener('load', () => {
  console.log('Page fully loaded, including stylesheets and images');
  
  // Check if favicon is in document
  const faviconLinks = document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');
  console.log(`Found ${faviconLinks.length} favicon link elements`);
});

// Initialize the root component
createRoot(document.getElementById("root")!).render(<App />);

// Track pageviews when the location changes
declare global {
  interface Window {
    gtag: (key: string, ...args: any[]) => void;
    trackEvent: (eventName: string, eventData?: Record<string, unknown>) => void;
  }
}

// --- React Router-based pageview tracking ---

import { BrowserRouter } from "react-router-dom";
import { useEffect } from "react";

/**
 * Add this _somewhere_ at the root (ideally after router navigation completes).
 * For convenience, we recommend you add this small component to your App tree.
 */
function AnalyticsPageviewListener() {
  useEffect(() => {
    // Track the initial page load
    trackPageView();

    // Track GA pageview on every route/page change
    const onHistory = () => {
      setTimeout(trackPageView, 0); // next tick after route update
    };
    window.addEventListener("popstate", onHistory);
    window.addEventListener("pushstate", onHistory); // For SPA navigation
    window.addEventListener("replacestate", onHistory);

    // Also react to hash changes (e.g., anchor navigation)
    window.addEventListener("hashchange", onHistory);

    // You can use a MutationObserver or router events for more accuracy if needed

    return () => {
      window.removeEventListener("popstate", onHistory);
      window.removeEventListener("pushstate", onHistory);
      window.removeEventListener("replacestate", onHistory);
      window.removeEventListener("hashchange", onHistory);
    };
  }, []);
  return null;
}

// Note for maintainers: Add <AnalyticsPageviewListener /> in App after <BrowserRouter> if not present.

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

