
import supabase from '@/integrations/supabase/client';
import { getTrafficType } from './ipDetection';
import { SessionManager } from './sessionManager';
import { EventBatcher } from './eventBatcher';
import { EventSanitizer } from './eventSanitizer';
import { validateEventData } from '../security';
import { EventTrackerConfig, EventData, SessionData } from './types';

class SecureEventTracker {
  private config: EventTrackerConfig;
  private sessionManager: SessionManager;
  private eventBatcher: EventBatcher;
  private isInitialized = false;
  private isInternalTraffic = false;

  constructor(config: EventTrackerConfig = {}) {
    this.config = {
      enableInDevelopment: true,
      batchSize: 5,
      batchIntervalMs: 3000,
      filterInternalTraffic: false, // Changed to false to track but classify internal traffic
      ...config
    };

    this.sessionManager = new SessionManager();
    this.eventBatcher = new EventBatcher(
      this.config.batchSize || 5,
      this.config.batchIntervalMs || 3000
    );

    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 SecureEventTracker constructor - Session ID:', this.sessionManager.getSessionId());
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 SecureEventTracker already initialized');
      }
      return;
    }

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 Starting SecureEventTracker initialization...');
      }
      
      const trafficType = await getTrafficType();
      this.isInternalTraffic = trafficType === 'internal';
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`🔒 Traffic classified as: ${trafficType.toUpperCase()}`);
      }
      
      await this.sessionManager.collectSessionMetadata(this.isInternalTraffic);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 Session metadata collected:', this.sessionManager.getSessionData());
      }
      
      // Wait for session to be stored before starting event tracking
      await this.sessionManager.storeSession(supabase);
      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 Session storage completed');
      }
      
      this.eventBatcher.startBatchTimer(() => this.eventBatcher.flush(supabase));
      
      this.isInitialized = true;
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Secure event tracker initialized successfully for session:', this.sessionManager.getSessionId());
      }
    } catch (error) {
      console.error('❌ Failed to initialize secure event tracker:', error);
    }
  }

  public trackEvent(eventName: string, eventPayload: any = {}): void {
    if (!this.isInitialized) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Tracker not initialized yet, discarding event:', eventName);
      }
      return;
    }

    // Validate event data before processing
    const validation = validateEventData({ event_name: eventName, event_payload: eventPayload });
    if (!validation.isValid) {
      console.error('❌ Invalid event data:', validation.errors);
      return;
    }

    if (process.env.NODE_ENV === 'development') {
      console.log(`🔒 Tracking event: ${eventName} (${this.isInternalTraffic ? 'INTERNAL' : 'EXTERNAL'} traffic)`, eventPayload);
    }

    const sanitizedPayload = EventSanitizer.sanitizeEventPayload(eventPayload);

    // Add traffic classification to event payload
    const enrichedPayload = {
      ...sanitizedPayload,
      is_internal_traffic: this.isInternalTraffic,
      traffic_type: this.isInternalTraffic ? 'internal' : 'external'
    };

    const eventData: EventData = {
      session_id: this.sessionManager.getSessionId(),
      event_name: eventName,
      event_payload: enrichedPayload,
      timestamp: new Date().toISOString(),
      page_url: window.location.href,
      is_internal_traffic: this.isInternalTraffic,
      traffic_type: this.isInternalTraffic ? 'internal' : 'external'
    };

    this.eventBatcher.addEvent(eventData);
  }

  public destroy(): void {
    console.log('🔒 Destroying event tracker...');
    this.eventBatcher.destroy();
    this.eventBatcher.flush(supabase);
    this.isInitialized = false;
  }

  public track(eventName: string, eventPayload: any = {}): void {
    this.trackEvent(eventName, eventPayload);
  }

  public getSessionInfo(): { sessionId: string; sessionData: SessionData | null } {
    return {
      sessionId: this.sessionManager.getSessionId(),
      sessionData: this.sessionManager.getSessionData()
    };
  }
}

// Export secure singleton instance with internal traffic tracking enabled
export const secureEventTracker = new SecureEventTracker({
  enableInDevelopment: true,
  batchSize: 5,
  batchIntervalMs: 3000,
  filterInternalTraffic: false // Track internal traffic but classify it
});

// Auto-initialize when module loads
if (typeof window !== 'undefined') {
  if (process.env.NODE_ENV === 'development') {
    console.log('🔒 Auto-initializing secure event tracker...');
  }
  secureEventTracker.initialize();
}

export default secureEventTracker;
