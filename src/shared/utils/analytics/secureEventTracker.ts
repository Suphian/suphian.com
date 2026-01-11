
import supabase from '@/integrations/supabase/client';
import { getTrafficType } from './ipDetection';
import { SessionManager } from './sessionManager';
import { EventBatcher } from './eventBatcher';
import { EventSanitizer } from './eventSanitizer';
import { validateEventData } from '../security/security';
import { EventTrackerConfig, EventData, SessionData } from './types';
import { analyticsConsole } from './consoleLogger';

class SecureEventTracker {
  private config: EventTrackerConfig;
  private sessionManager: SessionManager;
  private eventBatcher: EventBatcher;
  private isInitialized = false;
  private isInternalTraffic = false;
  private pendingEvents: { name: string; payload: any }[] = [];

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
      this.config.batchIntervalMs || 30000,
      supabase
    );

    if (import.meta.env.DEV) {
      // Debug logging removed for cleaner production code
    }
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      
      const trafficType = await getTrafficType();
      this.isInternalTraffic = trafficType === 'internal';
      
      await this.sessionManager.collectSessionMetadata(this.isInternalTraffic);
      
      // Wait for session to be stored before starting event tracking
      await this.sessionManager.storeSession(supabase);
      
      this.eventBatcher.startBatchTimer(() => this.eventBatcher.flush(supabase));
      
      this.isInitialized = true;

      // Process any pending events that were queued before initialization
      if (this.pendingEvents.length > 0) {
        analyticsConsole.log('pending_events_processing', { count: this.pendingEvents.length });
        this.pendingEvents.forEach(event => {
          this.trackEvent(event.name, event.payload);
        });
        this.pendingEvents = [];
      }
    } catch (error) {
      console.error('❌ Failed to initialize secure event tracker:', error);
    }
  }

  public trackEvent(eventName: string, eventPayload: any = {}): void {
    if (!this.isInitialized) {
      this.pendingEvents.push({ name: eventName, payload: eventPayload });
      return;
    }

    // Validate event data before processing
    const validation = validateEventData({ event_name: eventName, event_payload: eventPayload });
    if (!validation.isValid) {
      console.error('❌ Invalid event data:', validation.errors);
      return;
    }

    // Log to analytics console (development only)
    analyticsConsole.log(eventName, {
      ...eventPayload,
      _traffic: this.isInternalTraffic ? 'internal' : 'external'
    }, this.sessionManager.getSessionId());

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

    // Add event to batcher (non-blocking)
    this.eventBatcher.addEvent(eventData);
    
    // Also send to Google Analytics if available (use requestIdleCallback for non-critical)
    if (typeof window.gtag === 'function') {
      const sendToGA = () => {
        window.gtag('event', eventName, enrichedPayload);
      };
      
      // Use requestIdleCallback for non-critical GA events to avoid blocking main thread
      if ('requestIdleCallback' in window && eventName !== 'page_view') {
        requestIdleCallback(sendToGA, { timeout: 2000 });
      } else {
        sendToGA();
      }
    }
  }

  public destroy(): void {
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

// Export secure singleton instance with optimized batching
export const secureEventTracker = new SecureEventTracker({
  enableInDevelopment: true,
  batchSize: 10, // Increased batch size for better efficiency
  batchIntervalMs: 20000, // 20 seconds - optimized for performance
  filterInternalTraffic: false // Track internal traffic but classify it
});

export default secureEventTracker;
