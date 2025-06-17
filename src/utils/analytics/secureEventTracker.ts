import { UAParser } from 'ua-parser-js';
import supabase from '@/integrations/supabase/client';
import { getTrafficType } from './ipDetection';

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
  retried?: boolean; // Add this to support retry logic
}

class SecureEventTracker {
  private config: EventTrackerConfig;
  private sessionId: string;
  private sessionData: SessionData | null = null;
  private eventBuffer: EventData[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private sessionStored = false;

  constructor(config: EventTrackerConfig = {}) {
    this.config = {
      enableInDevelopment: true,
      batchSize: 5,
      batchIntervalMs: 3000,
      ...config
    };

    this.sessionId = this.getOrCreateSessionId();
    console.log('🔒 SecureEventTracker constructor - Session ID:', this.sessionId);
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('🔒 SecureEventTracker already initialized');
      return;
    }

    try {
      console.log('🔒 Starting SecureEventTracker initialization...');
      await this.collectSessionMetadata();
      console.log('🔒 Session metadata collected:', this.sessionData);
      
      await this.storeSession();
      console.log('🔒 Session storage completed');
      
      this.startBatchTimer();
      
      this.isInitialized = true;
      console.log('✅ Secure event tracker initialized successfully for session:', this.sessionId);
    } catch (error) {
      console.error('❌ Failed to initialize secure event tracker:', error);
      // Don't throw - allow the app to continue without analytics
    }
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('secure_analytics_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem('secure_analytics_session_id', sessionId);
      console.log('🔒 Created new session ID:', sessionId);
    } else {
      console.log('🔒 Using existing session ID:', sessionId);
    }
    return sessionId;
  }

  private async collectSessionMetadata(): Promise<void> {
    console.log('🔒 Collecting session metadata...');
    const parser = new UAParser();
    const result = parser.getResult();

    let locationData = null;
    let ipAddress = null;
    let isInternal = false;

    try {
      console.log('🔒 Fetching IP and location data...');
      const ipResponse = await fetch('https://ipapi.co/json/');
      const ipData = await ipResponse.json();
      
      ipAddress = ipData.ip;
      console.log('🔒 Got IP address:', ipAddress);
      
      const trafficType = await getTrafficType();
      isInternal = trafficType === 'internal';
      console.log('🔒 Traffic type detected:', trafficType, '- Is internal user:', isInternal);
      
      locationData = {
        country: ipData.country_name,
        region: ipData.region,
        city: ipData.city,
        timezone: ipData.timezone
      };
      console.log('🔒 Location data:', locationData);
    } catch (error) {
      console.log('⚠️ Could not fetch location data:', error);
      
      const internalDomains = ['localhost', '127.0.0.1'];
      isInternal = internalDomains.some(domain => 
        window.location.hostname.includes(domain)
      );
      console.log('🔒 Using fallback hostname check - Is internal user:', isInternal);
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

    console.log('🔒 Complete session data prepared:', this.sessionData);
  }

  private async storeSession(): Promise<void> {
    if (!this.sessionData || this.sessionStored) {
      console.log('🔒 Session already stored or no session data');
      return;
    }

    try {
      console.log('🔒 Attempting to store session in Supabase...');
      console.log('🔒 Using Supabase client with anon key');
      
      // Ensure we're using the anon client (no auth required)
      const { data, error } = await supabase
        .from('sessions')
        .insert(this.sessionData);

      if (error) {
        console.error('❌ Failed to store session - Supabase error:', error);
        console.error('❌ Error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        
        // Try with upsert as backup
        console.log('🔄 Trying upsert as backup...');
        const { data: upsertData, error: upsertError } = await supabase
          .from('sessions')
          .upsert(this.sessionData, { 
            onConflict: 'session_id',
            ignoreDuplicates: false 
          });
          
        if (upsertError) {
          console.error('❌ Upsert also failed:', upsertError);
          throw upsertError;
        } else {
          this.sessionStored = true;
          console.log('✅ Session stored successfully via upsert!');
          console.log('✅ Upsert response data:', upsertData);
        }
      } else {
        this.sessionStored = true;
        console.log('✅ Session stored successfully in Supabase!');
        console.log('✅ Response data:', data);
      }
    } catch (error) {
      console.error('❌ Critical error storing session:', error);
      // Don't throw - allow tracking to continue without session storage
    }
  }

  public trackEvent(eventName: string, eventPayload: any = {}): void {
    if (!this.isInitialized) {
      console.warn('⚠️ Cannot track event: tracker not initialized yet, queuing event...');
      // Queue the event for later
      setTimeout(() => this.trackEvent(eventName, eventPayload), 1000);
      return;
    }

    console.log('🔒 Tracking event:', eventName, eventPayload);

    const sanitizedPayload = this.sanitizeEventPayload(eventPayload);

    const eventData: EventData = {
      session_id: this.sessionId,
      event_name: eventName,
      event_payload: sanitizedPayload,
      timestamp: new Date().toISOString(),
      page_url: window.location.href
    };

    this.eventBuffer.push(eventData);
    console.log('🔒 Event added to buffer. Buffer size:', this.eventBuffer.length);
    
    if (this.eventBuffer.length >= (this.config.batchSize || 5)) {
      console.log('🔒 Buffer full, flushing events...');
      this.flushEvents();
    }
  }

  private sanitizeEventPayload(payload: any): any {
    if (!payload) return payload;

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

    console.log('🔒 Starting batch timer...');
    this.batchTimer = setInterval(() => {
      if (this.eventBuffer.length > 0) {
        console.log('🔒 Timer triggered, flushing', this.eventBuffer.length, 'events');
        this.flushEvents();
      }
    }, this.config.batchIntervalMs || 3000);
  }

  private async flushEvents(): Promise<void> {
    if (this.eventBuffer.length === 0) {
      console.log('🔒 No events to flush');
      return;
    }

    const eventsToFlush = [...this.eventBuffer];
    this.eventBuffer = [];

    try {
      console.log('🔒 Flushing', eventsToFlush.length, 'events to Supabase...');
      
      const { data, error } = await supabase
        .from('events')
        .insert(eventsToFlush);

      if (error) {
        console.error('❌ Failed to store events:', error);
        console.error('❌ Event error details:', {
          code: error.code,
          message: error.message,
          details: error.details
        });
        // Put events back in buffer for retry (but only once)
        if (!eventsToFlush[0]?.retried) {
          eventsToFlush.forEach(event => event.retried = true);
          this.eventBuffer.unshift(...eventsToFlush);
        }
      } else {
        console.log(`✅ Stored ${eventsToFlush.length} events successfully!`);
        console.log('✅ Events response:', data);
      }
    } catch (error) {
      console.error('❌ Error flushing events:', error);
    }
  }

  public destroy(): void {
    console.log('🔒 Destroying event tracker...');
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    this.flushEvents();
    this.isInitialized = false;
    this.sessionStored = false;
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
  console.log('🔒 Auto-initializing secure event tracker...');
  secureEventTracker.initialize();
}

export default secureEventTracker;
