'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';

const TITLE_VARIANTS = [
  (name: string) => `Hi ${name}, want to keep your reviews connected to you?`,
  (name: string) => `Hi ${name}, make your reviews part of your creative identity`,
  (name: string) => `Hi ${name}, your voice deserves an identity`,
  (name: string) => `Hi ${name}, keep your creative presence on Rater`,
  (name: string) => `Hi ${name}, turn your reviews into part of your profile`,
];

interface UseGuestEngagementPromptOptions {
  /** The current value of the guest name input */
  guestName: string;
  /** Whether the name input is currently focused */
  isNameFocused: boolean;
}

export function useGuestEngagementPrompt({ guestName, isNameFocused }: UseGuestEngagementPromptOptions) {
  const { currentAvatar } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Pick a random title variant once per session
  const titleIndex = useMemo(() => Math.floor(Math.random() * TITLE_VARIANTS.length), []);

  // Check session dismissal on mount
  useEffect(() => {
    const dismissed = sessionStorage.getItem('rater_guest_prompt_dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  // Core trigger: name field loses focus or user pauses typing with a valid name
  useEffect(() => {
    // Guard: only for guests who haven't been prompted yet
    if (currentAvatar || isDismissed || hasTriggered) return;

    const trimmedName = guestName.trim();
    const isValidName = trimmedName.length >= 2;

    // Clear any pending debounce when conditions change
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }

    if (!isValidName) return;

    if (!isNameFocused) {
      // Name field lost focus with a valid name — trigger after a short calm delay
      debounceRef.current = setTimeout(() => {
        const alreadyDismissed = sessionStorage.getItem('rater_guest_prompt_dismissed');
        if (!alreadyDismissed) {
          setIsVisible(true);
          setHasTriggered(true);
        }
      }, 600);
    } else {
      // User is still typing — use a longer debounce for pause detection
      debounceRef.current = setTimeout(() => {
        const alreadyDismissed = sessionStorage.getItem('rater_guest_prompt_dismissed');
        if (!alreadyDismissed) {
          setIsVisible(true);
          setHasTriggered(true);
        }
      }, 1200);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [guestName, isNameFocused, currentAvatar, isDismissed, hasTriggered]);

  const dismiss = useCallback(() => {
    setIsVisible(false);
    setIsDismissed(true);
    sessionStorage.setItem('rater_guest_prompt_dismissed', 'true');
  }, []);

  // Extract first name for a warmer greeting
  const firstName = guestName.trim().split(/\s+/)[0] || '';

  const personalizedTitle = firstName
    ? TITLE_VARIANTS[titleIndex](firstName)
    : 'Want to keep your reviews connected to you?';

  return {
    isVisible: isVisible && !currentAvatar && !isDismissed,
    dismiss,
    personalizedTitle,
    guestName: guestName.trim(),
  };
}
