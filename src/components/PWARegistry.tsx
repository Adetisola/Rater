'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    __raterDeferredPrompt?: any;
  }
}

export function PWARegistry() {
  useEffect(() => {
    // 1. Service Worker Registration
    if ('serviceWorker' in navigator) {
      const registerSW = () => {
        navigator.serviceWorker.register('/sw.js').catch((error) => {
          console.error('[PWA] Service Worker registration failed:', error);
        });
      };

      if (document.readyState === 'complete') {
        registerSW();
      } else {
        window.addEventListener('load', registerSW);
      }
    }

    // 2. Global Early Capture of beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      window.__raterDeferredPrompt = e;
      window.dispatchEvent(new CustomEvent('rater-pwa-installable'));
    };

    const handleAppInstalled = () => {
      window.__raterDeferredPrompt = null;
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
