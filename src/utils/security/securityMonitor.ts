import supabase from '@/integrations/supabase/client';

export class SecurityMonitor {
  private static readonly SECURITY_EVENT_PREFIX = 'security_';

  // Log security-related events
  static async logSecurityEvent(
    eventType: 'admin_access' | 'failed_auth' | 'suspicious_activity' | 'data_access',
    details: Record<string, any> = {}
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const securityEvent = {
        event_name: `${this.SECURITY_EVENT_PREFIX}${eventType}`,
        event_payload: {
          ...details,
          user_id: user?.id || 'anonymous',
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          url: window.location.href,
          ip_hash: await this.getHashedIP()
        }
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

      // Check for rapid successive failed auth attempts
      const failedAuthEvents = recentEvents.filter(e => 
        e.event_name.includes('failed_auth')
      );

      if (failedAuthEvents.length > 5) {
        await this.logSecurityEvent('suspicious_activity', {
          reason: 'multiple_failed_auth',
          count: failedAuthEvents.length,
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

  // Enhanced admin access logging
  static async logAdminAccess(action: string, resourceType: string): Promise<void> {
    await this.logSecurityEvent('admin_access', {
      action,
      resource_type: resourceType,
      timestamp: new Date().toISOString()
    });
  }
}