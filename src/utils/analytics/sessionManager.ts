
import { UAParser } from 'ua-parser-js';
import { SessionData } from './types';

export class SessionManager {
  private sessionId: string;
  private sessionData: SessionData | null = null;
  private sessionStored = false;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
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

  async collectSessionMetadata(isInternalTraffic: boolean): Promise<void> {
    console.log('🔒 Collecting session metadata...');
    const parser = new UAParser();
    const result = parser.getResult();

    let locationData = null;
    let ipAddress = null;

    try {
      console.log('🔒 Fetching IP and location data...');
      const ipResponse = await fetch('https://ipapi.co/json/');
      const ipData = await ipResponse.json();
      
      ipAddress = ipData.ip;
      console.log('🔒 Got IP address:', ipAddress);
      
      locationData = {
        country: ipData.country_name,
        region: ipData.region,
        city: ipData.city,
        timezone: ipData.timezone
      };
      console.log('🔒 Location data:', locationData);
    } catch (error) {
      console.log('⚠️ Could not fetch location data:', error);
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
      is_internal_user: isInternalTraffic
    };

    console.log('🔒 Complete session data prepared:', this.sessionData);
  }

  async storeSession(supabase: any): Promise<void> {
    if (!this.sessionData || this.sessionStored) {
      console.log('🔒 Session already stored or no session data');
      return;
    }

    try {
      console.log('🔒 Attempting to store session in Supabase...');
      console.log('🔒 Using Supabase client with anon key');
      
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
    }
  }
}
