
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
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 Traffic classified as INTERNAL - Development environment detected:', hostname);
    }
    return 'internal';
  }

  // Check for Lovable preview URLs (they typically have specific patterns)
  if (hostname.includes('lovable') || hostname.includes('preview')) {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔒 Traffic classified as INTERNAL - Lovable preview environment detected:', hostname);
    }
    return 'internal';
  }

  // For production, classify as external without IP lookup to avoid rate limits
  if (process.env.NODE_ENV === 'development') {
    console.log('🔒 Traffic classified as EXTERNAL - Production environment');
  }
  return 'external';
}
