/**
 * Rate limiting utilities for contact forms and other user actions.
 */

import supabase from "@/integrations/supabase/client";
import { formLogger } from "@/shared/utils/logging";

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
 * Uses a combination of user agent and URL for browser-based identification.
 */
export function generateClientIdentifier(): string {
  const baseIdentifier = window.navigator.userAgent + window.location.href;
  return 'browser_' + baseIdentifier.slice(0, 50);
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
