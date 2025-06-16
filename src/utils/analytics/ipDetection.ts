
/**
 * Known internal IP addresses for traffic classification
 */
const INTERNAL_IPS = [
  '70.23.218.121', // IPv4
  '2600:4040:9074:300:20fd:4959:4e97:a68e' // IPv6
];

/**
 * Detect current user's IP address and classify traffic type
 */
async function detectTrafficType(): Promise<string> {
  try {
    // Try IPv4 first
    const ipv4Response = await fetch('https://api.ipify.org?format=json');
    const ipv4Data = await ipv4Response.json();
    
    if (INTERNAL_IPS.includes(ipv4Data.ip)) {
      return 'internal';
    }

    // Try IPv6 as fallback
    try {
      const ipv6Response = await fetch('https://api6.ipify.org?format=json');
      const ipv6Data = await ipv6Response.json();
      
      if (INTERNAL_IPS.includes(ipv6Data.ip)) {
        return 'internal';
      }
    } catch (ipv6Error) {
      // IPv6 detection failed, continue with external classification
    }
    
    return 'external';
  } catch (error) {
    // If IP detection fails, default to external
    console.log('IP detection failed, defaulting to external traffic');
    return 'external';
  }
}

// Cache traffic type to avoid multiple API calls
let cachedTrafficType: string | null = null;

/**
 * Get traffic type with caching
 */
export async function getTrafficType(): Promise<string> {
  if (cachedTrafficType === null) {
    cachedTrafficType = await detectTrafficType();
  }
  return cachedTrafficType;
}
