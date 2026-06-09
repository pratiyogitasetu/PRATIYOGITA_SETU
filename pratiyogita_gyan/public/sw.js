// Service Worker for offline support and caching
const CACHE_NAME = 'ncert-pyq-chatbot-v2';
const urlsToCache = [
  '/',
  '/offline.html'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cacheJobs = urlsToCache.map(async (url) => {
      try {
        const response = await fetch(url, { cache: 'no-cache' });
        if (response && response.ok) {
          await cache.put(url, response.clone());
        }
      } catch (error) {
        // Keep install resilient even if one asset fails
      }
    });
    await Promise.allSettled(cacheJobs);
    self.skipWaiting();
  })());
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip caching for API calls to avoid stale data
  if (event.request.url.includes('/api/')) {
    return;
  }

  // Skip non-HTTP schemes (chrome-extension, etc.)
  if (!event.request.url.startsWith('http')) {
    return;
  }

  const requestUrl = new URL(event.request.url);
  const isSameOrigin = requestUrl.origin === self.location.origin;

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200) {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          if (isSameOrigin) {
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });
          }

          return response;
        }).catch(() => {
          // Return offline page if available
          return caches.match('/offline.html');
        });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});
