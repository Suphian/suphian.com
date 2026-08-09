// Service Worker for efficient caching.
// CACHE_NAME embeds a build id (injected at build time by vite.config.ts) so each
// deploy automatically invalidates the previous cache. The SW is only registered
// in production (see main.tsx), so the literal placeholder is never used in dev.
const BUILD_ID = '__SW_BUILD_ID__';
const CACHE_NAME = 'suphian-site-' + BUILD_ID;

// Small, always-needed static assets to warm the cache on install.
const PRECACHE_ASSETS = [
  '/assets/textures/background.webp',
  '/assets/logos/logo-292.webp',
];

// Cache strategies for different asset types
const CACHE_STRATEGIES = {
  static: {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days — assets are content-hashed or stable
    networkFirst: false,
    patterns: [/\.(png|jpg|jpeg|webp|avif|woff2|woff|svg|ico|gif)$/]
  },
  scripts: {
    maxAge: 60 * 60 * 1000, // 1 hour for JS/CSS (hashed filenames anyway)
    networkFirst: true,
    patterns: [/\.(js|css)$/]
  },
  api: {
    // Never serve cached API / third-party data — always go to network.
    maxAge: 0,
    networkFirst: true,
    patterns: [/\/api\//, /supabase\.co/, /ipify\.org/, /stripe\.com/, /googletagmanager\.com/, /google-analytics\.com/]
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
      // allSettled so a single missing asset can't abort the whole install.
      .then(cache => Promise.allSettled(PRECACHE_ASSETS.map(asset => cache.add(asset))))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames =>
        Promise.all(cacheNames.map(name => (name !== CACHE_NAME ? caches.delete(name) : undefined)))
      )
      .then(() => self.clients.claim())
  );
});

// Fetch event - cache strategy based on request type
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;
  // Skip local dev URLs to avoid caching dev content
  if (url.hostname.includes('localhost')) return;

  const strategy = getStrategy(request.url);
  if (strategy.networkFirst) {
    event.respondWith(networkFirst(request, strategy));
  } else {
    event.respondWith(cacheFirst(event, strategy));
  }
});

// Only cache successful, same-origin ("basic") responses; cross-origin
// (fonts, supabase, analytics) are left to the browser's HTTP cache.
async function putInCache(request, response) {
  if (response && response.status === 200 && response.type === 'basic') {
    const cache = await caches.open(CACHE_NAME);
    const headers = new Headers(response.headers);
    headers.set('sw-cached-date', new Date().toISOString());
    await cache.put(request, new Response(response.clone().body, {
      status: response.status,
      statusText: response.statusText,
      headers
    }));
  }
  return response;
}

// Network-first - always try network, fall back to cache when offline
async function networkFirst(request, strategy) {
  try {
    const response = await fetch(request);
    return await putInCache(request, response);
  } catch (error) {
    const cached = await caches.match(request);
    return cached || new Response('Offline', { status: 503 });
  }
}

// Cache-first with stale-while-revalidate: serve cache instantly, and when the
// entry is stale, still return it immediately while refreshing in the background.
async function cacheFirst(event, strategy) {
  const request = event.request;
  const cached = await caches.match(request);

  if (cached) {
    const cachedDate = new Date(cached.headers.get('sw-cached-date') || 0);
    const isStale = Date.now() - cachedDate.getTime() >= strategy.maxAge;
    if (isStale) {
      event.waitUntil(fetch(request).then(r => putInCache(request, r)).catch(() => {}));
    }
    return cached;
  }

  try {
    const response = await fetch(request);
    return await putInCache(request, response);
  } catch (error) {
    return new Response('Offline', { status: 503 });
  }
}

// Get caching strategy for URL
function getStrategy(url) {
  for (const strategy of Object.values(CACHE_STRATEGIES)) {
    if (strategy.patterns.some(pattern => pattern.test(url))) {
      return strategy;
    }
  }
  return CACHE_STRATEGIES.html; // Default to network-first
}
