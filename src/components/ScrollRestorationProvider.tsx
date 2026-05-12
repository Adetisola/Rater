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

  // 1. Force manual control
  useEffect(() => {
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }
    
    const handlePop = () => {
      sessionStorage.setItem("rater_is_pop_nav", "true");
    };

    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  // 2. Continuous Scroll Capture
  useEffect(() => {
    const handleScroll = () => {
      if (isRestoring.current) return;
      
      // Save position for the current route
      sessionStorage.setItem("rater_scroll_" + routeKey, window.scrollY.toString());
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [routeKey]);

  // 3. Handle Route Changes
  useEffect(() => {
    const isAppScope = pathname !== '/' && !pathname.startsWith('/app');
    if (!isAppScope) {
      sessionStorage.removeItem("rater_is_pop_nav");
      return;
    }

    const isPop = sessionStorage.getItem("rater_is_pop_nav") === "true";
    sessionStorage.removeItem("rater_is_pop_nav");

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
    const MAX_WAIT = 5000; // Increased to 5s to handle heavy pages
    const INTERVAL = 30;   // Check more frequently (30ms)

    const tryRestore = () => {
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      
      // If page is ready or we've waited too long, scroll
      if (maxScroll >= saved || elapsed >= MAX_WAIT) {
        window.scrollTo({
          top: saved,
          behavior: 'instant' as any
        });
        
        // Safety: ensure it stuck. Masonry grids can jump multiple times.
        setTimeout(() => {
            if (Math.abs(window.scrollY - saved) > 5) {
                window.scrollTo({ top: saved, behavior: 'instant' as any });
            }
            isRestoring.current = false;
        }, 150);
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
