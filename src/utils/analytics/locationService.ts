
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
    const now = Date.now();
    
    // Return cached data if available and not expired
    if (this.cachedData && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      if (import.meta.env.DEV) {
        console.log('🔒 Using cached location data');
      }
      return this.cachedData;
    }

    // Prevent multiple simultaneous requests
    if (this.isRequesting) {
      if (import.meta.env.DEV) {
        console.log('🔒 Request already in progress, returning cached data');
      }
      return this.cachedData || { ipAddress: null, locationData: null };
    }

    this.isRequesting = true;
    let locationData = null;
    let ipAddress = null;

    try {
      if (import.meta.env.DEV) {
        console.log('🔒 Fetching IP data...');
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Use CORS-compliant IP service
      const ipResponse = await fetch('https://api.ipify.org?format=json', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!ipResponse.ok) {
        throw new Error(`HTTP ${ipResponse.status}: ${ipResponse.statusText}`);
      }
      
      const ipData = await ipResponse.json();
      ipAddress = ipData.ip;
      
      if (import.meta.env.DEV) {
        console.log('🔒 Got IP address:', ipAddress);
      }
      
      // Use browser's timezone instead of fetching location data
      locationData = {
        country: 'Unknown',
        region: 'Unknown',
        city: 'Unknown',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
      };
      
      // Cache the successful result
      this.cachedData = { ipAddress, locationData };
      this.lastFetchTime = now;
      
    } catch (error) {
      if (import.meta.env.DEV) {
        console.log('⚠️ Could not fetch IP data:', error);
      }
      
      // Return cached data if available, even if expired
      if (this.cachedData) {
        if (import.meta.env.DEV) {
          console.log('🔒 Falling back to cached location data');
        }
        return this.cachedData;
      }
    } finally {
      this.isRequesting = false;
    }

    return { ipAddress, locationData };
  }
}
