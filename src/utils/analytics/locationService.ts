
export interface LocationData {
  country: string;
  region: string;
  city: string;
  timezone: string;
}

export class LocationService {
  private static lastFetchTime = 0;
  private static cachedData: { ipAddress: string | null; locationData: LocationData | null } | null = null;
  private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  static async fetchLocationData(): Promise<{ ipAddress: string | null; locationData: LocationData | null }> {
    const now = Date.now();
    
    // Return cached data if available and not expired
    if (this.cachedData && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 Using cached location data');
      }
      return this.cachedData;
    }

    let locationData = null;
    let ipAddress = null;

    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 Fetching IP and location data...');
      }
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const ipResponse = await fetch('https://ipapi.co/json/', {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!ipResponse.ok) {
        throw new Error(`HTTP ${ipResponse.status}: ${ipResponse.statusText}`);
      }
      
      const ipData = await ipResponse.json();
      
      if (ipData.error) {
        throw new Error(ipData.error);
      }
      
      ipAddress = ipData.ip;
      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 Got IP address:', ipAddress);
      }
      
      locationData = {
        country: ipData.country_name || 'Unknown',
        region: ipData.region || 'Unknown',
        city: ipData.city || 'Unknown',
        timezone: ipData.timezone || 'UTC'
      };
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 Location data:', locationData);
      }
      
      // Cache the successful result
      this.cachedData = { ipAddress, locationData };
      this.lastFetchTime = now;
      
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.log('⚠️ Could not fetch location data:', error);
      }
      
      // Return cached data if available, even if expired
      if (this.cachedData) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔒 Falling back to cached location data');
        }
        return this.cachedData;
      }
    }

    return { ipAddress, locationData };
  }
}
