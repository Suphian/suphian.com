import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// --- Google Analytics tracking utility additions ---

/**
 * Known internal IP addresses for traffic classification
 */
const INTERNAL_IPS = [
  '70.23.218.121', // IPv4
  '2600:4040:9074:300:20fd:4959:4e97:a68e' // IPv6
];

/**
 * Detect current user's IP address and classify traffic type
 */
async function detectTrafficType(): Promise<string> {
  try {
    // Try IPv4 first
    const ipv4Response = await fetch('https://api.ipify.org?format=json');
    const ipv4Data = await ipv4Response.json();
    
    if (INTERNAL_IPS.includes(ipv4Data.ip)) {
      return 'internal';
    }

    // Try IPv6 as fallback
    try {
      const ipv6Response = await fetch('https://api6.ipify.org?format=json');
      const ipv6Data = await ipv6Response.json();
      
      if (INTERNAL_IPS.includes(ipv6Data.ip)) {
        return 'internal';
      }
    } catch (ipv6Error) {
      // IPv6 detection failed, continue with external classification
    }
    
    return 'external';
  } catch (error) {
    // If IP detection fails, default to external
    console.log('IP detection failed, defaulting to external traffic');
    return 'external';
  }
}

// Cache traffic type to avoid multiple API calls
let cachedTrafficType: string | null = null;

/**
 * Get traffic type with caching
 */
async function getTrafficType(): Promise<string> {
  if (cachedTrafficType === null) {
    cachedTrafficType = await detectTrafficType();
  }
  return cachedTrafficType;
}

/**
 * --- Attribution/UTM Capture Logic ---
 * Capture the original UTM params, referrer, landing path for the session and store them
 * so ALL subsequent GA events know how the user originally arrived.
 */
function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    utm_term: params.get('utm_term'),
    utm_content: params.get('utm_content'),
  };
}

function getOriginalAttribution(): Record<string, any> {
  // Choose a key that will persist for the session only
  const key = 'lovable_attribution_data_v2';
  let cached: any = undefined;
  try {
    cached = JSON.parse(sessionStorage.getItem(key) || 'null');
  } catch {}
  if (cached) return cached;

  // Get UTM parameters, fallback to referrer if not set, only on first page
  const utms = getUrlParams();
  const hasAnyUtm = Object.values(utms).some(Boolean);
  // Landing page path and full URL
  const landing_path = window.location.pathname;
  const landing_full_url = window.location.href;
  // Document referrer (external or internal)
  const referrer = document.referrer;

  // Source mapping: try to give a human-readable guess if not explicit
  let sourceLabel = '';
  if (utms.utm_source) {
    sourceLabel = utms.utm_source;
  } else if (/linkedin\.com/.test(referrer)) {
    sourceLabel = 'linkedin';
  } else if (/youtube\.com|youtu\.be/.test(referrer)) {
    sourceLabel = 'youtube';
  } else if (/facebook\.com/.test(referrer)) {
    sourceLabel = 'facebook';
  } else if (/twitter\.com|x\.com/.test(referrer)) {
    sourceLabel = 'twitter';
  } else if (!referrer) {
    sourceLabel = 'direct';
  } else {
    // Anything else that sets referrer but isn't a known social
    try {
      const url = new URL(referrer);
      sourceLabel = url.hostname;
    } catch {
      sourceLabel = 'unknown';
    }
  }

  const meta = {
    ...utms,
    original_referrer: referrer || null,
    original_landing_path: landing_path,
    original_landing_url: landing_full_url,
    original_source: sourceLabel,
    attribution_ts: new Date().toISOString(),
  };
  // Save for session
  sessionStorage.setItem(key, JSON.stringify(meta));
  return meta;
}

/**
 * Get rich client metadata for analytics events.
 * You can expand as needed!
 */
async function getVisitorMetaData() {
  // Get traffic type
  const trafficType = await getTrafficType();
  
  // All our current meta...
  const meta = {
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
    traffic_type: trafficType, // Add traffic type classification
  };
  
  // Merge in Attribution
  const attrib = getOriginalAttribution();
  return {
    ...meta,
    ...attrib,
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
window.trackEvent = async (eventName, eventData = {}) => {
  if (typeof window.gtag === "function") {
    const visitorMeta = await getVisitorMetaData();
    window.gtag("event", eventName, {
      ...visitorMeta,
      ...eventData,
    });
    // Optionally log for debugging
    // console.log("Tracked GA Event:", eventName, {...visitorMeta, ...eventData});
  }
};

// --- Pageview tracking with rich meta on route change ---

/**
 * Track a pageview with rich meta data.
 */
async function trackPageView() {
  if (typeof window.gtag === "function") {
    const visitorMeta = await getVisitorMetaData();
    window.gtag("event", "page_view", {
      ...visitorMeta,
      page_path: window.location.pathname,
    });
    // Optionally log for debugging
    // console.log("GA page_view:", { ...visitorMeta, page_path: window.location.pathname });
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
