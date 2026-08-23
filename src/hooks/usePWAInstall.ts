"use client";

import { useState, useEffect, useCallback } from 'react';

export type PlatformType = 'ios' | 'android' | 'mac' | 'desktop';

export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<PlatformType>('desktop');

  const checkStatus = useCallback(() => {
    // 1. Detect standalone (already installed)
    const isStandalone = 
      (typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches) ||
      (typeof window !== 'undefined' && (window.navigator as any).standalone === true) ||
      (typeof document !== 'undefined' && document.referrer.includes('android-app://'));

    setIsInstalled(isStandalone);

    // 2. Detect Platform
    if (typeof window !== 'undefined') {
      const ua = window.navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua) && !/crios|fxios|opios/.test(ua)) {
        setPlatform('ios');
      } else if (/android/.test(ua)) {
        setPlatform('android');
      } else if (/macintosh|mac os x/.test(ua) && !/chrome|chromium|edg/.test(ua) && /safari/.test(ua)) {
        setPlatform('mac');
      } else {
        setPlatform('desktop');
      }

      // 3. Check if deferred prompt was captured
      if (window.__raterDeferredPrompt) {
        setIsInstallable(true);
      }
    }
  }, []);

  useEffect(() => {
    checkStatus();

    const handleInstallable = () => {
      setIsInstallable(true);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
    };

    window.addEventListener('rater-pwa-installable', handleInstallable);
    window.addEventListener('rater-pwa-installed', handleInstalled);
    window.addEventListener('beforeinstallprompt', handleInstallable);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('rater-pwa-installable', handleInstallable);
      window.removeEventListener('rater-pwa-installed', handleInstalled);
      window.removeEventListener('beforeinstallprompt', handleInstallable);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, [checkStatus]);

  const installApp = async (): Promise<{ outcome: 'accepted' | 'dismissed' | 'guide'; platform: PlatformType }> => {
    if (isInstalled) {
      return { outcome: 'accepted', platform };
    }

    const prompt = typeof window !== 'undefined' ? window.__raterDeferredPrompt : null;

    if (prompt) {
      try {
        await prompt.prompt();
        const choice = await prompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setIsInstallable(false);
          if (typeof window !== 'undefined') {
            window.__raterDeferredPrompt = null;
          }
        }
        return { outcome: choice.outcome, platform };
      } catch (err) {
        console.error('[PWA] Error executing native install prompt:', err);
      }
    }

    // If native prompt is not available (Safari, iOS, Desktop Firefox/Safari, or already dismissed)
    return { outcome: 'guide', platform };
  };

  return {
    isInstallable,
    isInstalled,
    platform,
    installApp,
  };
}
