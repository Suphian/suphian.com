
import { getVisitorMetaData } from './visitorMetadata';

// Cache visitor metadata to avoid repeated async calls
let cachedVisitorMeta: Record<string, unknown> | null = null;
let visitorMetaPromise: Promise<Record<string, unknown>> | null = null;

/**
 * Get visitor metadata with caching for performance
 */
async function getCachedVisitorMeta(): Promise<Record<string, unknown>> {
  if (cachedVisitorMeta) {
    return cachedVisitorMeta;
  }
  
  if (!visitorMetaPromise) {
    visitorMetaPromise = getVisitorMetaData().then((meta) => {
      cachedVisitorMeta = meta as Record<string, unknown>;
      return cachedVisitorMeta;
    });
  }
  
  return visitorMetaPromise;
}

/**
 * Track a custom event to Google Analytics with optimized performance.
 * Uses sendBeacon for critical events on page unload.
 *
 * @param {string} eventName - The event name (e.g., "button_click").
 * @param {object} eventData - Additional event metadata.
 * @param {boolean} useBeacon - Use sendBeacon API (for page unload events)
 *
 * Usage: window.trackEvent("button_click", {label: "CV Request", ...});
 */
export const trackEvent = async (
  eventName: string, 
  eventData: Record<string, unknown> = {},
  useBeacon = false
) => {
  if (typeof window.gtag !== "function") {
    return;
  }

  try {
    const visitorMeta = await getCachedVisitorMeta();
    const enrichedData = {
      ...visitorMeta,
      ...eventData,
    };

    // Use sendBeacon for critical events during page unload
    if (useBeacon && navigator.sendBeacon) {
      // Note: GA4 doesn't directly support sendBeacon, but we can queue it
      // For now, use gtag with transport: 'beacon' option
      window.gtag("event", eventName, {
        ...enrichedData,
        transport_type: 'beacon',
      });
    } else {
      // Use requestIdleCallback for non-critical events when available
      if ('requestIdleCallback' in window && !useBeacon) {
        requestIdleCallback(() => {
          window.gtag("event", eventName, enrichedData);
        }, { timeout: 2000 });
      } else {
        window.gtag("event", eventName, enrichedData);
      }
    }
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to track GA event:', error);
    }
  }
};

/**
 * Track a pageview with rich meta data (optimized).
 */
export async function trackPageView() {
  if (typeof window.gtag !== "function") {
    return;
  }

  try {
    const visitorMeta = await getCachedVisitorMeta();
    window.gtag("event", "page_view", {
      ...visitorMeta,
      page_path: window.location.pathname,
    });
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn('Failed to track GA pageview:', error);
    }
  }
}

/**
 * Flush pending events on page unload using sendBeacon
 */
export function flushEventsOnUnload() {
  if (typeof window.gtag === "function" && navigator.sendBeacon) {
    // Send any pending events with beacon transport
    window.gtag("event", "page_unload", {
      transport_type: 'beacon',
      page_path: window.location.pathname,
    });
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

// Flush events on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushEventsOnUnload);
  window.addEventListener('pagehide', flushEventsOnUnload);
}
