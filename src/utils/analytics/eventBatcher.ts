
import { EventData } from './types';
import { EventBuffer } from './eventBuffer';
import { BatchProcessor } from './batchProcessor';

export class EventBatcher {
  private eventBuffer: EventBuffer;
  private batchTimer: NodeJS.Timeout | null = null;
  private retryTimer: NodeJS.Timeout | null = null;
  private batchSize: number;
  private batchIntervalMs: number;
  private retryDelayMs = 3000;
  private maxRetryDelayMs = 60000;
  private flushCb?: () => Promise<void>;
  private supabase: any;

  constructor(batchSize: number, batchIntervalMs: number, supabase?: any) {
    this.batchSize = batchSize;
    this.batchIntervalMs = batchIntervalMs;
    this.eventBuffer = new EventBuffer();
    this.supabase = supabase;
  }
  addEvent(eventData: EventData): void {
    const bufferSize = this.eventBuffer.add(eventData);
    
    if (bufferSize >= this.batchSize) {
      this.flush();
    }
  }

  startBatchTimer(flushCallback: () => Promise<void>): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    this.flushCb = flushCallback;
    
    // Only set timer if not already running
    this.batchTimer = setInterval(() => {
      if (!this.eventBuffer.isEmpty()) {
        this.flushCb?.();
      }
    }, this.batchIntervalMs);

    // Retry pending events when connection returns
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        if (!this.eventBuffer.isEmpty()) {
          this.retryDelayMs = 3000; // reset backoff
          this.flushCb?.();
        }
      });
    }
  }
  async flush(supabase?: any): Promise<void> {
    if (this.eventBuffer.isEmpty()) {
      return;
    }

    const eventsToFlush = this.eventBuffer.flush();

    // If offline, requeue and schedule retry
    if (typeof navigator !== 'undefined' && navigator && 'onLine' in navigator && !navigator.onLine) {
      if (import.meta.env.DEV) {
        console.log('🔒 Offline detected, re-queueing events');
      }
      eventsToFlush.forEach(e => this.eventBuffer.add(e));
      this.scheduleRetry();
      return;
    }

    // Use provided supabase or fall back to instance supabase
    const client = supabase || this.supabase;
    
    if (!client) {
      if (import.meta.env.DEV) {
        console.log('🔒 No supabase client available, re-queueing events');
      }
      eventsToFlush.forEach(e => this.eventBuffer.add(e));
      this.scheduleRetry();
      return;
    }

    const success = await BatchProcessor.processEvents(eventsToFlush, client);
    
    if (!success) {
      if (import.meta.env.DEV) {
        console.log('⚠️ Event processing failed, will retry with backoff');
      }
      // Requeue failed events
      eventsToFlush.forEach(e => this.eventBuffer.add({ ...e, retried: true }));
      this.scheduleRetry();
    } else {
      // Reset backoff on success
      this.retryDelayMs = 3000;
    }
  }

  private scheduleRetry() {
    if (this.retryTimer || !this.flushCb) return;
    const delay = Math.min(this.retryDelayMs, this.maxRetryDelayMs);
    
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      // Exponential backoff
      this.retryDelayMs = Math.min(this.retryDelayMs * 2, this.maxRetryDelayMs);
      this.flushCb?.();
    }, delay);
  }
  destroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
    }
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.flushCb as any);
    }
  }
  getBufferSize(): number {
    return this.eventBuffer.size();
  }
}
