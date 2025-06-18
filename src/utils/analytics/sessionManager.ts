
import { SessionData } from './types';
import { SessionStorage } from './sessionStorage';
import { LocationService } from './locationService';
import { MetadataCollector } from './metadataCollector';

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

    this.sessionData = {
      session_id: this.sessionId,
      ip_address: ipAddress,
      location: locationData,
      ...browserMetadata,
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
