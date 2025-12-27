
import { UAParser } from 'ua-parser-js';

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
    // console.log('🔒 Collecting browser metadata...');
    const parser = new UAParser();
    const result = parser.getResult();

    return {
      browser: `${result.browser.name} ${result.browser.version}`,
      os: `${result.os.name} ${result.os.version}`,
      device_type: result.device.type || 'desktop',
      screen_width: window.screen.width,
      screen_height: window.screen.height,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: navigator.language,
      referrer: document.referrer || null,
      landing_url: window.location.href,
      user_agent: navigator.userAgent
    };
  }
}
