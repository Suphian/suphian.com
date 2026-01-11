/**
 * Console Event Logger
 * Beautiful, structured console logging for analytics events in development
 */

type EventCategory = 'page' | 'click' | 'scroll' | 'form' | 'engagement' | 'error' | 'timing' | 'custom';

interface LoggedEvent {
  timestamp: Date;
  category: EventCategory;
  name: string;
  payload: Record<string, unknown>;
  sessionId?: string;
}

const CATEGORY_CONFIG: Record<EventCategory, { emoji: string; color: string; bgColor: string }> = {
  page: { emoji: '📄', color: '#3b82f6', bgColor: '#eff6ff' },
  click: { emoji: '🖱️', color: '#8b5cf6', bgColor: '#f5f3ff' },
  scroll: { emoji: '📜', color: '#06b6d4', bgColor: '#ecfeff' },
  form: { emoji: '📝', color: '#10b981', bgColor: '#ecfdf5' },
  engagement: { emoji: '💡', color: '#f59e0b', bgColor: '#fffbeb' },
  error: { emoji: '❌', color: '#ef4444', bgColor: '#fef2f2' },
  timing: { emoji: '⏱️', color: '#ec4899', bgColor: '#fdf2f8' },
  custom: { emoji: '🔷', color: '#6366f1', bgColor: '#eef2ff' },
};

class AnalyticsConsoleLogger {
  private enabled: boolean;
  private eventLog: LoggedEvent[] = [];
  private maxLogSize = 100;
  private groupedMode = false;

  constructor() {
    this.enabled = import.meta.env.DEV;
  }

  private getCategory(eventName: string): EventCategory {
    if (eventName.includes('page') || eventName.includes('view')) return 'page';
    if (eventName.includes('click') || eventName.includes('tap')) return 'click';
    if (eventName.includes('scroll')) return 'scroll';
    if (eventName.includes('form') || eventName.includes('field') || eventName.includes('submit')) return 'form';
    if (eventName.includes('engagement') || eventName.includes('time') || eventName.includes('rage')) return 'engagement';
    if (eventName.includes('error')) return 'error';
    if (eventName.includes('timing') || eventName.includes('duration')) return 'timing';
    return 'custom';
  }

  log(eventName: string, payload: Record<string, unknown> = {}, sessionId?: string): void {
    if (!this.enabled) return;

    const category = this.getCategory(eventName);
    const config = CATEGORY_CONFIG[category];
    const timestamp = new Date();

    // Store in event log
    const loggedEvent: LoggedEvent = { timestamp, category, name: eventName, payload, sessionId };
    this.eventLog.push(loggedEvent);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }

    // Format time
    const timeStr = timestamp.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    });

    // Console styling
    const headerStyle = `
      background: ${config.bgColor};
      color: ${config.color};
      padding: 2px 6px;
      border-radius: 3px;
      font-weight: bold;
    `;
    const timeStyle = 'color: #6b7280; font-size: 11px;';
    const nameStyle = `color: ${config.color}; font-weight: bold;`;

    // Log with styled output
    console.log(
      `%c${config.emoji} ${category.toUpperCase()}%c ${timeStr} %c${eventName}`,
      headerStyle,
      timeStyle,
      nameStyle
    );

    // Log payload if not empty
    if (Object.keys(payload).length > 0) {
      console.log('   └─ Payload:', payload);
    }
  }

  logGroup(groupName: string, events: Array<{ name: string; payload: Record<string, unknown> }>): void {
    if (!this.enabled) return;

    console.groupCollapsed(`📊 ${groupName} (${events.length} events)`);
    events.forEach(event => this.log(event.name, event.payload));
    console.groupEnd();
  }

  logError(eventName: string, error: Error | string, context?: Record<string, unknown>): void {
    if (!this.enabled) return;

    const errorMessage = error instanceof Error ? error.message : error;
    console.error(
      `%c❌ ERROR%c ${eventName}`,
      'background: #fef2f2; color: #ef4444; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
      'color: #ef4444; font-weight: bold;'
    );
    console.error('   └─ Error:', errorMessage);
    if (context) {
      console.error('   └─ Context:', context);
    }
  }

  logTiming(eventName: string, durationMs: number, metadata?: Record<string, unknown>): void {
    if (!this.enabled) return;

    const formattedDuration = durationMs < 1000
      ? `${durationMs.toFixed(0)}ms`
      : `${(durationMs / 1000).toFixed(2)}s`;

    console.log(
      `%c⏱️ TIMING%c ${eventName}: %c${formattedDuration}`,
      'background: #fdf2f8; color: #ec4899; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
      'color: #ec4899;',
      'color: #ec4899; font-weight: bold;'
    );
    if (metadata) {
      console.log('   └─ Details:', metadata);
    }
  }

  getEventLog(): LoggedEvent[] {
    return [...this.eventLog];
  }

  getEventsByCategory(category: EventCategory): LoggedEvent[] {
    return this.eventLog.filter(e => e.category === category);
  }

  printSummary(): void {
    if (!this.enabled) return;

    const categories = Object.keys(CATEGORY_CONFIG) as EventCategory[];
    const counts = categories.reduce((acc, cat) => {
      acc[cat] = this.eventLog.filter(e => e.category === cat).length;
      return acc;
    }, {} as Record<EventCategory, number>);

    console.log('%c📊 Analytics Summary', 'font-size: 14px; font-weight: bold; color: #1f2937;');
    console.table(counts);
  }

  clear(): void {
    this.eventLog = [];
    if (this.enabled) {
      console.log('%c🧹 Analytics log cleared', 'color: #6b7280;');
    }
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }
}

export const analyticsConsole = new AnalyticsConsoleLogger();
export default analyticsConsole;
