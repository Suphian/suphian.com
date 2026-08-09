
export class SessionStorage {
  private static readonly SESSION_KEY = 'secure_analytics_session_id';
  private static readonly SESSION_ROW_KEY = 'secure_analytics_session_stored';

  static getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem(this.SESSION_KEY);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem(this.SESSION_KEY, sessionId);
    }
    return sessionId;
  }

  /**
   * Tracks whether this session's row already exists in the sessions table.
   * Without it every page load in the same tab re-attempts the insert and the
   * unique constraint on session_id rejects it with a 409 — invisible to the
   * app but noisy in devtools.
   */
  static isSessionRowStored(sessionId: string): boolean {
    try {
      return sessionStorage.getItem(this.SESSION_ROW_KEY) === sessionId;
    } catch {
      return false;
    }
  }

  static markSessionRowStored(sessionId: string): void {
    try {
      sessionStorage.setItem(this.SESSION_ROW_KEY, sessionId);
    } catch {
      // Storage unavailable — worst case we retry the insert next load.
    }
  }
}
