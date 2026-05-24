const CACHE_NAME = 'rater-cache-v1';
const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/logo-rater-hover.svg',
  '/icons/logo-rater.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Network-first for navigation requests (HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then((response) => {
          if (response) return response;
          // Return offline fallback if we had one, but we don't right now
          return new Response('Connection looks unstable. Go buy Data.', {
            headers: { 'Content-Type': 'text/html' }
          });
        });
      })
    );
    return;
  }

  // Cache-first for static assets
  if (STATIC_ASSETS.includes(url.pathname) || url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request).then((fetchRes) => {
          // optionally cache dynamically loaded static assets
          return fetchRes;
        });
      })
    );
    return;
  }

  // Default: Network-first
  event.respondWith(
    fetch(event.request).catch(() => caches.match(event.request))
  );
});
