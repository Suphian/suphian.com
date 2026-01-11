/**
 * Unified metadata collection service.
 * Consolidates MetadataCollector, visitorMetadata, and SessionManager metadata collection.
 *
 * Single source of truth for all browser/visitor metadata.
 */

import { UAParser } from 'ua-parser-js';
import { TrafficDetector } from './trafficDetector';
import { getOriginalAttribution } from './attribution';

// Viewport cache to prevent layout thrashing
let cachedViewport = { width: 0, height: 0 };
let viewportCacheTime = 0;
const VIEWPORT_CACHE_TTL = 1000; // 1 second

// Full metadata cache
let cachedMetadata: UnifiedMetadata | null = null;
let metadataPromise: Promise<UnifiedMetadata> | null = null;

export interface BrowserInfo {
  browser: string;
  os: string;
  device_type: string;
  user_agent: string;
}

export interface ScreenInfo {
  screen_width: number;
  screen_height: number;
  viewport_width: number;
  viewport_height: number;
}

export interface LocaleInfo {
  timezone: string;
  locale: string;
  languages: readonly string[];
  platform: string;
}

export interface TrafficInfo {
  referrer: string | null;
  landing_url: string;
  traffic_type: 'internal' | 'external';
}

export interface AttributionInfo {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  original_referrer?: string | null;
  original_landing_path?: string;
  original_landing_url?: string;
  original_source?: string;
  attribution_ts?: string;
}

export interface UnifiedMetadata extends BrowserInfo, ScreenInfo, LocaleInfo, TrafficInfo, AttributionInfo {
  timestamp: string;
}

export class MetadataService {
  /**
   * Get cached viewport dimensions to avoid layout thrashing.
   */
  static getCachedViewport(): { width: number; height: number } {
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
   * Collect browser information using UA parser.
   */
  static collectBrowserInfo(): BrowserInfo {
    const parser = new UAParser();
    const result = parser.getResult();

    return {
      browser: `${result.browser.name || 'Unknown'} ${result.browser.version || ''}`.trim(),
      os: `${result.os.name || 'Unknown'} ${result.os.version || ''}`.trim(),
      device_type: result.device.type || 'desktop',
      user_agent: navigator.userAgent
    };
  }

  /**
   * Collect screen and viewport information.
   */
  static collectScreenInfo(): ScreenInfo {
    const viewport = this.getCachedViewport();

    return {
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      viewport_width: viewport.width,
      viewport_height: viewport.height
    };
  }

  /**
   * Collect locale and platform information.
   */
  static collectLocaleInfo(): LocaleInfo {
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: navigator.language,
      languages: navigator.languages,
      platform: navigator.platform
    };
  }

  /**
   * Collect traffic source information.
   */
  static async collectTrafficInfo(): Promise<TrafficInfo> {
    const trafficType = await TrafficDetector.getTrafficType();

    return {
      referrer: document.referrer || null,
      landing_url: window.location.href,
      traffic_type: trafficType
    };
  }

  /**
   * Collect full unified metadata with caching.
   * Uses requestIdleCallback when available for non-critical collection.
   */
  static async collectMetadata(): Promise<UnifiedMetadata> {
    // Return cached metadata if available
    if (cachedMetadata) {
      return cachedMetadata;
    }

    // Return in-flight promise if collection is already in progress
    if (metadataPromise) {
      return metadataPromise;
    }

    // Start collection
    metadataPromise = this._collectMetadata();
    cachedMetadata = await metadataPromise;
    return cachedMetadata;
  }

  private static async _collectMetadata(): Promise<UnifiedMetadata> {
    const collectAll = async (): Promise<UnifiedMetadata> => {
      const browserInfo = this.collectBrowserInfo();
      const screenInfo = this.collectScreenInfo();
      const localeInfo = this.collectLocaleInfo();
      const trafficInfo = await this.collectTrafficInfo();
      const attribution = getOriginalAttribution();

      return {
        ...browserInfo,
        ...screenInfo,
        ...localeInfo,
        ...trafficInfo,
        ...attribution,
        timestamp: new Date().toISOString()
      };
    };

    // Use requestIdleCallback for non-critical collection if available
    if ('requestIdleCallback' in window) {
      return new Promise((resolve) => {
        requestIdleCallback(
          async () => {
            resolve(await collectAll());
          },
          { timeout: 1000 }
        );
      });
    }

    return collectAll();
  }

  /**
   * Synchronous collection of basic browser metadata (no traffic type).
   * Use this when you need metadata immediately without async.
   */
  static collectBrowserMetadata(): BrowserInfo & ScreenInfo & LocaleInfo & { referrer: string | null; landing_url: string } {
    return {
      ...this.collectBrowserInfo(),
      ...this.collectScreenInfo(),
      ...this.collectLocaleInfo(),
      referrer: document.referrer || null,
      landing_url: window.location.href
    };
  }

  /**
   * Invalidate the metadata cache.
   * Call this when you know viewport or other data has changed significantly.
   */
  static invalidateCache(): void {
    cachedMetadata = null;
    metadataPromise = null;
    viewportCacheTime = 0;
  }

  /**
   * Force refresh viewport cache.
   */
  static refreshViewportCache(): void {
    cachedViewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };
    viewportCacheTime = Date.now();
  }
}

// Export standalone function for backward compatibility with visitorMetadata.ts
export async function getVisitorMetaData(): Promise<UnifiedMetadata> {
  return MetadataService.collectMetadata();
}
