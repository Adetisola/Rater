// ShimmerOverlay — Desktop-only ambient shimmer effect
// Renders a subtle diagonal light sweep that triggers on a randomized interval.
// Completely inert on mobile/tablet. Does not affect layout or sizing.

import { useState, useEffect, useCallback, useRef } from 'react';

const DESKTOP_MQ = '(min-width: 1024px)';
const MIN_DELAY_MS = 6000;
const MAX_DELAY_MS = 10000;
const SWEEP_DURATION_MS = 1000; // matches CSS animation duration

function randomDelay() {
  return MIN_DELAY_MS + Math.random() * (MAX_DELAY_MS - MIN_DELAY_MS);
}

export function ShimmerOverlay() {
  const [active, setActive] = useState(false);
  const isDesktop = useRef(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSweep = useCallback(() => {
    timeoutRef.current = setTimeout(() => {
      if (!isDesktop.current) return;
      setActive(true);

      // Deactivate after the animation finishes
      setTimeout(() => {
        setActive(false);
        // Schedule the next sweep
        if (isDesktop.current) scheduleSweep();
      }, SWEEP_DURATION_MS);
    }, randomDelay());
  }, []);

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ);
    isDesktop.current = mq.matches;

    const onMqChange = (e: MediaQueryListEvent) => {
      isDesktop.current = e.matches;
      if (!e.matches) {
        setActive(false);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      } else {
        scheduleSweep();
      }
    };

    mq.addEventListener('change', onMqChange);

    // Kick off the first cycle on desktop
    if (isDesktop.current) scheduleSweep();

    return () => {
      mq.removeEventListener('change', onMqChange);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [scheduleSweep]);

  // Render nothing on non-desktop (the overlay is still mounted but invisible)
  return (
    <div
      className="shimmer-overlay"
      aria-hidden="true"
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 15,
        borderRadius: 'inherit',
      }}
    >
      <div
        className={active ? 'shimmer-band shimmer-band--active' : 'shimmer-band'}
      />
    </div>
  );
}
