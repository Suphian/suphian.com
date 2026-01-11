import { EventValidator } from '../analytics/eventValidator';

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

/**
 * Validate event data.
 * @deprecated Use EventValidator.validate() from '../analytics/eventValidator' instead.
 */
export const validateEventData = (eventData: { event_name: string; event_payload?: Record<string, unknown> }): { isValid: boolean; errors: string[] } => {
  const result = EventValidator.validate(eventData.event_name, eventData.event_payload);
  return {
    isValid: result.isValid,
    errors: result.errors
  };
};
