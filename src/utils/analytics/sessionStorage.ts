
export class SessionStorage {
  private static readonly SESSION_KEY = 'secure_analytics_session_id';

  static getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem(this.SESSION_KEY);
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      sessionStorage.setItem(this.SESSION_KEY, sessionId);
      console.log('🔒 Created new session ID:', sessionId);
    } else {
      console.log('🔒 Using existing session ID:', sessionId);
    }
    return sessionId;
  }
}
