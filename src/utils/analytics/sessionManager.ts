
import { SessionData } from './types';
import { SessionStorage } from './sessionStorage';
import { LocationService } from './locationService';
import { MetadataCollector } from './metadataCollector';
import { validateSessionData } from '../security';

export class SessionManager {
  private sessionId: string;
  private sessionData: SessionData | null = null;
  private sessionStored = false;

  constructor() {
    this.sessionId = SessionStorage.getOrCreateSessionId();
    console.log('🔒 SessionManager constructor - Session ID:', this.sessionId);
  }

  getSessionId(): string {
    return this.sessionId;
  }

  getSessionData(): SessionData | null {
    return this.sessionData;
  }

  isSessionStored(): boolean {
    return this.sessionStored;
  }

  async collectSessionMetadata(isInternalTraffic: boolean): Promise<void> {
    console.log('🔒 Collecting session metadata...');
    
    const browserMetadata = MetadataCollector.collectBrowserMetadata();
    const { ipAddress, locationData } = await LocationService.fetchLocationData();

    const rawSessionData = {
      session_id: this.sessionId,
      ip_address: ipAddress,
      location: locationData,
      ...browserMetadata,
      is_internal_user: isInternalTraffic
    };

    // Validate session data
    const validation = validateSessionData(rawSessionData);
    if (!validation.isValid) {
      console.warn('⚠️ Session data validation warnings:', validation.errors);
      // Clean up invalid data
      if (rawSessionData.screen_width && (rawSessionData.screen_width < 0 || rawSessionData.screen_width > 10000)) {
        rawSessionData.screen_width = null;
      }
      if (rawSessionData.screen_height && (rawSessionData.screen_height < 0 || rawSessionData.screen_height > 10000)) {
        rawSessionData.screen_height = null;
      }
      if (rawSessionData.viewport_width && (rawSessionData.viewport_width < 0 || rawSessionData.viewport_width > 10000)) {
        rawSessionData.viewport_width = null;
      }
      if (rawSessionData.viewport_height && (rawSessionData.viewport_height < 0 || rawSessionData.viewport_height > 10000)) {
        rawSessionData.viewport_height = null;
      }
      if (rawSessionData.user_agent && rawSessionData.user_agent.length > 1000) {
        rawSessionData.user_agent = rawSessionData.user_agent.slice(0, 1000);
      }
    }

    this.sessionData = rawSessionData;
    console.log('🔒 Complete session data prepared:', this.sessionData);
  }

  async storeSession(supabase: any): Promise<void> {
    if (!this.sessionData || this.sessionStored) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 Session already stored or no session data');
      }
      return;
    }

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 Attempting to store session in Supabase...');
      }
      
      // Try to insert the session with error handling
      const { data, error } = await supabase
        .from('sessions')
        .insert(this.sessionData)
        .select();

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ Session storage failed (continuing normally):', error.message);
        }
        // Mark as stored regardless to prevent retries
        this.sessionStored = true;
        return;
      }

      this.sessionStored = true;
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Session stored successfully in Supabase!');
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Session storage error (continuing normally):', error);
      }
      // Mark as stored to prevent infinite retries
      this.sessionStored = true;
    }
  }
}
