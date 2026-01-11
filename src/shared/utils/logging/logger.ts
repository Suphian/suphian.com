/**
 * Centralized logging utility for consistent logging across the application.
 *
 * Features:
 * - Log levels: debug, info, warn, error
 * - Domain prefixes for easy filtering
 * - Auto-disable in production (except errors)
 * - Consistent formatting with optional emojis
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  prefix?: string;
  enableInProduction?: boolean;
  useEmoji?: boolean;
}

const LOG_EMOJIS: Record<LogLevel, string> = {
  debug: '🔍',
  info: '📝',
  warn: '⚠️',
  error: '❌'
};

class Logger {
  private prefix: string;
  private enableInProduction: boolean;
  private useEmoji: boolean;

  constructor(config: LoggerConfig = {}) {
    this.prefix = config.prefix || '';
    this.enableInProduction = config.enableInProduction ?? false;
    this.useEmoji = config.useEmoji ?? true;
  }

  private shouldLog(level: LogLevel): boolean {
    // Errors always log
    if (level === 'error') return true;
    // In production, only log if explicitly enabled
    if (!import.meta.env.DEV && !this.enableInProduction) return false;
    return true;
  }

  private formatMessage(level: LogLevel, message: string): string {
    const emoji = this.useEmoji ? `${LOG_EMOJIS[level]} ` : '';
    const prefix = this.prefix ? `[${this.prefix}] ` : '';
    return `${emoji}${prefix}${message}`;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message), ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('info', message), ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    // Errors always log, regardless of environment
    console.error(this.formatMessage('error', message), ...args);
  }

  /**
   * Log a group of related messages
   */
  group(label: string, fn: () => void): void {
    if (!this.shouldLog('info')) return;
    console.group(this.formatMessage('info', label));
    fn();
    console.groupEnd();
  }

  /**
   * Log timing information
   */
  time(label: string): () => void {
    if (!this.shouldLog('debug')) return () => {};
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.debug(`${label} took ${duration.toFixed(2)}ms`);
    };
  }
}

// Pre-configured loggers for different domains
export const analyticsLogger = new Logger({ prefix: 'Analytics' });
export const securityLogger = new Logger({ prefix: 'Security' });
export const formLogger = new Logger({ prefix: 'Form' });
export const trackingLogger = new Logger({ prefix: 'Tracking' });
export const sessionLogger = new Logger({ prefix: 'Session' });
export const appLogger = new Logger({ prefix: 'App' });

// Default export for custom loggers
export default Logger;

// Export type for external use
export type { LogLevel, LoggerConfig };
