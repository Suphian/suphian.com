// Enhanced security headers configuration
export const getEnhancedSecurityHeaders = () => {
  return {
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://api.ipify.org https://www.googletagmanager.com https://www.google-analytics.com https://cdn.gpteng.co chrome-extension: 'sha256-+osnfquB23g9K0xV1ls9W1PGJx2yRDNBiM+W8Bj/zdc='",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.ipify.org https://*.supabase.co https://www.google-analytics.com https://stats.g.doubleclick.net",
      "frame-ancestors 'none'", // Prevents clickjacking
      "base-uri 'self'",
      "object-src 'none'",
      "form-action 'self'",
      "upgrade-insecure-requests",
      "block-all-mixed-content"
    ].join('; '),
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'serial=()',
      'accelerometer=()',
      'gyroscope=()',
      'magnetometer=()'
    ].join(', '),
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
    'X-Robots-Tag': 'noindex, nofollow', // For sensitive pages
    'X-Permitted-Cross-Domain-Policies': 'none',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin'
  };
};

// Apply security headers to sensitive pages
export const applySecurityHeaders = (element: HTMLElement) => {
  const headers = getEnhancedSecurityHeaders();
  
  // Add meta tags for security headers that can be set via HTML
  const securityMetas = [
    { name: 'referrer', content: 'strict-origin-when-cross-origin' },
    { 'http-equiv': 'X-Content-Type-Options', content: 'nosniff' },
    { 'http-equiv': 'X-Frame-Options', content: 'DENY' },
    { 'http-equiv': 'X-XSS-Protection', content: '1; mode=block' }
  ];

  securityMetas.forEach(meta => {
    const existingMeta = document.querySelector(`meta[name="${meta.name}"], meta[http-equiv="${meta['http-equiv']}"]`);
    if (!existingMeta) {
      const metaElement = document.createElement('meta');
      if (meta.name) metaElement.setAttribute('name', meta.name);
      if (meta['http-equiv']) metaElement.setAttribute('http-equiv', meta['http-equiv']);
      metaElement.setAttribute('content', meta.content);
      document.head.appendChild(metaElement);
    }
  });
};