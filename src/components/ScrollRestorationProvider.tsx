'use client';

import { useEffect, Suspense, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * ScrollRestorationProvider
 * 
 * A robust system that takes manual control over scroll restoration.
 * - Saves scroll position keyed by full route.
 * - Restores EXACT position on browser back/forward (popstate).
 * - Handles restoration for keep-alive and standard pages.
 */

function ScrollRestorationContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Consistent route key logic: avoid trailing '?' if search is empty
  const search = searchParams.toString();
  const routeKey = search ? `${pathname}?${search}` : pathname;
  
  // Refs to track navigation state without triggering re-renders
  const isRestoring = useRef(false);
  const visitedRoutes = useRef<Set<string>>(new Set());
  const prevRouteKey = useRef<string>(routeKey);

  // 1. Force manual control
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
  }, []);

  // 2. Continuous Scroll Capture (Debounced to prevent saving clamped values during layout shifts)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleScroll = () => {
      if (isRestoring.current) return;
      
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // Save position for the current route
        sessionStorage.setItem("rater_scroll_" + routeKey, window.scrollY.toString());
      }, 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
    };
  }, [routeKey]);

  // 3. Handle Route Changes
  useEffect(() => {
    const isAppScope = pathname !== '/';
    if (!isAppScope) {
      prevRouteKey.current = routeKey;
      return;
    }

    // Identify if this is a back/forward nav by checking if we've visited this exact route before
    const isPop = visitedRoutes.current.has(routeKey);

    // Update history tracking: add the route we are LEAVING
    if (prevRouteKey.current !== routeKey) {
      visitedRoutes.current.add(prevRouteKey.current);
      prevRouteKey.current = routeKey;
    }

    const savedStr = sessionStorage.getItem("rater_scroll_" + routeKey);
    const saved = savedStr ? parseInt(savedStr, 10) : 0;

    if (!isPop) {
      // FORWARD NAVIGATION: Start at top
      isRestoring.current = true;
      window.scrollTo(0, 0);
      setTimeout(() => { isRestoring.current = false; }, 200);
      return;
    }

    // BACK/FORWARD NAVIGATION: Restoration
    if (saved === 0) {
      isRestoring.current = true;
      window.scrollTo(0, 0);
      setTimeout(() => { isRestoring.current = false; }, 200);
      return;
    }

    isRestoring.current = true;
    let elapsed = 0;
    const MAX_WAIT = 5000;
    const INTERVAL = 30;

    const tryRestore = () => {
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      
      if (maxScroll >= saved || elapsed >= MAX_WAIT) {
        window.scrollTo({ top: saved, behavior: 'instant' as any });
        
        const restoreStart = performance.now();
        const stabilityObserver = new ResizeObserver(() => {
          if (Math.abs(window.scrollY - saved) > 5) {
            window.scrollTo({ top: saved, behavior: 'instant' as any });
          }
          if (performance.now() - restoreStart > 3000) {
            stabilityObserver.disconnect();
            isRestoring.current = false;
          }
        });
        stabilityObserver.observe(document.body);
        setTimeout(() => {
          stabilityObserver.disconnect();
          isRestoring.current = false;
        }, 3000);
        return;
      }
      
      elapsed += INTERVAL;
      setTimeout(tryRestore, INTERVAL);
    };

    setTimeout(tryRestore, 30);
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
