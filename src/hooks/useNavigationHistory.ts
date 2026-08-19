"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

// In-memory navigation history tracker for the current session
const navigationStack: string[] = [];
let isInitialized = false;

export function useNavigationHistory() {
  const pathname = usePathname();
  const router = useRouter();
  const [hasMeaningfulHistory, setHasMeaningfulHistory] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!isInitialized) {
      isInitialized = true;
      // First page load of this browser session / tab
      navigationStack.push(pathname);
      // Check if referrer is internal and history state index > 0
      const hasInternalReferrer =
        document.referrer &&
        document.referrer.startsWith(window.location.origin) &&
        !document.referrer.endsWith(pathname);

      setHasMeaningfulHistory(Boolean(hasInternalReferrer && navigationStack.length > 1));
    } else {
      // Subsequent internal client-side navigation
      const lastRoute = navigationStack[navigationStack.length - 1];
      if (lastRoute !== pathname) {
        navigationStack.push(pathname);
      }
      setHasMeaningfulHistory(navigationStack.length > 1);
    }
  }, [pathname]);

  const goBack = () => {
    if (navigationStack.length > 1) {
      navigationStack.pop(); // Pop current
      router.back();
    } else {
      window.dispatchEvent(new Event("app-navigation-start"));
      router.push("/browse", { scroll: false });
    }
  };

  return {
    hasMeaningfulHistory,
    goBack,
    previousRoute: navigationStack.length > 1 ? navigationStack[navigationStack.length - 2] : null,
  };
}
