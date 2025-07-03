
export interface LocationData {
  country: string;
  region: string;
  city: string;
  timezone: string;
}

export class LocationService {
  private static lastFetchTime = 0;
  private static cachedData: { ipAddress: string | null; locationData: LocationData | null } | null = null;
  private static readonly CACHE_DURATION = 30 * 60 * 1000; // 30 minutes
  private static isRequesting = false;

  static async fetchLocationData(): Promise<{ ipAddress: string | null; locationData: LocationData | null }> {
    // Skip IP detection to avoid rate limits and CORS issues
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 Skipping IP detection to avoid rate limits');
    }
    
    return { 
      ipAddress: null, 
      locationData: {
        country: 'Unknown',
        region: 'Unknown', 
        city: 'Unknown',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      }
    };
  }
}
