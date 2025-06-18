
import { EventData } from './types';

export class EventBatcher {
  private eventBuffer: EventData[] = [];
  private batchTimer: NodeJS.Timeout | null = null;
  private batchSize: number;
  private batchIntervalMs: number;

  constructor(batchSize: number, batchIntervalMs: number) {
    this.batchSize = batchSize;
    this.batchIntervalMs = batchIntervalMs;
  }

  addEvent(eventData: EventData): void {
    this.eventBuffer.push(eventData);
    console.log('🔒 Event added to buffer. Buffer size:', this.eventBuffer.length);
    
    if (this.eventBuffer.length >= this.batchSize) {
      console.log('🔒 Buffer full, flushing events...');
      this.flush();
    }
  }

  startBatchTimer(flushCallback: () => Promise<void>): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    console.log('🔒 Starting batch timer...');
    this.batchTimer = setInterval(() => {
      if (this.eventBuffer.length > 0) {
        console.log('🔒 Timer triggered, flushing', this.eventBuffer.length, 'events');
        flushCallback();
      }
    }, this.batchIntervalMs);
  }

  async flush(supabase?: any): Promise<void> {
    if (this.eventBuffer.length === 0) {
      console.log('🔒 No events to flush');
      return;
    }

    const eventsToFlush = [...this.eventBuffer];
    this.eventBuffer = [];

    if (!supabase) {
      console.log('🔒 No supabase client provided for flush');
      return;
    }

    try {
      console.log('🔒 Flushing', eventsToFlush.length, 'events to Supabase...');
      
      const { data, error } = await supabase
        .from('events')
        .insert(eventsToFlush);

      if (error) {
        console.error('❌ Failed to store events:', error);
        console.error('❌ Event error details:', {
          code: error.code,
          message: error.message,
          details: error.details
        });
        if (!eventsToFlush[0]?.retried) {
          eventsToFlush.forEach(event => event.retried = true);
          this.eventBuffer.unshift(...eventsToFlush);
        }
      } else {
        console.log(`✅ Stored ${eventsToFlush.length} events successfully!`);
        console.log('✅ Events response:', data);
      }
    } catch (error) {
      console.error('❌ Error flushing events:', error);
    }
  }

  destroy(): void {
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }
  }

  getBufferSize(): number {
    return this.eventBuffer.length;
  }
}
