/**
 * Theme Foundation Types and Pure Policy Helpers for Rater
 * Independent of React or browser DOM for safe Node-environment execution and testing.
 */

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'rater_theme';

/**
 * Validates and parses a raw theme preference value.
 * Invalid, missing, or corrupt values strictly fall back to 'system'.
 */
export function parseThemePreference(value: unknown): ThemePreference {
  if (value === 'light' || value === 'dark' || value === 'system') {
    return value;
  }
  return 'system';
}

/**
 * Resolves the effective visual theme ('light' or 'dark') based on the user's preference
 * and the operating system's color-scheme preference.
 */
export function resolveTheme(
  preference: ThemePreference,
  systemIsDark: boolean
): ResolvedTheme {
  if (preference === 'light') return 'light';
  if (preference === 'dark') return 'dark';
  return systemIsDark ? 'dark' : 'light';
}

/**
 * Safely reads the stored theme preference from browser localStorage.
 * If running on the server or storage access throws (e.g. security blocks/private browsing),
 * safely falls back to 'system'.
 */
export function getStoredThemePreference(): ThemePreference {
  const storage =
    typeof window !== 'undefined' && window.localStorage
      ? window.localStorage
      : typeof localStorage !== 'undefined'
      ? localStorage
      : null;

  if (!storage) {
    return 'system';
  }
  try {
    const stored = storage.getItem(THEME_STORAGE_KEY);
    return parseThemePreference(stored);
  } catch {
    return 'system';
  }
}

/**
 * Safely writes the user's theme preference to browser localStorage.
 */
export function setStoredThemePreference(preference: ThemePreference): void {
  const storage =
    typeof window !== 'undefined' && window.localStorage
      ? window.localStorage
      : typeof localStorage !== 'undefined'
      ? localStorage
      : null;

  if (!storage) {
    return;
  }
  try {
    storage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Gracefully ignore quota or security exceptions in restricted browser environments
  }
}
