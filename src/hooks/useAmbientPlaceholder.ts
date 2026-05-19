"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Placeholder categories ───────────────────────────────────────────

const FUNCTIONAL_PROMPTS = [
  "Search work, creatives, or categories",
  "Search logo, UI, posters and more...",
  "Explore creative work",
  "Find work worth rating",
  "Search visual inspiration",
  "Search logo design",
  "Search brand identity",
  "Search UI design",
  "Search poster design",
  "Search packaging design",
  "Search typography",
  "Search illustration work",
  "Search AI-generated visuals",
  "Search creative profiles",
  "Discover design work",
  "Explore aesthetic-focused work",
  "Search purposeful designs",
  "Search designs that inspire you",
  "Find something sharp",
  "Let’s see what people are cooking",
];

const AMBIENT_MESSAGES: Record<string, string[]> = {
  morning: [
    "Good morning",
    "Morning, creative",
    "Fresh ideas this morning?",
    "Coffee and creativity",
    "Starting early today?",
  ],
  afternoon: [
    "What are you exploring today?",
    "Finding inspiration?",
    "Looking through fresh work?",
    "Discovering something new?",
    "Taking a creative break?",
  ],
  evening: [
    "Good evening",
    "Evening inspiration hits different",
    "Browsing late, huh?",
    "Quiet hours",
    "Omo, late session?",
  ],
  night: [
    "Hi, night owl",
    "Designing late again?",
    "Midnight inspiration?",
    "Still exploring?",
    "Ideas no dey sleep",
    "Late-night design session?",
    "Burning pixels tonight?",
    "The quiet hours are creative",
    "Ideas don't sleep early",
    "Night mode fits you",
  ],
};

// ─── Helpers ──────────────────────────────────────────────────────────

function getTimePeriod(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour <= 11) return 'morning';
  if (hour >= 12 && hour <= 17) return 'afternoon';
  if (hour >= 18 && hour <= 21) return 'evening';
  return 'night'; // 22-4
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Returns a random interval between 5000–8000ms */
function randomInterval(): number {
  return 5000 + Math.random() * 3000;
}

// ─── Hook ─────────────────────────────────────────────────────────────

/**
 * Represents the current state of the ambient placeholder hook.
 */
export interface AmbientPlaceholderState {
  /** The current placeholder text to display */
  currentText: string;
  /** Whether the rotation is currently active */
  isActive: boolean;
  /** Unique key for transition tracking */
  transitionKey: number;
}

/**
 * Configuration options required to drive the ambient placeholder behavior.
 */
interface UseAmbientPlaceholderOptions {
  /** Whether the input is focused */
  isFocused: boolean;
  /** Current value of the search input */
  inputValue: string;
  /** Whether categories are selected (suppresses placeholder) */
  hasCategories: boolean;
  /** Whether the feature is enabled (desktop only) */
  enabled: boolean;
}

const DEFAULT_PLACEHOLDER = "Search work, creatives, or categories...";

/**
 * A custom hook that cycles through a rotating list of creative and time-aware placeholder 
 * prompts when the search input is inactive. Reverts to the default placeholder upon focus or typing.
 *
 * @param options - Configuration options controlling the hook's active state.
 * @returns An object containing the current placeholder text, activity state, and transition key.
 */
export function useAmbientPlaceholder({
  isFocused,
  inputValue,
  hasCategories,
  enabled,
}: UseAmbientPlaceholderOptions): AmbientPlaceholderState {
  const [currentText, setCurrentText] = useState(DEFAULT_PLACEHOLDER);
  const [transitionKey, setTransitionKey] = useState(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastIndexRef = useRef(-1);
  const isActiveRef = useRef(false);

  // Should rotation be active?
  const shouldRotate = enabled && !isFocused && inputValue === '' && !hasCategories;

  const pickNextPlaceholder = useCallback(() => {
    // 70-80% functional, 20-30% ambient
    const useAmbient = Math.random() < 0.25;

    if (useAmbient) {
      const period = getTimePeriod();
      const messages = AMBIENT_MESSAGES[period];
      return pickRandom(messages);
    }

    // Pick a functional prompt, avoiding immediate repeat
    let idx: number;
    do {
      idx = Math.floor(Math.random() * FUNCTIONAL_PROMPTS.length);
    } while (idx === lastIndexRef.current && FUNCTIONAL_PROMPTS.length > 1);
    lastIndexRef.current = idx;
    return FUNCTIONAL_PROMPTS[idx];
  }, []);

  const scheduleNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      if (!isActiveRef.current) return;

      const next = pickNextPlaceholder();
      setCurrentText(next);
      setTransitionKey(k => k + 1);

      // Schedule the following rotation
      scheduleNext();
    }, randomInterval());
  }, [pickNextPlaceholder]);

  useEffect(() => {
    if (shouldRotate) {
      isActiveRef.current = true;

      // Start with the first rotation after a random delay
      // (don't immediately change on mount – let the default sit briefly)
      scheduleNext();
    } else {
      isActiveRef.current = false;
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      // When focused or typing, restore default
      if (isFocused || inputValue !== '') {
        setCurrentText(DEFAULT_PLACEHOLDER);
        setTransitionKey(k => k + 1);
      }
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [shouldRotate, isFocused, inputValue, scheduleNext]);

  return {
    currentText,
    isActive: shouldRotate,
    transitionKey,
  };
}
