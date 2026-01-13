// Version 2 - Updated to fix caching issues
const CACHE_NAME = 'morning-loop-v2';

// Only cache static assets - NOT HTML pages
const urlsToCache = [
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // For navigation requests (HTML pages), always use network-first
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('/'))
    );
    return;
  }
  
  // For static assets (JS, CSS with hashes), use cache-first
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          return fetch(event.request).then((networkResponse) => {
            // Cache the new asset
            if (networkResponse.ok) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return networkResponse;
          });
        })
    );
    return;
  }
  
  // For everything else, network-first
  event.respondWith(
    fetch(event.request)
      .then((response) => response)
      .catch(() => caches.match(event.request))
  );
});

self.addEventListener('activate', (event) => {
  // Take control immediately
  event.waitUntil(
    Promise.all([
      // Clear all old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ])
  );
});

