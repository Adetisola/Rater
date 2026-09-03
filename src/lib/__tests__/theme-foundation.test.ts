import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseThemePreference,
  resolveTheme,
  getStoredThemePreference,
  setStoredThemePreference,
  THEME_STORAGE_KEY,
} from '@/lib/theme';

describe('RAT-003: Theme Foundation Pure Policies', () => {
  describe('parseThemePreference', () => {
    it('accepts valid preference literals', () => {
      expect(parseThemePreference('system')).toBe('system');
      expect(parseThemePreference('light')).toBe('light');
      expect(parseThemePreference('dark')).toBe('dark');
    });

    it('strictly falls back to "system" for invalid strings', () => {
      expect(parseThemePreference('auto')).toBe('system');
      expect(parseThemePreference('DARK')).toBe('system');
      expect(parseThemePreference('light ')).toBe('system');
      expect(parseThemePreference('solarized')).toBe('system');
      expect(parseThemePreference('')).toBe('system');
    });

    it('strictly falls back to "system" for non-string values or nullish inputs', () => {
      expect(parseThemePreference(null)).toBe('system');
      expect(parseThemePreference(undefined)).toBe('system');
      expect(parseThemePreference(123)).toBe('system');
      expect(parseThemePreference(true)).toBe('system');
      expect(parseThemePreference(false)).toBe('system');
      expect(parseThemePreference({})).toBe('system');
      expect(parseThemePreference([])).toBe('system');
    });
  });

  describe('resolveTheme', () => {
    it('resolves "system" preference according to OS dark state', () => {
      expect(resolveTheme('system', true)).toBe('dark');
      expect(resolveTheme('system', false)).toBe('light');
    });

    it('resolves explicit "light" preference regardless of OS dark state', () => {
      expect(resolveTheme('light', true)).toBe('light');
      expect(resolveTheme('light', false)).toBe('light');
    });

    it('resolves explicit "dark" preference regardless of OS dark state', () => {
      expect(resolveTheme('dark', true)).toBe('dark');
      expect(resolveTheme('dark', false)).toBe('dark');
    });
  });

  describe('Storage Resilience & Browser Helper', () => {
    let originalLocalStorage: Storage;

    beforeEach(() => {
      originalLocalStorage = globalThis.localStorage;
    });

    afterEach(() => {
      Object.defineProperty(globalThis, 'localStorage', {
        value: originalLocalStorage,
        configurable: true,
        writable: true,
      });
    });

    it('reads valid stored preference from localStorage', () => {
      const mockStorage: Record<string, string> = {
        [THEME_STORAGE_KEY]: 'dark',
      };
      Object.defineProperty(globalThis, 'localStorage', {
        value: {
          getItem: vi.fn((key: string) => mockStorage[key] ?? null),
          setItem: vi.fn((key: string, val: string) => {
            mockStorage[key] = val;
          }),
        },
        configurable: true,
      });

      expect(getStoredThemePreference()).toBe('dark');
    });

    it('falls back to "system" when stored value is invalid', () => {
      Object.defineProperty(globalThis, 'localStorage', {
        value: {
          getItem: vi.fn(() => 'corrupt-value'),
          setItem: vi.fn(),
        },
        configurable: true,
      });

      expect(getStoredThemePreference()).toBe('system');
    });

    it('falls back to "system" when localStorage throws (e.g. storage blocked)', () => {
      Object.defineProperty(globalThis, 'localStorage', {
        value: {
          getItem: vi.fn(() => {
            throw new Error('Access denied');
          }),
          setItem: vi.fn(),
        },
        configurable: true,
      });

      expect(getStoredThemePreference()).toBe('system');
    });

    it('gracefully handles exceptions when setItem fails', () => {
      const setItemMock = vi.fn(() => {
        throw new Error('QuotaExceededError');
      });
      Object.defineProperty(globalThis, 'localStorage', {
        value: {
          getItem: vi.fn(),
          setItem: setItemMock,
        },
        configurable: true,
      });

      // Should not throw
      expect(() => setStoredThemePreference('dark')).not.toThrow();
      expect(setItemMock).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'dark');
    });
  });
});
