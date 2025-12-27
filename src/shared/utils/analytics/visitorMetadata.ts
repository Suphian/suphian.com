
import { getTrafficType } from './ipDetection';
import { getOriginalAttribution } from './attribution';

// Cache viewport dimensions to avoid layout thrashing
let cachedViewport = { width: 0, height: 0 };
let viewportCacheTime = 0;
const VIEWPORT_CACHE_TTL = 1000; // Cache for 1 second

/**
 * Get viewport dimensions with caching to prevent forced reflows
 */
function getCachedViewport() {
  const now = Date.now();
  if (now - viewportCacheTime > VIEWPORT_CACHE_TTL) {
    cachedViewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    viewportCacheTime = now;
  }
  return cachedViewport;
}

/**
 * Get rich client metadata for analytics events (optimized).
 * Caches expensive operations and uses requestIdleCallback when available.
 */
export async function getVisitorMetaData() {
  // Use requestIdleCallback for non-critical metadata collection
  const collectMetadata = async () => {
    // Get traffic type (async, but we'll await it)
    const trafficType = await getTrafficType();
    
    // Use cached viewport to avoid layout thrashing
    const viewport = getCachedViewport();
    
    // All our current meta (optimized to avoid expensive operations)
    const meta = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      languages: navigator.languages,
      platform: navigator.platform,
      screen: {
        width: window.screen.width,
        height: window.screen.height
      },
      viewport: viewport,
      referrer: document.referrer,
      location: window.location.href,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      timestamp: new Date().toISOString(),
      traffic_type: trafficType, // Add traffic type classification
    };
    
    // Merge in Attribution (synchronous, cached internally)
    const attrib = getOriginalAttribution();
    return {
      ...meta,
      ...attrib,
    };
  };

  // If requestIdleCallback is available, use it for non-critical collection
  if ('requestIdleCallback' in window) {
    return new Promise((resolve) => {
      requestIdleCallback(async () => {
        resolve(await collectMetadata());
      }, { timeout: 1000 });
    });
  }

  return collectMetadata();
}
