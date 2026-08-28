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

// =============================================================================
// --- VAPID Key Reception ---
// The VAPID public key is injected from the client (PWARegistry.tsx) via postMessage.
// This avoids the need for an additional network request when handling
// pushsubscriptionchange. The key is public and safe to store in the SW global scope.
// =============================================================================
self.__VAPID_PUBLIC_KEY__ = null;

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'VAPID_PUBLIC_KEY') {
    self.__VAPID_PUBLIC_KEY__ = event.data.key;
  }
});

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

// =============================================================================
// --- 7. Web Push Notification Handling ---
// =============================================================================
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();

    const options = {
      body: data.body || 'You have a new update on Rater.',
      icon: data.icon || '/icons/icon-192.png',
      badge: data.badge || '/icons/icon-192.png',
      // Use server-provided timestamp so notification displays the correct time
      // even if the device was offline and the push was delayed by FCM.
      timestamp: data.timestamp || Date.now(),
      // Vibration pattern: short-long-short
      vibrate: [100, 50, 100],
      // Keep notification visible until the user explicitly interacts with it.
      // Important for background delivery on Android where notifications can
      // be dismissed automatically by some launchers.
      requireInteraction: false,
      data: {
        url: data.targetUrl || '/browse',
        id: data.id,
        actionUrls: data.actionUrls || {},
      },
      actions: Array.isArray(data.actions) ? data.actions : [],
      tag: data.groupKey || undefined,
      renotify: Boolean(data.groupKey),
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Rater', options)
    );
  } catch (err) {
    console.error('[ServiceWorker] Push event error:', err);
    // Fallback: show a generic notification rather than silently failing.
    // This ensures the push event is always visible even if payload is malformed.
    event.waitUntil(
      self.registration.showNotification('Rater', {
        body: 'You have a new notification.',
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        data: { url: '/browse' },
      })
    );
  }
});

// =============================================================================
// --- 8. Notification Click Handling ---
// =============================================================================
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const clickedAction = event.action;
  const actionUrls = event.notification.data?.actionUrls || {};
  let targetUrl = event.notification.data?.url || '/browse';

  // If a specific quick action button was clicked with a mapped URL:
  if (clickedAction && actionUrls[clickedAction]) {
    targetUrl = actionUrls[clickedAction];
  }

  // Resolve to an absolute URL using the SW's origin
  const absoluteTargetUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // 1. Check if a window is already at the correct URL — if so, just focus it
      for (const client of windowClients) {
        if (client.url === absoluteTargetUrl && 'focus' in client) {
          return client.focus();
        }
      }

      // 2. If any window exists but is on a different URL — navigate the first one
      //    that is on the same origin, so we don't open a redundant tab.
      for (const client of windowClients) {
        if (
          client.url.startsWith(self.location.origin) &&
          'navigate' in client &&
          'focus' in client
        ) {
          return client.navigate(absoluteTargetUrl).then((navigatedClient) => {
            return navigatedClient ? navigatedClient.focus() : client.focus();
          });
        }
      }

      // 3. No suitable existing window — open a fresh one
      if (clients.openWindow) {
        return clients.openWindow(absoluteTargetUrl);
      }
    })
  );
});

// =============================================================================
// --- 9. Push Subscription Change Handling ---
//
// Fires when the browser automatically rotates push subscription keys
// (e.g. after a browser update, or when the push service rotates credentials).
//
// Security: The re-registration POST uses the existing session cookie
// (same-origin fetch from the SW). The server validates auth via
// supabase.auth.getUser() from the cookie — no new auth mechanism is needed.
//
// If the session has expired, the fetch will fail with 401 and we log it.
// The user will receive a fresh subscription the next time they use the app.
//
// Note: pushsubscriptionchange browser support varies. Chrome/Chromium-based
// browsers fire it reliably. Safari fires it on iOS 16.4+. Samsung Internet
// support follows Chrome's Chromium base. Firefox fires it correctly.
// =============================================================================
self.addEventListener('pushsubscriptionchange', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const vapidPublicKey = self.__VAPID_PUBLIC_KEY__;

        if (!vapidPublicKey) {
          console.warn('[ServiceWorker] pushsubscriptionchange: VAPID public key not available. Cannot re-subscribe.');
          return;
        }

        // Convert base64url VAPID key to Uint8Array
        const padding = '='.repeat((4 - (vapidPublicKey.length % 4)) % 4);
        const base64 = (vapidPublicKey + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = atob(base64);
        const applicationServerKey = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          applicationServerKey[i] = rawData.charCodeAt(i);
        }

        // Subscribe with new keys
        const newSubscription = await self.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });

        // Extract keys
        const rawP256dh = newSubscription.getKey ? newSubscription.getKey('p256dh') : null;
        const rawAuth = newSubscription.getKey ? newSubscription.getKey('auth') : null;

        if (!rawP256dh || !rawAuth) {
          console.warn('[ServiceWorker] pushsubscriptionchange: Could not extract new subscription keys.');
          return;
        }

        const p256dh = btoa(String.fromCharCode(...new Uint8Array(rawP256dh)));
        const auth = btoa(String.fromCharCode(...new Uint8Array(rawAuth)));

        // POST new subscription to backend — session cookie included automatically
        // (same-origin fetch). Server validates auth via cookie and upserts on endpoint.
        const response = await fetch('/api/notifications/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            endpoint: newSubscription.endpoint,
            p256dh,
            auth,
            expiresAt: newSubscription.expirationTime ?? null,
          }),
        });

        if (response.ok) {
          console.log('[ServiceWorker] pushsubscriptionchange: Re-registered successfully.');
        } else if (response.status === 401) {
          // Session expired — user will re-register on next app open. This is expected.
          console.warn('[ServiceWorker] pushsubscriptionchange: Session expired. Subscription will be re-registered on next login.');
        } else {
          console.warn('[ServiceWorker] pushsubscriptionchange: Re-registration failed with status', response.status);
        }
      } catch (err) {
        console.error('[ServiceWorker] pushsubscriptionchange error:', err);
      }
    })()
  );
});
