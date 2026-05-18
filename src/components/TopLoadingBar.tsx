"use client";

import { useEffect, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export function TopLoadingBar() {
  const [isNavigating, setIsNavigating] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Cancel loader when route completes or changes
  useEffect(() => {
    setIsNavigating(false);
  }, [pathname, searchParams]);

  useEffect(() => {
    // Intercept clicks on links globally
    const handleAnchorClick = (e: MouseEvent) => {
      // Skip if the click originated from inside an element that opts out (e.g. PostActionsMenu)
      const target = e.target as Element;
      if (target.closest("[data-no-route-loader]")) return;

      // Find closest anchor tag
      const anchor = target.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      
      const href = anchor.href;
      if (!href) return;
      
      // Ignore new tabs or system-modifier clicks
      if (anchor.target === "_blank") return;
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey || e.button !== 0) return;

      // Handle download links or other non-navigations
      if (anchor.hasAttribute("download")) return;

      try {
        const url = new URL(href);
        const currentUrl = window.location;

        // 1. Must be same-origin
        if (url.origin !== currentUrl.origin) return;
        
        // 2. SCOPE CRITICAL: Apply loader for all app routes (exclude landing page)
        const isAppRoute = url.pathname !== '/';
        const isProfileRoute = url.pathname.startsWith('/@') || url.pathname.startsWith('/%40');
        if (!isAppRoute && !isProfileRoute) return;

        // 3. Prevent duplicate trigger on same page (e.g. hash changes)
        if (
          url.pathname === currentUrl.pathname && 
          url.search === currentUrl.search
        ) {
          return;
        }

        // Delay starting the state slightly is handled by framer-motion delay
        setIsNavigating(true);
      } catch (err) {
        // invalid URL
      }
    };

    // Custom event listener for programmatic navigation we can trigger if needed
    const handleCustomNavStart = () => setIsNavigating(true);

    document.addEventListener("click", handleAnchorClick, true);
    window.addEventListener("app-navigation-start", handleCustomNavStart);

    return () => {
      document.removeEventListener("click", handleAnchorClick, true);
      window.removeEventListener("app-navigation-start", handleCustomNavStart);
    };
  }, []);

  return (
    <AnimatePresence>
      {isNavigating && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut", delay: 0.15 }} // 150ms UX delay
          className="fixed top-0 left-0 w-full z-99999 pointer-events-none"
        >
          <div 
            className="h-1.5 w-full rounded-b-md"
            style={{
              background: "linear-gradient(to right, #fec312, #ff4f6d, #c400d2, #7c3bed)",
              backgroundSize: "200% 100%",
              animation: "flowing-gradient 2s linear infinite"
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
