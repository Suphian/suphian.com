// Service Worker for efficient caching
const CACHE_NAME = 'suphian-site-v1';
const CACHE_VERSION = 1;

// Assets to cache immediately
const PRECACHE_ASSETS = [
  '/',
  '/assets/index.css',
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
    maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    patterns: [/\.(js|css|png|jpg|jpeg|webp|woff2|woff)$/]
  },
  api: {
    maxAge: 5 * 60 * 1000, // 5 minutes
    patterns: [/\/api\//, /supabase\.co/]
  },
  html: {
    maxAge: 24 * 60 * 60 * 1000, // 1 day
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

  event.respondWith(
    caches.match(request).then(cachedResponse => {
      // Return cached response if available and not expired
      if (cachedResponse) {
        const cachedDate = new Date(cachedResponse.headers.get('sw-cached-date') || 0);
        const strategy = getStrategy(request.url);
        
        if (Date.now() - cachedDate.getTime() < strategy.maxAge) {
          return cachedResponse;
        }
      }

      // Fetch from network
      return fetch(request).then(response => {
        // Only cache successful responses
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // Clone response for caching
        const responseToCache = response.clone();
        
        caches.open(CACHE_NAME).then(cache => {
          // Add timestamp header
          const headers = new Headers(responseToCache.headers);
          headers.set('sw-cached-date', new Date().toISOString());
          
          const cachedResponse = new Response(responseToCache.body, {
            status: responseToCache.status,
            statusText: responseToCache.statusText,
            headers: headers
          });
          
          cache.put(request, cachedResponse);
        });

        return response;
      }).catch(() => {
        // Return cached response on network failure
        return cachedResponse || new Response('Offline', { status: 503 });
      });
    })
  );
});

// Get caching strategy for URL
function getStrategy(url) {
  for (const [name, strategy] of Object.entries(CACHE_STRATEGIES)) {
    if (strategy.patterns.some(pattern => pattern.test(url))) {
      return strategy;
    }
  }
  return CACHE_STRATEGIES.html; // Default strategy
}