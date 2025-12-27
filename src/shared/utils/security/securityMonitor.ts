import supabase from '@/integrations/supabase/client';

export class SecurityMonitor {
  private static readonly SECURITY_EVENT_PREFIX = 'security_';

  // Log security-related events
  static async logSecurityEvent(
    eventType: 'suspicious_activity' | 'data_access',
    details: Record<string, any> = {}
  ): Promise<void> {
    try {
      // For non-auth events, we don't need user context
      const enrichedDetails = {
        ...details,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        url: window.location.href,
        ip_hash: await this.getHashedIP()
      };

      const securityEvent = {
        event_name: `${this.SECURITY_EVENT_PREFIX}${eventType}`,
        event_payload: enrichedDetails
      };

      // Log to events table for security monitoring
      await supabase.from('events').insert({
        session_id: crypto.randomUUID(),
        event_name: securityEvent.event_name,
        event_payload: securityEvent.event_payload,
        page_url: window.location.href,
        is_internal_traffic: false,
        traffic_type: 'security'
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 Security Event:', securityEvent);
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  // Hash IP for privacy-preserving monitoring
  private static async getHashedIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const { ip } = await response.json();
      
      // Simple hash for privacy (in production, use proper hashing)
      const encoder = new TextEncoder();
      const data = encoder.encode(ip + new Date().toDateString());
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 8);
    } catch {
      return 'unknown';
    }
  }

  // Monitor for suspicious activity patterns
  static async detectSuspiciousActivity(userId: string): Promise<boolean> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data: recentEvents } = await supabase
        .from('events')
        .select('event_name, created_at')
        .like('event_payload->>user_id', userId)
        .gte('created_at', oneHourAgo);

      if (!recentEvents) return false;

      // Check for suspicious patterns in general activity
      const suspiciousEvents = recentEvents.filter(e => 
        e.event_name.includes('suspicious')
      );
      
      if (suspiciousEvents.length > 3) {
        await this.logSecurityEvent('suspicious_activity', {
          reason: 'multiple_suspicious_events',
          count: suspiciousEvents.length,
          user_id: userId
        });
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to detect suspicious activity:', error);
      return false;
    }
  }

  // Log general data access events
  static async logDataAccess(action: string, resourceType: string): Promise<void> {
    await this.logSecurityEvent('data_access', {
      action,
      resource_type: resourceType
    });
  }
}