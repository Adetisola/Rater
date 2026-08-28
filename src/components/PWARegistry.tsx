'use client';

import { useEffect } from 'react';
import { refreshPushSubscriptionIfNeeded } from '@/lib/notifications/client';

declare global {
  interface Window {
    __raterDeferredPrompt?: any;
  }
}

export function PWARegistry() {
  useEffect(() => {
    // 1. Service Worker Registration
    if ('serviceWorker' in navigator) {
      const registerSW = async () => {
        try {
          const registration = await navigator.serviceWorker.register('/sw.js', {
            // Force the browser to always check for a new SW rather than serving a
            // cached version. Prevents stale SW from being used after deployments.
            updateViaCache: 'none',
            scope: '/',
          });

          // Inject VAPID public key into the SW global scope so it can use it for
          // pushsubscriptionchange re-registration without an additional network request.
          // The key is public; exposing it to the SW is safe and expected.
          if (registration.active && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
            registration.active.postMessage({
              type: 'VAPID_PUBLIC_KEY',
              key: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            });
          }

          // Also post to any waiting or installing SW so it's available immediately
          if (registration.installing && process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
            registration.installing.postMessage({
              type: 'VAPID_PUBLIC_KEY',
              key: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
            });
          }
        } catch (error) {
          console.error('[PWA] Service Worker registration failed:', error);
        }
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }
    }

    // 2. Silent push subscription health-check on app mount.
    // Silently re-syncs the subscription with the backend if it has been rotated
    // or renewed. Does NOT prompt for permission. Non-blocking.
    refreshPushSubscriptionIfNeeded().catch(() => {
      // Silent — health-check errors are non-critical
    });

    // 3. Global Early Capture of beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      window.__raterDeferredPrompt = e;
      window.dispatchEvent(new CustomEvent('rater-pwa-installable'));
    };

    const handleAppInstalled = () => {
      window.__raterDeferredPrompt = null;
      try {
        localStorage.setItem('rater_pwa_installed', 'true');
      } catch {}
      window.dispatchEvent(new CustomEvent('rater-pwa-installed'));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return null;
}
