/**
 * Unified event validation and sanitization utility.
 * Consolidates EventSanitizer and validateEventData from security.ts
 */

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  sanitizedPayload: Record<string, unknown> | null;
}

const SENSITIVE_FIELDS = [
  'password',
  'token',
  'secret',
  'key',
  'auth',
  'credential',
  'api_key',
  'apiKey',
  'accessToken',
  'access_token',
  'refreshToken',
  'refresh_token'
] as const;

const MAX_PAYLOAD_SIZE = 10240; // 10KB
const MAX_EVENT_NAME_LENGTH = 100;
const EVENT_NAME_PATTERN = /^[a-zA-Z][a-zA-Z0-9_-]*$/;

export class EventValidator {
  /**
   * Validate and sanitize an event before sending to analytics.
   * Returns validation result with sanitized payload if valid.
   */
  static validate(eventName: string, eventPayload?: Record<string, unknown>): ValidationResult {
    const errors: string[] = [];

    // Validate event name
    if (!eventName || typeof eventName !== 'string') {
      errors.push('Event name is required and must be a string');
    } else {
      if (eventName.length > MAX_EVENT_NAME_LENGTH) {
        errors.push(`Event name too long (max ${MAX_EVENT_NAME_LENGTH} characters)`);
      }
      if (!EVENT_NAME_PATTERN.test(eventName)) {
        errors.push('Event name must start with a letter and contain only letters, numbers, underscores, and hyphens');
      }
    }

    // Validate and sanitize payload
    let sanitizedPayload: Record<string, unknown> | null = null;

    if (eventPayload) {
      const payloadString = JSON.stringify(eventPayload);

      // Check payload size
      if (payloadString.length > MAX_PAYLOAD_SIZE) {
        errors.push(`Event payload too large (max ${MAX_PAYLOAD_SIZE / 1024}KB)`);
      } else {
        sanitizedPayload = this.sanitizePayload(eventPayload);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitizedPayload
    };
  }

  /**
   * Sanitize event payload by removing sensitive fields.
   */
  static sanitizePayload(payload: Record<string, unknown>): Record<string, unknown> {
    if (!payload || typeof payload !== 'object') {
      return payload;
    }

    const sanitized = { ...payload };

    // Remove sensitive fields
    for (const field of SENSITIVE_FIELDS) {
      if (field in sanitized) {
        delete sanitized[field];
      }
    }

    // Recursively sanitize nested objects
    for (const key of Object.keys(sanitized)) {
      const value = sanitized[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        sanitized[key] = this.sanitizePayload(value as Record<string, unknown>);
      }
    }

    return sanitized;
  }

  /**
   * Validate event name only (for quick checks).
   */
  static isValidEventName(eventName: string): boolean {
    return (
      typeof eventName === 'string' &&
      eventName.length > 0 &&
      eventName.length <= MAX_EVENT_NAME_LENGTH &&
      EVENT_NAME_PATTERN.test(eventName)
    );
  }

  /**
   * Check if payload size is within limits.
   */
  static isPayloadSizeValid(payload: Record<string, unknown>): boolean {
    try {
      return JSON.stringify(payload).length <= MAX_PAYLOAD_SIZE;
    } catch {
      return false;
    }
  }
}

// Export standalone functions for backward compatibility
export function validateEventData(eventData: { event_name: string; event_payload?: Record<string, unknown> }): { isValid: boolean; errors: string[] } {
  const result = EventValidator.validate(eventData.event_name, eventData.event_payload);
  return {
    isValid: result.isValid,
    errors: result.errors
  };
}

export function sanitizeEventPayload(payload: Record<string, unknown>): Record<string, unknown> {
  return EventValidator.sanitizePayload(payload);
}
