
import { EventData } from './types';

export class BatchProcessor {
  static async processEvents(events: EventData[], supabase: any): Promise<boolean> {
    if (!supabase) {
      return false;
    }

    try {
      // Sanitize events to remove client-only fields like 'retried'
      const sanitizedEvents = events.map(({ retried, ...event }) => event);
      
      const { data, error } = await supabase
        .from('events')
        .insert(sanitizedEvents);

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('⚠️ Failed to store events (continuing normally):', error.message);
        }
        return false;
      } else {
        return true;
      }
    } catch (error) {
      console.error('❌ Error processing events:', error);
      return false;
    }
  }
}
