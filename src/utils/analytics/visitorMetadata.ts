
import { getTrafficType } from './ipDetection';
import { getOriginalAttribution } from './attribution';

/**
 * Get rich client metadata for analytics events.
 * You can expand as needed!
 */
export async function getVisitorMetaData() {
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
