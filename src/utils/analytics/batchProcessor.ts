
import { EventData } from './types';

export class BatchProcessor {
  static async processEvents(events: EventData[], supabase: any): Promise<boolean> {
    if (!supabase) {
      console.log('🔒 No supabase client provided for batch processing');
      return false;
    }

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 Processing', events.length, 'events to Supabase...');
      }
      
      // Sanitize events to remove client-only fields like 'retried'
      const sanitizedEvents = events.map(({ retried, ...event }) => event);
      
      const { data, error } = await supabase
        .from('events')
        .insert(sanitizedEvents);

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.log('⚠️ Failed to store events (continuing normally):', error.message);
        }
        return false;
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Stored ${events.length} events successfully!`);
        }
        return true;
      }
    } catch (error) {
      console.error('❌ Error processing events:', error);
      return false;
    }
  }
}
