
import { EventData } from './types';
import { EventBuffer } from './eventBuffer';
import { BatchProcessor } from './batchProcessor';

export class EventBatcher {
  private eventBuffer: EventBuffer;
  private batchTimer: NodeJS.Timeout | null = null;
  private batchSize: number;
  private batchIntervalMs: number;

  constructor(batchSize: number, batchIntervalMs: number) {
    this.batchSize = batchSize;
    this.batchIntervalMs = batchIntervalMs;
    this.eventBuffer = new EventBuffer();
  }

  addEvent(eventData: EventData): void {
    const bufferSize = this.eventBuffer.add(eventData);
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 Event added to buffer. Buffer size:', bufferSize);
    }
    
    if (bufferSize >= this.batchSize) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 Buffer full, flushing events...');
      }
      this.flush();
    }
  }

  startBatchTimer(flushCallback: () => Promise<void>): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    console.log('🔒 Starting batch timer...');
    this.batchTimer = setInterval(() => {
      if (!this.eventBuffer.isEmpty()) {
        console.log('🔒 Timer triggered, flushing', this.eventBuffer.size(), 'events');
        flushCallback();
      }
    }, this.batchIntervalMs);
  }

  async flush(supabase?: any): Promise<void> {
    if (this.eventBuffer.isEmpty()) {
      console.log('🔒 No events to flush');
      return;
    }

    const eventsToFlush = this.eventBuffer.flush();

    if (!supabase) {
      console.log('🔒 No supabase client provided for flush');
      return;
    }

    const success = await BatchProcessor.processEvents(eventsToFlush, supabase);
    
    if (!success) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Event processing failed, discarding events to prevent loops');
      }
    }
  }

  destroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
  }

  getBufferSize(): number {
    return this.eventBuffer.size();
  }
}
