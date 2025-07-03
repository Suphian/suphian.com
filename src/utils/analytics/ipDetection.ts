
/**
 * Detect if the current traffic is internal (should be filtered from analytics)
 * This includes:
 * - Local development (localhost, 127.0.0.1)
 * - Your personal IPs
 * - Lovable development environment
 */
export async function getTrafficType(): Promise<'internal' | 'external'> {
  // Check for localhost/development
  const hostname = window.location.hostname;
  const developmentHosts = [
    'localhost', 
    '127.0.0.1', 
    '0.0.0.0',
    // Lovable development domains
    'lovable.dev',
    'lovableproject.com'
  ];
  
  // Check if hostname contains any development indicators
  const isLocalDev = developmentHosts.some(host => 
    hostname.includes(host) || hostname.endsWith('.lovable.dev') || hostname.endsWith('.lovableproject.com')
  );
  
  if (isLocalDev) {
    console.log('🔒 Traffic classified as INTERNAL - Development environment detected:', hostname);
    return 'internal';
  }

  // Check for Lovable preview URLs (they typically have specific patterns)
  if (hostname.includes('lovable') || hostname.includes('preview')) {
    console.log('🔒 Traffic classified as INTERNAL - Lovable preview environment detected:', hostname);
    return 'internal';
  }

  try {
    // Get IP-based classification
    const ipResponse = await fetch('https://ipapi.co/json/');
    const ipData = await ipResponse.json();
    
    // Your known internal IPs
    const internalIPs = [
      '70.23.218.121', 
      '2600:4040:9074:300:20fd:4959:4e97:a68e',
      '2600:4040:9074:300:1407:6941:9885:f80e'  // Your current IP
    ];
    
    if (internalIPs.includes(ipData.ip)) {
      console.log('🔒 Traffic classified as INTERNAL - Known internal IP:', ipData.ip);
      return 'internal';
    }
    
    console.log('🔒 Traffic classified as EXTERNAL - Public traffic from IP:', ipData.ip);
    return 'external';
  } catch (error) {
    console.log('⚠️ Could not determine IP, defaulting to hostname-based classification');
    return isLocalDev ? 'internal' : 'external';
  }
}
