"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import {
  type ThemePreference,
  type ResolvedTheme,
  THEME_STORAGE_KEY,
  parseThemePreference,
  resolveTheme,
  getStoredThemePreference,
  setStoredThemePreference,
} from '@/lib/theme';

export interface ThemeContextValue {
  preference: ThemePreference;
  setPreference: (pref: ThemePreference) => void;
  resolvedTheme: ResolvedTheme;
  isHydrated: boolean;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');
  const [systemIsDark, setSystemIsDark] = useState<boolean>(false);
  const [isHydrated, setIsHydrated] = useState<boolean>(false);

  // Initialize preference and listeners after client mount
  useEffect(() => {
    const root = document.documentElement;
    const domPref = root.getAttribute('data-theme-preference');
    const initialPref = parseThemePreference(domPref || getStoredThemePreference());

    const mql = window.matchMedia('(prefers-color-scheme: dark)');
    setPreferenceState(initialPref);
    setSystemIsDark(mql.matches);
    setIsHydrated(true);

    const handleSystemChange = (e: MediaQueryListEvent) => {
      setSystemIsDark(e.matches);
    };
    mql.addEventListener('change', handleSystemChange);

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY) {
        const newPref = parseThemePreference(e.newValue);
        setPreferenceState(newPref);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      mql.removeEventListener('change', handleSystemChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const resolvedTheme = useMemo(
    () => resolveTheme(preference, systemIsDark),
    [preference, systemIsDark]
  );

  // Synchronize DOM attributes and existing meta theme-color tag
  useEffect(() => {
    if (!isHydrated) return;

    const root = document.documentElement;
    const isDark = resolvedTheme === 'dark';

    if (isDark) {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
    root.setAttribute('data-theme-preference', preference);
    root.style.colorScheme = isDark ? 'dark' : 'light';

    // In-place mutate the single canonical theme-color meta tag
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      const isLanding = typeof window !== 'undefined' && window.location.pathname === '/';
      metaThemeColor.setAttribute(
        'content',
        isLanding ? '#FEC312' : (isDark ? '#0A0A0A' : '#FFFFFF')
      );
    }
  }, [preference, resolvedTheme, isHydrated]);

  const setPreference = useCallback((newPref: ThemePreference) => {
    const validPref = parseThemePreference(newPref);
    setPreferenceState(validPref);
    setStoredThemePreference(validPref);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      setPreference,
      resolvedTheme,
      isHydrated,
    }),
    [preference, setPreference, resolvedTheme, isHydrated]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
