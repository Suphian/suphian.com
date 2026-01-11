
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

export function getOriginalAttribution(): Record<string, any> {
  // Choose a key that will persist for the session only
  const key = 'lovable_attribution_data_v2';
  let cached: any = undefined;
  try {
    cached = JSON.parse(sessionStorage.getItem(key) || 'null');
  } catch {}
  if (cached) return cached;

  // Get UTM parameters, fallback to referrer if not set, only on first page
  const utms = getUrlParams();
  const _hasAnyUtm = Object.values(utms).some(Boolean);
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
