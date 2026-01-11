/**
 * Unified traffic detection utility.
 * Consolidates detection logic from ipDetection.ts and VisitorTracking.detectInternalTraffic()
 */

const DEVELOPMENT_HOSTS = [
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  'lovable.dev',
  'lovableproject.com'
] as const;

const INTERNAL_USER_AGENT_PATTERNS = [
  'lovable',
  'internal-qa'
] as const;

export class TrafficDetector {
  /**
   * Synchronously check if current traffic should be classified as internal.
   * Checks URL params, user agent, and hostname.
   */
  static isInternalTraffic(): boolean {
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);

    // Check for explicit internal flag
    if (urlParams.get('internal') === 'true') {
      return true;
    }

    // Check for Lovable-specific tokens/parameters
    if (urlParams.get('__lovable_token')) {
      return true;
    }

    // Check user agent for known internal patterns
    const userAgent = navigator.userAgent.toLowerCase();
    if (INTERNAL_USER_AGENT_PATTERNS.some(pattern => userAgent.includes(pattern))) {
      return true;
    }

    // Check hostname for development indicators
    const hostname = window.location.hostname;

    // Direct match against development hosts
    if (DEVELOPMENT_HOSTS.some(host => hostname === host)) {
      return true;
    }

    // Check for subdomains of development hosts
    if (hostname.endsWith('.lovable.dev') || hostname.endsWith('.lovableproject.com')) {
      return true;
    }

    // Check for preview URLs
    if (hostname.includes('lovable') || hostname.includes('preview')) {
      return true;
    }

    return false;
  }

  /**
   * Get traffic type classification (async for backward compatibility).
   * Returns 'internal' for development/test traffic, 'external' for production visitors.
   */
  static async getTrafficType(): Promise<'internal' | 'external'> {
    return this.isInternalTraffic() ? 'internal' : 'external';
  }

  /**
   * Synchronous version of getTrafficType for use in non-async contexts.
   */
  static getTrafficTypeSync(): 'internal' | 'external' {
    return this.isInternalTraffic() ? 'internal' : 'external';
  }
}

// Export standalone function for backward compatibility
export async function getTrafficType(): Promise<'internal' | 'external'> {
  return TrafficDetector.getTrafficType();
}

export function isInternalTraffic(): boolean {
  return TrafficDetector.isInternalTraffic();
}
