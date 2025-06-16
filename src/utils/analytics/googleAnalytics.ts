
import { getVisitorMetaData } from './visitorMetadata';

/**
 * Track a custom event to Google Analytics.
 *
 * @param {string} eventName - The event name (e.g., "button_click").
 * @param {object} eventData - Additional event metadata.
 *
 * Usage: window.trackEvent("button_click", {label: "CV Request", ...});
 */
export const trackEvent = async (eventName: string, eventData: Record<string, unknown> = {}) => {
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

/**
 * Track a pageview with rich meta data.
 */
export async function trackPageView() {
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

// Declare global types
declare global {
  interface Window {
    gtag: (key: string, ...args: any[]) => void;
    trackEvent: (eventName: string, eventData?: Record<string, unknown>) => void;
  }
}

// Attach trackEvent to window for global access
window.trackEvent = trackEvent;
