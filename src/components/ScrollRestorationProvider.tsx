'use client';

import { useEffect, useRef, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * ScrollRestorationProvider
 * 
 * A global system that takes manual control over scroll restoration.
 * - Saves scroll position keyed by full route (path + search).
 * - Restores EXACT position only on browser back/forward (popstate).
 * - Ensures forward navigation starts naturally at the top.
 */

function ScrollRestorationContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Create a unique key for each route + search state
  const routeKey = pathname + '?' + searchParams.toString();
  
  // Track scroll positions in memory for the session
  const scrollPositions = useRef<Record<string, number>>({});
  
  // Detect if the current navigation was triggered by browser back/forward
  const isPopNavigation = useRef(false);

  // 1. Force manual control over scroll restoration
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    const handlePop = () => {
      isPopNavigation.current = true;
    };

    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  // 2. Continuous Scroll Capture
  // Updates the saved position for the current route as the user scrolls
  useEffect(() => {
    const handleScroll = () => {
      // Avoid saving position 0 unnecessarily
      if (window.scrollY > 10) {
        scrollPositions.current[routeKey] = window.scrollY;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [routeKey]);

  // 3. Handle Route Changes (Restore or Reset)
  useEffect(() => {
    // Logic only applies for /app routes
    if (!pathname.startsWith('/app')) {
      isPopNavigation.current = false;
      return;
    }

    if (!isPopNavigation.current) {
      // FORWARD NAVIGATION: Start at the top naturally
      window.scrollTo(0, 0);
      return;
    }

    // BACK/FORWARD NAVIGATION: Restore previous position
    const saved = scrollPositions.current[routeKey] ?? 0;
    let attempts = 0;

    const restore = () => {
      const maxScroll = document.body.scrollHeight - window.innerHeight;

      if (maxScroll >= saved || attempts > 10) {
        window.scrollTo(0, saved);
        isPopNavigation.current = false;
        return;
      }

      attempts++;
      requestAnimationFrame(restore);
    };

    requestAnimationFrame(restore);
  }, [routeKey, pathname]);

  return <>{children}</>;
}

export function ScrollRestorationProvider({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={null}>
      <ScrollRestorationContent>
        {children}
      </ScrollRestorationContent>
    </Suspense>
  );
}
