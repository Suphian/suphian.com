import supabase from '@/integrations/supabase/client';
import { SecurityMonitor } from './securityMonitor';

export class AuthSecurity {
  private static readonly MAX_FAILED_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
  private static readonly SESSION_TIMEOUT_MS = 4 * 60 * 60 * 1000; // 4 hours

  // Enhanced login with security monitoring
  static async secureLogin(email: string, password: string): Promise<{
    success: boolean;
    error?: string;
    requiresCooldown?: boolean;
  }> {
    try {
      // Check if account is locked
      const isLocked = await this.isAccountLocked(email);
      if (isLocked) {
        await SecurityMonitor.logSecurityEvent('failed_auth', {
          reason: 'account_locked',
          email: email.substring(0, 3) + '***' // Partial email for logging
        });
        return {
          success: false,
          error: 'Account temporarily locked due to multiple failed attempts',
          requiresCooldown: true
        };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        await this.recordFailedAttempt(email);
        await SecurityMonitor.logSecurityEvent('failed_auth', {
          reason: error.message,
          email: email.substring(0, 3) + '***'
        });
        return { success: false, error: error.message };
      }

      if (data.user) {
        await this.clearFailedAttempts(email);
        await SecurityMonitor.logSecurityEvent('admin_access', {
          action: 'login_success',
          user_id: data.user.id
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Secure login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  // Check if account is locked due to failed attempts
  private static async isAccountLocked(email: string): Promise<boolean> {
    const lockoutKey = `lockout_${email}`;
    const lockoutData = localStorage.getItem(lockoutKey);
    
    if (!lockoutData) return false;

    const { attempts, lastAttempt } = JSON.parse(lockoutData);
    const timeSinceLastAttempt = Date.now() - lastAttempt;

    // If lockout period has passed, clear the lockout
    if (timeSinceLastAttempt > this.LOCKOUT_DURATION_MS) {
      localStorage.removeItem(lockoutKey);
      return false;
    }

    return attempts >= this.MAX_FAILED_ATTEMPTS;
  }

  // Record failed login attempt
  private static async recordFailedAttempt(email: string): Promise<void> {
    const lockoutKey = `lockout_${email}`;
    const lockoutData = localStorage.getItem(lockoutKey);
    
    let attempts = 1;
    if (lockoutData) {
      const parsed = JSON.parse(lockoutData);
      attempts = parsed.attempts + 1;
    }

    localStorage.setItem(lockoutKey, JSON.stringify({
      attempts,
      lastAttempt: Date.now()
    }));
  }

  // Clear failed attempts on successful login
  private static async clearFailedAttempts(email: string): Promise<void> {
    const lockoutKey = `lockout_${email}`;
    localStorage.removeItem(lockoutKey);
  }

  // Check session validity and enforce timeout
  static async validateSession(): Promise<{ valid: boolean; expired?: boolean }> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        return { valid: false };
      }

      // Check if session has expired based on our timeout
      const sessionAge = Date.now() - (session.expires_at ? new Date(session.expires_at).getTime() - (session.expires_in || 3600) * 1000 : Date.now());
      if (sessionAge > this.SESSION_TIMEOUT_MS) {
        await supabase.auth.signOut();
        await SecurityMonitor.logSecurityEvent('admin_access', {
          action: 'session_timeout',
          user_id: session.user.id
        });
        return { valid: false, expired: true };
      }

      return { valid: true };
    } catch (error) {
      console.error('Session validation error:', error);
      return { valid: false };
    }
  }

  // Enhanced logout with security logging
  static async secureLogout(): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        await SecurityMonitor.logSecurityEvent('admin_access', {
          action: 'logout',
          user_id: user.id
        });
      }

      await supabase.auth.signOut();
    } catch (error) {
      console.error('Secure logout error:', error);
    }
  }
}