/**
 * @deprecated Use EventValidator from './eventValidator' instead.
 * This file re-exports for backward compatibility.
 */

import { EventValidator } from './eventValidator';

export class EventSanitizer {
  private static readonly SENSITIVE_FIELDS = ['password', 'token', 'secret', 'key', 'auth'];

  static sanitizeEventPayload(payload: Record<string, unknown>): Record<string, unknown> {
    return EventValidator.sanitizePayload(payload);
  }
}
