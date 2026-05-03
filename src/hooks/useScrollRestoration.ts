import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/**
 * useScrollRestoration
 * 
 * Manually tracks and restores the scroll position of the window for a given route.
 * This is crucial for pages where content loads asynchronously (like Masonry grids)
 * causing Next.js's native scroll restoration to fail because the DOM height is initially 0.
 *
 * @param uniqueKey - A string to namespace the scroll position (usually the component name)
 * @param isReady - Only attempt to restore scroll when this is true (e.g. after data is loaded)
 */
export function useScrollRestoration(uniqueKey: string, isReady: boolean = true) {
  const pathname = usePathname();

  // 1. Save scroll position on scroll and on unmount
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem(`scroll-${pathname}-${uniqueKey}`, window.scrollY.toString());
    };

    let timeout: NodeJS.Timeout;
    const throttledScroll = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(handleScroll, 100);
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', throttledScroll);
      if (timeout) clearTimeout(timeout);
      // Save exact position right before unmount/navigation
      handleScroll();
    };
  }, [pathname, uniqueKey]);

  // 2. Restore scroll position once the content is ready
  useEffect(() => {
    if (!isReady) return;

    const savedPosition = sessionStorage.getItem(`scroll-${pathname}-${uniqueKey}`);
    if (savedPosition) {
      const y = parseInt(savedPosition, 10);
      
      // Disable native scroll restoration temporarily to prevent fighting
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
      }

      // Restore immediately
      window.scrollTo(0, y);
      
      // Restore across a few ticks to account for images/masonry rendering layouts
      requestAnimationFrame(() => {
        window.scrollTo(0, y);
        setTimeout(() => window.scrollTo(0, y), 50);
        setTimeout(() => window.scrollTo(0, y), 150);
        setTimeout(() => {
          window.scrollTo(0, y);
          // Re-enable native scroll restoration
          if ('scrollRestoration' in history) {
            history.scrollRestoration = 'auto';
          }
        }, 350);
      });
    }
  }, [pathname, uniqueKey, isReady]);
}
