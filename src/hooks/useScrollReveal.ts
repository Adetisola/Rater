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
  /** Trigger animation only once and never exit (default false) */
  triggerOnce?: boolean;
}

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {}
) {
  const { enterThreshold = 0.2, rootMargin = '-8% 0px', triggerOnce = false } = options;
  const ref = useRef<T>(null);
  const [state, setState] = useState<RevealState>('hidden');
  const hasBeenVisible = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Do NOT animate on initial load if already well in view to prevent flashing
    // We check initial bounding client rect
    if (triggerOnce) {
      const rect = el.getBoundingClientRect();
      const inViewOnLoad = rect.top < window.innerHeight && rect.bottom >= 0;
      if (inViewOnLoad && document.readyState === 'complete') {
        hasBeenVisible.current = true;
        setState('visible');
        return; // Don't even start observer
      }
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && entry.intersectionRatio >= enterThreshold) {
          hasBeenVisible.current = true;
          setState('visible');
          if (triggerOnce) observer.unobserve(el);
        } else if (!entry.isIntersecting && hasBeenVisible.current && !triggerOnce) {
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
  }, [enterThreshold, rootMargin, triggerOnce]);

  return { ref, state };
}
