
import { UAParser } from 'ua-parser-js';
import supabase from '@/integrations/supabase/client';

interface EventTrackerConfig {
  enableInDevelopment?: boolean;
  batchSize?: number;
  batchIntervalMs?: number;
}

interface SessionData {
  session_id: string;
  ip_address?: string;
  location?: any;
  browser?: string;
  os?: string;
  device_type?: string;
  screen_width?: number;
  screen_height?: number;
  viewport_width?: number;
  viewport_height?: number;
  timezone?: string;
  locale?: string;
  referrer?: string;
  landing_url?: string;
  user_agent?: string;
  is_internal_user?: boolean;
}

interface EventData {
  session_id: string;
  event_name: string;
  event_payload?: any;
  timestamp: string;
  page_url?: string;
}

class SecureEventTracker {
  private config: EventTrackerConfig;
  private sessionId: string;
  private sessionData: SessionData | null = null;
  private eventBuffer: EventData[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private internalDomains = ['localhost', '127.0.0.1'];

  constructor(config: EventTrackerConfig = {}) {
    this.config = {
      enableInDevelopment: false,
      batchSize: 10,
      batchIntervalMs: 5000,
      ...config
    };

    this.sessionId = this.getOrCreateSessionId();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Skip in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !this.config.enableInDevelopment) {
      console.log('🔒 Event tracking disabled in development for security');
      return;
    }

    try {
      await this.collectSessionMetadata();
      await this.storeSession();
      this.startBatchTimer();
      
      this.isInitialized = true;
      console.log('🔒 Secure event tracker initialized for session:', this.sessionId);
    } catch (error) {
      console.error('Failed to initialize secure event tracker:', error);
    }
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('secure_analytics_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('secure_analytics_session_id', sessionId);
    }
    return sessionId;
  }

  private async collectSessionMetadata(): Promise<void> {
    const parser = new UAParser();
    const result = parser.getResult();

    let locationData = null;
    let ipAddress = null;
    let isInternal = false;

    try {
      // Only collect basic location data, no precise coordinates
      const ipResponse = await fetch('https://ipapi.co/json/');
      const ipData = await ipResponse.json();
      
      ipAddress = ipData.ip;
      
      // Check if internal based on domain rather than hardcoded IPs
      isInternal = this.internalDomains.some(domain => 
        window.location.hostname.includes(domain)
      );
      
      // Only store country/region level data, no precise coordinates
      locationData = {
        country: ipData.country_name,
        region: ipData.region,
        city: ipData.city,
        timezone: ipData.timezone
        // Removed: latitude, longitude, postal for privacy
      };
    } catch (error) {
      console.log('Could not fetch location data:', error);
    }

    this.sessionData = {
      session_id: this.sessionId,
      ip_address: ipAddress,
      location: locationData,
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
      user_agent: navigator.userAgent,
      is_internal_user: isInternal
    };
  }

  private async storeSession(): Promise<void> {
    if (!this.sessionData) return;

    try {
      const { error } = await supabase
        .from('sessions')
        .upsert(this.sessionData, { 
          onConflict: 'session_id' 
        });

      if (error) {
        console.error('Failed to store session:', error);
      } else {
        console.log('✅ Secure session stored successfully');
      }
    } catch (error) {
      console.error('Error storing session:', error);
    }
  }

  public trackEvent(eventName: string, eventPayload: any = {}): void {
    if (!this.isInitialized) return;

    // Sanitize event payload to remove sensitive data
    const sanitizedPayload = this.sanitizeEventPayload(eventPayload);

    const eventData: EventData = {
      session_id: this.sessionId,
      event_name: eventName,
      event_payload: sanitizedPayload,
      timestamp: new Date().toISOString(),
      page_url: window.location.href
    };

    this.eventBuffer.push(eventData);
    
    if (this.eventBuffer.length >= (this.config.batchSize || 10)) {
      this.flushEvents();
    }
  }

  private sanitizeEventPayload(payload: any): any {
    if (!payload) return payload;

    // Remove potentially sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    const sanitized = { ...payload };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        delete sanitized[field];
      }
    }

    return sanitized;
  }

  private startBatchTimer(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    this.batchTimer = setInterval(() => {
      if (this.eventBuffer.length > 0) {
        this.flushEvents();
      }
    }, this.config.batchIntervalMs || 5000);
  }

  private async flushEvents(): Promise<void> {
    if (this.eventBuffer.length === 0) return;

    const eventsToFlush = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      const { error } = await supabase
        .from('events')
        .insert(eventsToFlush);

      if (error) {
        console.error('Failed to store events:', error);
        this.eventBuffer.unshift(...eventsToFlush);
      } else {
        console.log(`✅ Stored ${eventsToFlush.length} secure events`);
      }
    } catch (error) {
      console.error('Error flushing events:', error);
      this.eventBuffer.unshift(...eventsToFlush);
    }
  }

  public destroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    this.flushEvents();
    this.isInitialized = false;
  }

  public track(eventName: string, eventPayload: any = {}): void {
    this.trackEvent(eventName, eventPayload);
  }

  public getSessionInfo(): { sessionId: string; sessionData: SessionData | null } {
    return {
      sessionId: this.sessionId,
      sessionData: this.sessionData
    };
  }
}

// Export secure singleton instance
export const secureEventTracker = new SecureEventTracker({
  enableInDevelopment: true,
  batchSize: 5,
  batchIntervalMs: 3000
});

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  secureEventTracker.initialize();
}

export default secureEventTracker;
