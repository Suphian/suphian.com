// The old site's visitor-id key, kept so returning visitors keep their bucket.
const VISITOR_KEY = 'analytics_visitor_id';

function newId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function getOrCreateVisitorId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = newId();
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return null;
  }
}

// Client-supplied and therefore forgeable; the server-side check is advisory.
export function getClientIdentifier() {
  const visitorId = getOrCreateVisitorId();
  if (visitorId) return `visitor_${visitorId}`;
  // Storage blocked (private mode): a URL-independent fallback bucket.
  return `browser_${window.navigator.userAgent.slice(0, 50)}`;
}

/** true when allowed. Errors allow the submit so real people are never blocked. */
export async function checkRateLimit(supabase, identifier, action, maxAttempts = 3, windowMinutes = 60) {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_action: action,
      p_max_attempts: maxAttempts,
      p_window_minutes: windowMinutes,
    });
    if (error) {
      console.error('Rate limit check error:', error);
      return true;
    }
    return data === true;
  } catch (error) {
    console.error('Rate limiting error:', error);
    return true;
  }
}
