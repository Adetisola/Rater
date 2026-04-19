"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

/**
 * GlobalRouteLoader Content
 * Watches for route changes within /app and manages the loading state machine.
 */
function GlobalLoaderContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [status, setStatus] = useState<"idle" | "loading" | "completing">("idle");
  const [progress, setProgress] = useState(0);
  
  // Track route to detect changes across pathname and search queries
  const lastPathname = useRef(pathname);
  const lastSearch = useRef(searchParams.toString());
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  const startLoading = () => {
    cleanup();
    setStatus("loading");
    setProgress(0);

    // 1. Simulated Progress (10% -> 90%)
    // Creates a "fake" progress feel while navigation resolves
    timerRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90;
        // Random incremental steps for a more organic feel
        const jump = Math.random() * 8 + 2; 
        return Math.min(prev + jump, 90);
      });
    }, 250);

    // 2. Fail-safe: Force complete after 5s to prevent getting stuck
    timeoutRef.current = setTimeout(() => {
      completeLoading();
    }, 5000);
  };

  const completeLoading = () => {
    setStatus("completing");
    setProgress(100);
    cleanup();

    // Return to idle state after animation completes
    setTimeout(() => {
      setStatus("idle");
      setProgress(0);
    }, 600); // Slightly longer than fade transition
  };

  useEffect(() => {
    const currentSearch = searchParams.toString();
    const hasChanged = pathname !== lastPathname.current || currentSearch !== lastSearch.current;
    
    if (hasChanged) {
      lastPathname.current = pathname;
      lastSearch.current = currentSearch;

      // EXCLUSION: Only trigger for navigations within/into /app
      if (pathname.startsWith("/app")) {
        startLoading();

        // SETTLEMENT: Simulate "settling" delay to ensure progress is visible 
        // and feels premium even on fast loads (min 400ms feel)
        const settlementTimer = setTimeout(() => {
          completeLoading();
        }, 400);

        return () => clearTimeout(settlementTimer);
      } else {
        // Instant reset if navigating away from the app scope
        setStatus("idle");
        setProgress(0);
        cleanup();
      }
    }
  }, [pathname, searchParams]);

  // Final cleanup on unmount
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
                stiffness: status === "completing" ? 100 : 25, 
                damping: 20,
                mass: 1
              }}
              className="h-full w-full rounded-full"
              style={{
                // Premium Gradient Bar
                background: "linear-gradient(to right, #fec312, #ff4f6d, #c400d2, #7c3bed)",
                backgroundSize: "200% 100%",
                // Flowing shimmer effect from index.css
                animation: "flowing-gradient 2s linear infinite"
              }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * GlobalRouteLoader
 * Main component with Suspense boundary for Next.js searchParams safety.
 */
export function GlobalRouteLoader() {
  return (
    <Suspense fallback={null}>
      <GlobalLoaderContent />
    </Suspense>
  );
}
