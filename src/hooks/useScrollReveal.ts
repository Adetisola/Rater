// useScrollReveal — Bi-directional scroll reveal with soft exit.
// Tracks three states: 'hidden' (never seen), 'visible' (in viewport), 'exited' (scrolled away).
// Uses Intersection Observer with threshold buffering to prevent flickering.

import { useRef, useState, useEffect } from 'react';

export type RevealState = 'hidden' | 'visible' | 'exited';

interface ScrollRevealOptions {
  /** Fraction visible to trigger enter (default 0.2) */
  enterThreshold?: number;
  /** Root margin for buffer zone (default '-8% 0px') */
  rootMargin?: string;
}

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {}
) {
  const { enterThreshold = 0.2, rootMargin = '-8% 0px' } = options;
  const ref = useRef<T>(null);
  const [state, setState] = useState<RevealState>('hidden');
  const hasBeenVisible = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= enterThreshold) {
          hasBeenVisible.current = true;
          setState('visible');
        } else if (!entry.isIntersecting && hasBeenVisible.current) {
          setState('exited');
        }
      },
      {
        threshold: [0, enterThreshold, 0.5],
        rootMargin,
      }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [enterThreshold, rootMargin]);

  return { ref, state };
}
