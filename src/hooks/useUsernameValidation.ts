import { useState, useEffect, useRef, useCallback } from 'react';
import { RESERVED_ROUTES } from '../lib/constants';

export type UsernameValidationStatus =
  | 'idle'
  | 'checking'
  | 'valid'
  | 'taken'
  | 'invalid_format'
  | 'cooldown'
  | 'unchanged';

export interface UsernameValidationResult {
  status: UsernameValidationStatus;
  message: string;
  daysRemaining?: number;
  suggestions: string[];
}

const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;
const COOLDOWN_DAYS = 14;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

function generateSuggestions(base: string): string[] {
  // Clamp base to 15 chars to allow suffixes within the 20-char limit
  const safeBase = base.slice(0, 15);
  const digit = Math.floor(Math.random() * 899 + 100);
  const randomWords = ['design', 'codes', 'art', 'ui', 'ux', 'vault', 'labs'];
  const randomSuffix = randomWords[Math.floor(Math.random() * randomWords.length)];

  return [
    `${safeBase}${digit}`,                  // timmy123
    `${safeBase}_${randomSuffix}`,          // timmy_codes
    `${safeBase}_`,                        // timmy_
    `the_${safeBase}`,                      // the_timmy
    `${safeBase}_vibe`                      // timmy_vibe
  ].filter(s => /^[a-z0-9_]{3,20}$/.test(s));
}

interface UseUsernameValidationOptions {
  currentUsername: string;                        // The avatar's existing username (to detect unchanged)
  usernameLastChangedAt?: number;                 // Last change timestamp (for cooldown)
  checkAvailability: (username: string) => Promise<boolean>;  // Async uniqueness check
  debounceMs?: number;
}

export function useUsernameValidation({
  currentUsername,
  usernameLastChangedAt,
  checkAvailability,
  debounceMs = 350,
}: UseUsernameValidationOptions) {
  const [input, setInput] = useState(currentUsername);
  const [result, setResult] = useState<UsernameValidationResult>({
    status: 'idle',
    message: '',
    suggestions: [],
  });

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestInput = useRef(input);

  const validate = useCallback(
    async (value: string) => {
      const normalized = value.toLowerCase().trim();

      // Unchanged  
      if (normalized === currentUsername.toLowerCase()) {
        setResult({ status: 'unchanged', message: '', suggestions: [] });
        return;
      }

      // Format check first (synchronous)
      if (!USERNAME_REGEX.test(normalized)) {
        let message = 'Username must be 3–20 characters using only a–z, 0–9, and _.';
        if (value.includes(' ')) message = 'No spaces allowed.';
        else if (/[A-Z]/.test(value)) message = 'Lowercase letters only.';
        else if (value.length < 3) message = 'At least 3 characters required.';
        else if (value.length > 20) message = 'Maximum 20 characters.';
        setResult({ status: 'invalid_format', message, suggestions: [] });
        return;
      }

      // Reserved routes check (synchronous)
      if (RESERVED_ROUTES.has(normalized)) {
        setResult({ 
          status: 'taken', 
          message: 'This username is reserved and cannot be claimed.', 
          suggestions: generateSuggestions(normalized) 
        });
        return;
      }

      // Cooldown check (synchronous, before async)
      if (usernameLastChangedAt) {
        const elapsed = Date.now() - usernameLastChangedAt;
        if (elapsed < COOLDOWN_MS) {
          const daysRemaining = Math.ceil((COOLDOWN_MS - elapsed) / (24 * 60 * 60 * 1000));
          setResult({
            status: 'cooldown',
            message: `You can change your username again in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.`,
            daysRemaining,
            suggestions: [],
          });
          return;
        }
      }

      // Async uniqueness check
      setResult({ status: 'checking', message: 'Checking availability...', suggestions: [] });
      try {
        const isAvailable = await checkAvailability(normalized);
        // Guard stale async response
        if (latestInput.current.toLowerCase().trim() !== normalized) return;
        if (isAvailable) {
          setResult({ status: 'valid', message: 'Username is available!', suggestions: [] });
        } else {
          setResult({
            status: 'taken',
            message: 'This username is already taken.',
            suggestions: generateSuggestions(normalized),
          });
        }
      } catch {
        setResult({ status: 'idle', message: 'Could not check availability.', suggestions: [] });
      }
    },
    [currentUsername, usernameLastChangedAt, checkAvailability]
  );

  const handleChange = useCallback(
    (value: string) => {
      setInput(value);
      latestInput.current = value;

      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => validate(value), debounceMs);
    },
    [validate, debounceMs]
  );

  const lastValidatedProp = useRef<string | null>(null);

  // Re-validate when currentUsername changes (e.g., after a successful save)
  useEffect(() => {
    if (currentUsername !== lastValidatedProp.current) {
      lastValidatedProp.current = currentUsername;
      
      // Sync internal state if it came from outside
      if (currentUsername !== latestInput.current) {
        setInput(currentUsername);
        latestInput.current = currentUsername;
      }
      
      // Always trigger validation for the new base value
      validate(currentUsername);
    }
  }, [currentUsername, validate]);

  return { input, handleChange, result, validate };
}
