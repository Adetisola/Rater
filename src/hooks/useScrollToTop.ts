// useScrollToTop - forces scroll to top on mount
// Only used for the landing page to prevent scroll restoration issues

import { useLayoutEffect } from 'react';

export function useScrollToTop() {
  useLayoutEffect(() => {
    // Force scroll to top synchronously before paint
    window.scrollTo(0, 0);

    // Also override any browser scroll restoration
    if ('scrollRestoration' in history) {
      history.scrollRestoration = 'manual';
    }

    return () => {
      // Restore default behavior when unmounting (e.g., navigating to /app)
      if ('scrollRestoration' in history) {
        history.scrollRestoration = 'auto';
      }
    };
  }, []);
}
