
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
      
      const { data, error } = await supabase
        .from('events')
        .insert(events);

      if (error) {
        console.error('❌ Failed to store events:', error);
        if (process.env.NODE_ENV === 'development') {
          console.error('❌ Event error details:', {
            code: error.code,
            message: error.message,
            details: error.details
          });
        }
        return false;
      } else {
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ Stored ${events.length} events successfully!`);
          console.log('✅ Events response:', data);
        }
        return true;
      }
    } catch (error) {
      console.error('❌ Error processing events:', error);
      return false;
    }
  }
}
