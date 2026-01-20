import { useState, useEffect } from 'react';

/**
 * Debounce hook - delays value updates to prevent excessive re-renders.
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 150ms)
 */
export function useDebounce<T>(value: T, delay: number = 150): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
