
import { UAParser } from 'ua-parser-js';
import supabase from '@/integrations/supabase/client';

interface EventTrackerConfig {
  internalIPs?: string[];
  eventWhitelist?: string[];
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

class EventTracker {
  private config: EventTrackerConfig;
  private sessionId: string;
  private sessionData: SessionData | null = null;
  private eventBuffer: EventData[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private originalConsoleLog: any;
  private isInitialized = false;

  constructor(config: EventTrackerConfig = {}) {
    this.config = {
      internalIPs: ['70.23.218.121', '2600:4040:9074:300:20fd:4959:4e97:a68e'],
      enableInDevelopment: false,
      batchSize: 10,
      batchIntervalMs: 5000,
      ...config
    };

    // Generate or retrieve session ID
    this.sessionId = this.getOrCreateSessionId();
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Skip in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !this.config.enableInDevelopment) {
      console.log('Event tracking disabled in development');
      return;
    }

    try {
      // Collect session metadata
      await this.collectSessionMetadata();
      
      // Store session in Supabase
      await this.storeSession();
      
      // Intercept console.log
      this.interceptConsoleLog();
      
      // Start batch timer
      this.startBatchTimer();
      
      this.isInitialized = true;
      console.log('🚀 Event tracker initialized for session:', this.sessionId);
    } catch (error) {
      console.error('Failed to initialize event tracker:', error);
    }
  }

  private getOrCreateSessionId(): string {
    let sessionId = localStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  private async collectSessionMetadata(): Promise<void> {
    const parser = new UAParser();
    const result = parser.getResult();

    // Get location data
    let locationData = null;
    let ipAddress = null;
    let isInternal = false;

    try {
      const ipResponse = await fetch('https://ipapi.co/json/');
      const ipData = await ipResponse.json();
      
      ipAddress = ipData.ip;
      isInternal = this.config.internalIPs?.includes(ipData.ip) || false;
      
      locationData = {
        country: ipData.country_name,
        region: ipData.region,
        city: ipData.city,
        postal: ipData.postal,
        latitude: ipData.latitude,
        longitude: ipData.longitude,
        timezone: ipData.timezone,
        org: ipData.org
      };
    } catch (error) {
      console.log('Could not fetch IP/location data:', error);
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
        console.log('✅ Session stored successfully');
      }
    } catch (error) {
      console.error('Error storing session:', error);
    }
  }

  private interceptConsoleLog(): void {
    this.originalConsoleLog = console.log;
    
    console.log = (...args: any[]) => {
      // Call original console.log first
      this.originalConsoleLog.apply(console, args);
      
      // Check if this looks like a structured event
      if (args.length > 0) {
        const firstArg = args[0];
        
        // Look for structured events
        if (typeof firstArg === 'object' && firstArg.event) {
          this.trackEvent(firstArg.event, firstArg);
        }
        
        // Look for string patterns that indicate events
        if (typeof firstArg === 'string') {
          if (firstArg.includes('🎯') || firstArg.includes('📍') || firstArg.includes('✅')) {
            this.trackEvent('console_event', {
              message: firstArg,
              args: args.slice(1)
            });
          }
        }
      }
    };
  }

  public trackEvent(eventName: string, eventPayload: any = {}): void {
    // Check whitelist if configured
    if (this.config.eventWhitelist && !this.config.eventWhitelist.includes(eventName)) {
      return;
    }

    const eventData: EventData = {
      session_id: this.sessionId,
      event_name: eventName,
      event_payload: eventPayload,
      timestamp: new Date().toISOString(),
      page_url: window.location.href
    };

    this.eventBuffer.push(eventData);
    
    // Flush buffer if it reaches batch size
    if (this.eventBuffer.length >= (this.config.batchSize || 10)) {
      this.flushEvents();
    }
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
        // Put events back in buffer for retry
        this.eventBuffer.unshift(...eventsToFlush);
      } else {
        console.log(`✅ Stored ${eventsToFlush.length} events`);
      }
    } catch (error) {
      console.error('Error flushing events:', error);
      // Put events back in buffer for retry
      this.eventBuffer.unshift(...eventsToFlush);
    }
  }

  public destroy(): void {
    // Restore original console.log
    if (this.originalConsoleLog) {
      console.log = this.originalConsoleLog;
    }

    // Clear timer
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    // Flush remaining events
    this.flushEvents();

    this.isInitialized = false;
  }

  // Manual event tracking method
  public track(eventName: string, eventPayload: any = {}): void {
    this.trackEvent(eventName, eventPayload);
  }

  // Get current session info
  public getSessionInfo(): { sessionId: string; sessionData: SessionData | null } {
    return {
      sessionId: this.sessionId,
      sessionData: this.sessionData
    };
  }
}

// Export singleton instance
export const eventTracker = new EventTracker({
  internalIPs: ['70.23.218.121', '2600:4040:9074:300:20fd:4959:4e97:a68e'],
  enableInDevelopment: true, // Enable for testing
  batchSize: 5,
  batchIntervalMs: 3000
});

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  eventTracker.initialize();
}

export default eventTracker;
