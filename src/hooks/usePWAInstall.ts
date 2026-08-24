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

    // 1. Multi-vector standalone detection
    const isStandalone = 
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      (window.navigator as any).standalone === true ||
      (typeof document !== 'undefined' && document.referrer && document.referrer.includes('android-app://'));

    let persistedInstall = false;
    try {
      persistedInstall = localStorage.getItem('rater_pwa_installed') === 'true';
    } catch (_) {}

    if (isStandalone || persistedInstall) {
      setIsInstalled(true);
      try {
        localStorage.setItem('rater_pwa_installed', 'true');
      } catch (_) {}
    }

    // 2. Query browser getInstalledRelatedApps API (Chrome, Edge, Samsung Internet)
    if (typeof navigator !== 'undefined' && 'getInstalledRelatedApps' in navigator) {
      (navigator as any).getInstalledRelatedApps()
        .then((relatedApps: any[]) => {
          if (relatedApps && relatedApps.length > 0) {
            setIsInstalled(true);
            try {
              localStorage.setItem('rater_pwa_installed', 'true');
            } catch (_) {}
          }
        })
        .catch(() => {});
    }

    // 3. Detect Platform (including Samsung Internet)
    const ua = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(ua) && !/crios|fxios|opios/.test(ua)) {
      setPlatform('ios');
    } else if (/samsungbrowser|android/.test(ua)) {
      setPlatform('android');
    } else if (/macintosh|mac os x/.test(ua) && !/chrome|chromium|edg/.test(ua) && /safari/.test(ua)) {
      setPlatform('mac');
    } else {
      setPlatform('desktop');
    }

    // 4. Check if deferred prompt was captured
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
      try {
        localStorage.setItem('rater_pwa_installed', 'true');
      } catch (_) {}
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
            try {
              localStorage.setItem('rater_pwa_installed', 'true');
            } catch (_) {}
            window.dispatchEvent(new CustomEvent('rater-pwa-installed'));
          }
        }
        return { outcome: choice.outcome, platform };
      } catch (err) {
        console.error('[PWA] Error executing native install prompt:', err);
      }
    }

    // Fallback: If native programmatic install prompt cannot be fired directly,
    // show the illustrated platform guide modal so user can install immediately via browser menu
    return { outcome: 'guide', platform };
  };

  return {
    isInstallable,
    isInstalled,
    platform,
    installApp,
  };
}
