"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

const MIN_DURATION = 400; // ms (minimum time the bar stays visible)
const FAIL_SAFE_TIMEOUT = 5000; // ms (absolute maximum time if navigation hangs)

/**
 * GlobalRouteLoader
 * An advanced, split-trigger loading bar that prioritizes absolute responsiveness.
 * It uses both Intent Detection (clicks/history) and Settlement Detection (pathname/search).
 */
function GlobalLoaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [status, setStatus] = useState<"idle" | "loading" | "completing">("idle");
  const [progress, setProgress] = useState(0);
  
  // Refs to track state and avoid effect loops
  const startTime = useRef<number>(0);
  const isRouteCompleted = useRef(false);
  const lastPathname = useRef(pathname);
  const lastSearch = useRef(searchParams.toString());
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const failSafeRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (failSafeRef.current) clearTimeout(failSafeRef.current);
  };

  /**
   * Intent Start: Triggered by user interaction or history change
   */
  const startLoader = () => {
    // If navigation restarts while completing, reset cleanly
    cleanup();
    
    startTime.current = Date.now();
    isRouteCompleted.current = false;
    setStatus("loading");
    setProgress(0);

    // Initial smooth growth to 70%
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 70) {
          // Slow nudge from 70% -> 95% while waiting for route settlement
          if (prev >= 95) return 95;
          return prev + 0.3;
        }
        // Snap fast to start
        const jump = Math.random() * 15 + 8; 
        return Math.min(prev + jump, 70);
      });
    }, 150);

    // Strict fail-safe
    failSafeRef.current = setTimeout(() => {
      finishLoader();
    }, FAIL_SAFE_TIMEOUT);
  };

  /**
   * Final Completion: Resolves the bar to 100% and wipes state
   */
  const finishLoader = () => {
    setStatus("completing");
    setProgress(100);
    cleanup();

    // Reset to idle after exit animation
    setTimeout(() => {
      setStatus("idle");
      setProgress(0);
    }, 600);
  };

  // 1. SETTLEMENT DETECTION (Trigger on actual URL change)
  useEffect(() => {
    const currentSearch = searchParams.toString();
    const hasChanged = pathname !== lastPathname.current || currentSearch !== lastSearch.current;
    
    if (hasChanged) {
      lastPathname.current = pathname;
      lastSearch.current = currentSearch;

      // Only act if we are within the app scope (all non-landing routes)
      const isAppScope = pathname !== '/';
      if (isAppScope) {
        // Fallback: If intent wasn't caught (e.g. browser back button), start it now
        if (status === "idle") {
          startLoader();
        }
        
        isRouteCompleted.current = true;
        
        // Calculate remaining time for the minimum visible duration
        const elapsed = Date.now() - startTime.current;
        const remaining = Math.max(0, MIN_DURATION - elapsed);
        
        // Delay completion until both: 1. Route changed AND 2. Min duration met
        setTimeout(() => {
          finishLoader();
        }, remaining);
      } else {
        // Instantly clear if navigating out of app scope
        finishLoader();
      }
    }
  }, [pathname, searchParams]);

  // 2. INTENT DETECTION (Hooking into clicks and history API)
  useEffect(() => {
    // Suppression window: when a click inside [data-no-route-loader] is detected,
    // block ALL loader triggers for a short period to cover pushState calls
    // that may follow from the same user interaction.
    let suppressUntil = 0;

    const handleNavigationIntent = (url: URL | string) => {
      // Respect the suppression window
      if (Date.now() < suppressUntil) return;

      const href = typeof url === "string" ? url : url.pathname;
      // Trigger for all in-app routes (exclude landing page)
      const isAppRoute = href !== '/';
      const isProfileRoute = href.startsWith('/@') || href.startsWith('/%40');
      if (isAppRoute || isProfileRoute) {
        // Defer start to the next tick to avoid scheduling updates during 
        // sensitive phases like useInsertionEffect (common in Next.js 15 router)
        setTimeout(() => {
          startLoader();
        }, 0);
      }
    };

    // A. Intercept Link clicks
    const handleAnchorClick = (e: MouseEvent) => {
      // Skip if the click originated from inside an element that opts out
      const target = e.target as Element;
      if (target.closest("[data-no-route-loader]")) {
        // Suppress all loader triggers for 100ms to also block pushState-based triggers
        suppressUntil = Date.now() + 100;
        return;
      }

      const anchor = target.closest("a");
      if (!anchor) return;

      const href = anchor.href;
      if (!href || anchor.target === "_blank") return;
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;
      if (anchor.hasAttribute("download")) return;

      try {
        const url = new URL(href);
        if (url.origin !== window.location.origin) return;
        
        // Ignore same-route interactions
        if (url.pathname === window.location.pathname && url.search === window.location.search) {
          return;
        }

        handleNavigationIntent(url);
      } catch (err) {}
    };

    document.addEventListener("click", handleAnchorClick, true);

    return () => {
      document.removeEventListener("click", handleAnchorClick, true);
    };
  }, []);

  useEffect(() => cleanup, []);

  return (
    <AnimatePresence>
      {status !== "idle" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed top-0 left-0 right-0 z-100000 pointer-events-none"
        >
          <div className="h-[4px] w-full overflow-hidden">
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ 
                type: "spring", 
                stiffness: status === "completing" ? 120 : 20, 
                damping: 25,
                mass: 0.5
              }}
              className="h-full w-full rounded-full"
              style={{
                background: "linear-gradient(to right, #fec312, #ff4f6d, #c400d2, #7c3bed)",
                backgroundSize: "200% 100%",
                animation: "flowing-gradient 2s linear infinite"
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function GlobalRouteLoader() {
  return (
    <Suspense fallback={null}>
      <GlobalLoaderContent />
    </Suspense>
  );
}
