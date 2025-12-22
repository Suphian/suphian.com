
import { SessionData } from './types';
import { SessionStorage } from './sessionStorage';
import { LocationService } from './locationService';
import { MetadataCollector } from './metadataCollector';
import { validateSessionData } from '../security';
import { VisitorTracking } from './visitorTracking';
import supabase from '@/integrations/supabase/client';

export class SessionManager {
  private sessionId: string;
  private sessionData: SessionData | null = null;
  private sessionStored = false;

  constructor() {
    this.sessionId = SessionStorage.getOrCreateSessionId();
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
    
    const browserMetadata = MetadataCollector.collectBrowserMetadata();
    const { ipAddress, locationData } = await LocationService.fetchLocationData();
    const enhancedData = {
      visitorData: VisitorTracking.getOrCreateVisitorData(),
      referrerInfo: VisitorTracking.analyzeReferrer(),
      utmParams: VisitorTracking.parseUTMParameters(),
      isInternal: VisitorTracking.detectInternalTraffic()
    };

    // Anonymize IP address for privacy before storing
    const anonymizedIp = ipAddress ? await this.anonymizeIpAddress(ipAddress) : null;
    
    const rawSessionData = {
      session_id: this.sessionId,
      visitor_id: enhancedData.visitorData.visitor_id,
      visit_count: enhancedData.visitorData.visit_count,
      ip_address: anonymizedIp, // Store anonymized IP for privacy
      location: locationData,
      city: locationData?.city || null,
      region: locationData?.region || null,
      country: locationData?.country || null,
      referrer: enhancedData.referrerInfo.referrer,
      referrer_source: enhancedData.referrerInfo.referrer_source,
      referrer_detail: enhancedData.referrerInfo.referrer_detail,
      utm_source: enhancedData.utmParams.utm_source || null,
      utm_medium: enhancedData.utmParams.utm_medium || null,
      utm_campaign: enhancedData.utmParams.utm_campaign || null,
      utm_content: enhancedData.utmParams.utm_content || null,
      utm_term: enhancedData.utmParams.utm_term || null,
      landing_url: window.location.href,
      ...browserMetadata,
      is_internal_user: enhancedData.isInternal || isInternalTraffic
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
    // console.log('🔒 Enhanced session data prepared:', this.sessionData);
  }

  async storeSession(supabase: any): Promise<void> {
    if (!this.sessionData || this.sessionStored) {
      if (import.meta.env.DEV) {
        // console.log('🔒 Session already stored or no session data');
      }
      return;
    }

    try {
      if (import.meta.env.DEV) {
        // console.log('🔒 Attempting to store session in Supabase...');
      }
      
      // Try to insert the session with error handling
      const { data, error } = await supabase
        .from('sessions')
        .insert(this.sessionData);

      if (error) {
        console.error('⚠️ Session storage failed:', error.message, error);
        // Mark as stored regardless to prevent retries
        this.sessionStored = true;
        return;
      }

      this.sessionStored = true;
    } catch (error) {
      console.error('⚠️ Session storage error:', error);
      // Mark as stored to prevent infinite retries
      this.sessionStored = true;
    }
  }

  private async anonymizeIpAddress(ipAddress: string): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('anonymize_ip', { ip_address: ipAddress });
      if (error) {
        console.warn('IP anonymization failed:', error);
        return null; // Return null for privacy if anonymization fails
      }
      return data;
    } catch (error) {
      console.warn('IP anonymization error:', error);
      return null; // Return null for privacy if anonymization fails
    }
  }
}
