const CACHES = {
  STATIC: 'rater-static-v5',
  IMAGES: 'rater-images-v2',
  PAGES: 'rater-pages-v2',
  API: 'rater-public-api-v2'
};

const TTL_MS = {
  PAGES: 3 * 24 * 60 * 60 * 1000, // 3 days
  API: 30 * 60 * 1000 // 30 minutes
};

const STATIC_ASSETS = [
  '/offline',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/rater-logo-black-bg.svg',
  '/icons/rater-logo-transparent-bg-stroked.svg',
  '/icons/rater-logo-white-bg-stroked.svg',
  '/icons/rater-logo-white-bg.svg'
];

// Helper to write response with TTL header
async function cacheResponse(cacheName, request, response) {
  if (!response || response.status !== 200 || response.type === 'error') return;
  
  if (response.type === 'opaque') {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
    return;
  }
  
  const headers = new Headers(response.headers);
  headers.set('X-SW-Cache-Time', Date.now().toString());
  
  const cachedRes = new Response(response.clone().body, {
    status: response.status,
    statusText: response.statusText,
    headers: headers
  });
  
  const cache = await caches.open(cacheName);
  await cache.put(request, cachedRes);
}

// Helper to check TTL
async function getValidCachedResponse(cacheName, request, ttlMs) {
  const cache = await caches.open(cacheName);
  const response = await cache.match(request);
  if (!response) return null;
  
  const cacheTime = response.headers.get('X-SW-Cache-Time');
  if (cacheTime && ttlMs) {
    const age = Date.now() - parseInt(cacheTime, 10);
    if (age > ttlMs) {
      await cache.delete(request);
      return null;
    }
  }
  return response;
}

// Invalidation logic for mutations
async function invalidateRelatedCaches() {
  const apiCache = await caches.open(CACHES.API);
  const apiKeys = await apiCache.keys();
  for (const req of apiKeys) {
    await apiCache.delete(req);
  }
  
  const pagesCache = await caches.open(CACHES.PAGES);
  const pageKeys = await pagesCache.keys();
  for (const req of pageKeys) {
    if (req.url.includes('/post/')) {
      await pagesCache.delete(req);
    }
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHES.STATIC).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const validCaches = Object.values(CACHES);
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!validCaches.includes(cacheName)) {
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
  const req = event.request;

  // --- 1. Mutations (Network Only + Invalidation) ---
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    event.respondWith(
      fetch(req).then((response) => {
        if (response.status >= 200 && response.status < 300) {
          event.waitUntil(invalidateRelatedCaches());
        }
        return response;
      }).catch((err) => {
        throw err;
      })
    );
    return;
  }

  // --- 2. Excluded Endpoints (Network Only) ---
  const isAuthOrPrivate = 
    url.pathname.startsWith('/api/auth') || 
    url.pathname.startsWith('/api/insights') ||
    url.pathname.startsWith('/api/admin') ||
    url.pathname.startsWith('/api/account') ||
    url.pathname.startsWith('/api/me') ||
    url.hostname.includes('supabase.co/rest');

  if (isAuthOrPrivate) {
    return; 
  }

  // --- 3. HTML Pages & Next.js RSC (Network-First -> Cache Fallback) ---
  const isHTML = req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html');
  const isRSC = req.headers.has('RSC') || url.searchParams.has('_rsc');
  
  if (isHTML || isRSC) {
    event.respondWith(
      fetch(req).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          event.waitUntil(cacheResponse(CACHES.PAGES, req, networkResponse.clone()));
        }
        return networkResponse;
      }).catch(async () => {
        const cached = await getValidCachedResponse(CACHES.PAGES, req, TTL_MS.PAGES);
        if (cached) return cached;
        if (isHTML) return caches.match('/offline');
        return new Response('Offline', { status: 503 });
      })
    );
    return;
  }

  // --- 4. Public API (Stale-While-Revalidate) ---
  const isPublicApi = 
    url.pathname.startsWith('/api/posts') || 
    url.pathname.startsWith('/api/profiles');

  if (isPublicApi) {
    event.respondWith(
      getValidCachedResponse(CACHES.API, req, TTL_MS.API).then((cachedResponse) => {
        const fetchPromise = fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            event.waitUntil(cacheResponse(CACHES.API, req, networkResponse.clone()));
          }
          return networkResponse;
        }).catch((err) => {
          if (!cachedResponse) throw err;
        });
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // --- 5. Images (Cache-First) ---
  const isImage = 
    req.destination === 'image' || 
    url.pathname.match(/\.(png|jpg|jpeg|svg|webp|gif)$/i) ||
    url.hostname.includes('supabase.co/storage') ||
    url.hostname.includes('googleusercontent.com') ||
    url.hostname.includes('avatars.githubusercontent.com');

  if (isImage) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            event.waitUntil(cacheResponse(CACHES.IMAGES, req, networkResponse.clone()));
          }
          return networkResponse;
        }).catch(() => new Response('Offline', { status: 503 }));
      })
    );
    return;
  }

  // --- 6. Static Assets (Cache-First) ---
  if (STATIC_ASSETS.includes(url.pathname) || url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            event.waitUntil(cacheResponse(CACHES.STATIC, req, networkResponse.clone()));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

});

// --- 7. Web Push Notification Handling ---
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const options = {
      body: data.body || 'You have a new update on Rater.',
      icon: data.icon || '/icons/icon-192.png',
      badge: data.badge || '/icons/icon-192.png',
      data: {
        url: data.targetUrl || '/browse',
        id: data.id,
      },
      tag: data.groupKey || undefined,
      renotify: Boolean(data.groupKey),
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Rater', options)
    );
  } catch (err) {
    console.error('[ServiceWorker] Push event error:', err);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // If a client window is already open at the target URL, focus it
      for (const client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // Otherwise open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

