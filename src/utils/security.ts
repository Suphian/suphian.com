
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

// Input sanitization helper
export const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (!input) return '';
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
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

// Security headers for CSP (Content Security Policy)
export const getSecurityHeaders = () => {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://ipapi.co https://www.googletagmanager.com https://www.google-analytics.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://ipapi.co https://*.supabase.co https://www.google-analytics.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "object-src 'none'"
    ].join('; '),
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  };
};
