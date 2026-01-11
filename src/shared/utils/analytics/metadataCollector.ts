/**
 * @deprecated Use MetadataService from './metadataService' instead.
 * This file re-exports for backward compatibility.
 */

import { MetadataService } from './metadataService';

export interface BrowserMetadata {
  browser: string;
  os: string;
  device_type: string;
  screen_width: number;
  screen_height: number;
  viewport_width: number;
  viewport_height: number;
  timezone: string;
  locale: string;
  referrer: string | null;
  landing_url: string;
  user_agent: string;
}

export class MetadataCollector {
  static collectBrowserMetadata(): BrowserMetadata {
    return MetadataService.collectBrowserMetadata();
  }
}
