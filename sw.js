/**
 * sw.js - Service Worker for DataHeist PWA
 * Enables offline play and app-like experience
 */

const CACHE_NAME = 'dataheist-v1.0.2';
const URLS_TO_CACHE = [
  '/DataHeist/public/',
  '/DataHeist/public/index.html',
  '/DataHeist/public/styles/game.css',
  '/DataHeist/manifest.json',
  '/DataHeist/public/assets/sprites/logo.png',
  'https://cdn.jsdelivr.net/npm/phaser@3.90.0/dist/phaser.min.js'
];

// Install event - cache assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing DataHeist PWA v1.0.2...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Caching app shell');
        return cache.addAll(URLS_TO_CACHE).catch((error) => {
          console.warn('[ServiceWorker] Some resources failed to cache:', error);
          console.warn('[ServiceWorker] Failed URLs will be cached on first visit');
        });
      })
      .then(() => {
        console.log('[ServiceWorker] ✅ Install complete');
        return self.skipWaiting();
      })
  );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[ServiceWorker] Removing old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[ServiceWorker] ✅ Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Only cache same-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          console.log('[ServiceWorker] Serving from cache:', event.request.url);
          return response;
        }
        
        console.log('[ServiceWorker] Fetching from network:', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Don't cache non-successful responses
            if (!response || response.status !== 200 || response.type === 'opaque') {
              return response;
            }
            
            // Clone and cache the response
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              console.log('[ServiceWorker] Caching new resource:', event.request.url);
              cache.put(event.request, responseToCache);
            });
            
            return response;
          })
          .catch((error) => {
            console.log('[ServiceWorker] Fetch failed, offline mode:', error);
            return caches.match(event.request);
          });
      })
  );
});