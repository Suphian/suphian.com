
export interface LocationData {
  country: string;
  region: string;
  city: string;
  timezone: string;
}

export class LocationService {
  static async fetchLocationData(): Promise<{ ipAddress: string | null; locationData: LocationData | null }> {
    let locationData = null;
    let ipAddress = null;

    try {
      console.log('🔒 Fetching IP and location data...');
      const ipResponse = await fetch('https://ipapi.co/json/');
      const ipData = await ipResponse.json();
      
      ipAddress = ipData.ip;
      console.log('🔒 Got IP address:', ipAddress);
      
      locationData = {
        country: ipData.country_name,
        region: ipData.region,
        city: ipData.city,
        timezone: ipData.timezone
      };
      console.log('🔒 Location data:', locationData);
    } catch (error) {
      console.log('⚠️ Could not fetch location data:', error);
    }

    return { ipAddress, locationData };
  }
}
