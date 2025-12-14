import supabase from '@/integrations/supabase/client';

/**
 * Data retention utility for cleaning up old analytics data
 * Helps maintain privacy compliance by automatically removing old data
 */

export const cleanupOldData = async (): Promise<void> => {
  try {
    const { error } = await supabase.rpc('cleanup_old_analytics_data');
    
    if (error) {
      console.error('Data cleanup failed:', error);
      return;
    }
  } catch (error) {
    console.error('Data retention cleanup error:', error);
  }
};

/**
 * Schedule automatic data cleanup (call this on app initialization)
 * This should be called from the server-side or admin interface
 */
export const scheduleDataCleanup = (): void => {
  // Run cleanup daily
  setInterval(() => {
    cleanupOldData();
  }, 24 * 60 * 60 * 1000); // 24 hours
};

/**
 * Manual data cleanup trigger for admin use
 */
export const manualDataCleanup = async (): Promise<{ success: boolean; message: string }> => {
  try {
    await cleanupOldData();
    return {
      success: true,
      message: 'Data cleanup completed successfully'
    };
  } catch (error) {
    return {
      success: false,
      message: `Data cleanup failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};