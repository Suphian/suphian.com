/**
 * Rate limiting utilities for contact forms and other user actions.
 */

import supabase from "@/integrations/supabase/client";
import { formLogger } from "@/shared/utils/logging";
import { VisitorTracking } from "@/shared/utils/analytics/visitorTracking";

/**
 * Check if an action is allowed based on server-side rate limiting.
 *
 * @param identifier - Unique identifier for the user/session
 * @param action - The action being rate limited (e.g., 'contact_form')
 * @param maxAttempts - Maximum attempts allowed in the window
 * @param windowMinutes - Time window in minutes (default: 60)
 * @returns true if allowed, false if rate limited
 */
export async function checkRateLimit(
  identifier: string,
  action: string,
  maxAttempts: number = 3,
  windowMinutes: number = 60
): Promise<boolean> {
  try {
    const { data, error } = await supabase.rpc('check_rate_limit', {
      p_identifier: identifier,
      p_action: action,
      p_max_attempts: maxAttempts,
      p_window_minutes: windowMinutes
    });

    if (error) {
      formLogger.error('Rate limit check error:', error);
      return true; // Allow on error to avoid blocking legitimate users
    }

    return data === true;
  } catch (error) {
    formLogger.error('Rate limiting error:', error);
    return true; // Allow on error to avoid blocking legitimate users
  }
}

/**
 * Generate a client identifier for rate limiting.
 *
 * Prefers the persisted visitor id: it is stable across navigations and unique
 * per browser. The previous user-agent + URL scheme let anyone mint a fresh
 * quota by changing the URL hash, and made every visitor on the same
 * browser/OS share a single bucket.
 *
 * This is still client-supplied and therefore forgeable (clearing storage
 * resets it); authoritative limiting belongs server-side, keyed on the request
 * IP inside the edge function.
 */
export function generateClientIdentifier(): string {
  const visitorId = VisitorTracking.getVisitorId();
  if (visitorId) {
    return 'visitor_' + visitorId;
  }

  // Storage unavailable (private mode / blocked): fall back to a URL-independent
  // fingerprint so the hash-reset hole stays closed.
  return 'browser_' + window.navigator.userAgent.slice(0, 50);
}

/**
 * Hook for rate limiting in React components.
 */
export function useRateLimiting(action: string, maxAttempts: number = 3) {
  const checkLimit = async (): Promise<boolean> => {
    const identifier = generateClientIdentifier();
    return checkRateLimit(identifier, action, maxAttempts);
  };

  return { checkLimit };
}
