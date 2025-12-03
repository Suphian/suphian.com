// Service Worker for efficient caching
const CACHE_NAME = 'suphian-site-v2';
const CACHE_VERSION = 2;

// Assets to cache immediately (only static assets, not HTML)
const PRECACHE_ASSETS = [
  '/optimized/logo-128.webp',
  '/optimized/logo-256.webp',
  '/optimized/astronaut-headphones.webp',
  '/optimized/astronaut-headphones-600.webp',
  '/optimized/astronaut-running.webp',
  '/optimized/astronaut-running-1200.webp'
];

// Cache strategies for different asset types
const CACHE_STRATEGIES = {
  static: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days (reduced from 1 year)
    networkFirst: false,
    patterns: [/\.(png|jpg|jpeg|webp|woff2|woff|svg|ico)$/]
  },
  scripts: {
    maxAge: 60 * 60 * 1000, // 1 hour for JS/CSS (they have hash in filename anyway)
    networkFirst: true,
    patterns: [/\.(js|css)$/]
  },
  api: {
    maxAge: 5 * 60 * 1000, // 5 minutes
    networkFirst: true,
    patterns: [/\/api\//, /supabase\.co/]
  },
  html: {
    maxAge: 0, // Always fetch fresh HTML
    networkFirst: true,
    patterns: [/\.html$/, /\/$/]
  }
};

// Install event - precache critical assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - cache strategy based on request type
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') return;

  // Skip Lovable preview URLs to avoid caching dev content
  if (url.hostname.includes('lovable') || url.hostname.includes('localhost')) {
    return;
  }

  const strategy = getStrategy(request.url);

  // Use network-first for HTML and dynamic content
  if (strategy.networkFirst) {
    event.respondWith(networkFirst(request, strategy));
  } else {
    event.respondWith(cacheFirst(request, strategy));
  }
});

// Network-first strategy - always try network, fall back to cache
async function networkFirst(request, strategy) {
  try {
    const response = await fetch(request);
    
    // Cache successful responses
    if (response && response.status === 200 && response.type === 'basic') {
      const cache = await caches.open(CACHE_NAME);
      const headers = new Headers(response.headers);
      headers.set('sw-cached-date', new Date().toISOString());
      
      const responseToCache = new Response(response.clone().body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
      });
      
      cache.put(request, responseToCache);
    }
    
    return response;
  } catch (error) {
    // Fall back to cache on network failure
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Cache-first strategy - use cache if available and not expired
async function cacheFirst(request, strategy) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    const cachedDate = new Date(cachedResponse.headers.get('sw-cached-date') || 0);
    
    if (Date.now() - cachedDate.getTime() < strategy.maxAge) {
      return cachedResponse;
    }
  }

  try {
    const response = await fetch(request);
    
    if (response && response.status === 200 && response.type === 'basic') {
      const cache = await caches.open(CACHE_NAME);
      const headers = new Headers(response.headers);
      headers.set('sw-cached-date', new Date().toISOString());
      
      const responseToCache = new Response(response.clone().body, {
        status: response.status,
        statusText: response.statusText,
        headers: headers
      });
      
      cache.put(request, responseToCache);
    }
    
    return response;
  } catch (error) {
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

// Get caching strategy for URL
function getStrategy(url) {
  for (const [name, strategy] of Object.entries(CACHE_STRATEGIES)) {
    if (strategy.patterns.some(pattern => pattern.test(url))) {
      return strategy;
    }
  }
  return CACHE_STRATEGIES.html; // Default to network-first
}
