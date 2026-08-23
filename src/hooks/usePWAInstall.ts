"use client";

import { useState, useEffect, useCallback } from 'react';

export type PlatformType = 'ios' | 'android' | 'mac' | 'desktop';
export type InstallOutcome = 'accepted' | 'dismissed' | 'guide' | 'unavailable';

export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<PlatformType>('desktop');

  const checkStatus = useCallback(() => {
    if (typeof window === 'undefined') return;

    // 1. Detect standalone (already installed)
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      (typeof document !== 'undefined' && document.referrer.includes('android-app://'));

    setIsInstalled(isStandalone);

    // 2. Detect Platform
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

  const installApp = async (): Promise<{ outcome: InstallOutcome; platform: PlatformType }> => {
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
            window.dispatchEvent(new CustomEvent('rater-pwa-installed'));
          }
        }
        return { outcome: choice.outcome, platform };
      } catch (err) {
        console.error('[PWA] Error executing native install prompt:', err);
      }
    }

    // If native programmatic install is not supported by the browser (iOS / Mac Safari)
    if (platform === 'ios' || platform === 'mac') {
      return { outcome: 'guide', platform };
    }

    // Non-iOS browser where prompt has already been dismissed or consumed by browser
    return { outcome: 'unavailable', platform };
  };

  return {
    isInstallable,
    isInstalled,
    platform,
    installApp,
  };
}
