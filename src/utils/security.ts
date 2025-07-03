
import supabase from '@/integrations/supabase/client';

// Enhanced password validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Rate limiting for authentication attempts
export const checkAuthRateLimit = async (identifier: string, action: 'login' | 'signup' | 'password_reset'): Promise<boolean> => {
  try {
    const maxAttempts = action === 'login' ? 5 : 3;
    const windowMinutes = action === 'login' ? 60 : 30;
    
    // Clean up old records first
    await supabase.rpc('cleanup_old_rate_limits');
    
    // Check current attempts in the time window
    const { data: rateLimits, error } = await supabase
      .from('rate_limits')
      .select('attempts')
      .eq('identifier', identifier)
      .eq('action', action)
      .gte('window_start', new Date(Date.now() - (windowMinutes * 60 * 1000)).toISOString())
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Auth rate limit check error:', error);
      return true; // Allow on error
    }

    if (rateLimits && rateLimits.attempts >= maxAttempts) {
      return false; // Rate limited
    }

    // Record this attempt
    await supabase.from('rate_limits').upsert({
      identifier,
      action,
      attempts: rateLimits ? rateLimits.attempts + 1 : 1,
      window_start: rateLimits ? undefined : new Date().toISOString()
    });

    return true; // Allowed
  } catch (error) {
    console.error('Auth rate limiting error:', error);
    return true; // Allow on error to avoid blocking legitimate users
  }
};

// Enhanced input sanitization helper
export const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (!input) return '';
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .replace(/data:/gi, '') // Remove data URLs
    .replace(/vbscript:/gi, ''); // Remove vbscript
};

// Validate analytics session data
export const validateSessionData = (sessionData: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (sessionData.screen_width && (sessionData.screen_width < 0 || sessionData.screen_width > 10000)) {
    errors.push('Invalid screen width');
  }
  
  if (sessionData.screen_height && (sessionData.screen_height < 0 || sessionData.screen_height > 10000)) {
    errors.push('Invalid screen height');
  }
  
  if (sessionData.viewport_width && (sessionData.viewport_width < 0 || sessionData.viewport_width > 10000)) {
    errors.push('Invalid viewport width');
  }
  
  if (sessionData.viewport_height && (sessionData.viewport_height < 0 || sessionData.viewport_height > 10000)) {
    errors.push('Invalid viewport height');
  }
  
  if (sessionData.user_agent && sessionData.user_agent.length > 1000) {
    errors.push('User agent too long');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate event data
export const validateEventData = (eventData: any): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!eventData.event_name || typeof eventData.event_name !== 'string') {
    errors.push('Event name is required and must be a string');
  } else if (!/^[a-zA-Z0-9_-]+$/.test(eventData.event_name)) {
    errors.push('Event name contains invalid characters');
  }
  
  if (eventData.event_payload && JSON.stringify(eventData.event_payload).length > 10240) {
    errors.push('Event payload too large (max 10KB)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Check if user has admin privileges (using proper role-based system)
export const checkAdminAccess = async (): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    return profile?.role === 'admin';
  } catch (error) {
    console.error('Admin access check failed:', error);
    return false;
  }
};

// Enhanced security headers for CSP (Content Security Policy)
export const getSecurityHeaders = () => {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://ipapi.co https://www.googletagmanager.com https://www.google-analytics.com https://cdn.gpteng.co",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://ipapi.co https://*.supabase.co https://www.google-analytics.com https://stats.g.doubleclick.net",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'",
      "form-action 'self'",
      "upgrade-insecure-requests"
    ].join('; '),
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate'
  };
};
