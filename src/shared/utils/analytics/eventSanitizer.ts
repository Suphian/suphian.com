
export class EventSanitizer {
  private static readonly SENSITIVE_FIELDS = ['password', 'token', 'secret', 'key', 'auth'];

  static sanitizeEventPayload(payload: any): any {
    if (!payload) return payload;

    const sanitized = { ...payload };

    for (const field of this.SENSITIVE_FIELDS) {
      if (field in sanitized) {
        delete sanitized[field];
      }
    }

    return sanitized;
  }
}
