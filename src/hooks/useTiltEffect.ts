// useTiltEffect — Desktop-only 3D tilt on mouse hover
// Uses direct DOM manipulation via requestAnimationFrame to avoid React re-renders.
// GPU-accelerated: only touches transform + will-change.

import { useRef, useEffect, useCallback } from 'react';

const MAX_TILT_DEG = 8;          // max rotation in degrees
const EASE_FACTOR   = 0.12;      // lerp speed (0–1, lower = smoother)
const DESKTOP_MQ    = '(min-width: 1024px)';

interface TiltState {
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  hovering: boolean;
  rafId: number | null;
}

export function useTiltEffect<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const state = useRef<TiltState>({
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
    hovering: false,
    rafId: null,
  });
  const isDesktop = useRef(false);

  // ── animation loop ──────────────────────────────────────────────
  const tick = useCallback(() => {
    const s = state.current;
    const el = ref.current;
    if (!el) return;

    // lerp current → target
    s.currentX += (s.targetX - s.currentX) * EASE_FACTOR;
    s.currentY += (s.targetY - s.currentY) * EASE_FACTOR;

    // snap to zero when close enough (avoid infinite loop on idle)
    if (Math.abs(s.currentX - s.targetX) < 0.01) s.currentX = s.targetX;
    if (Math.abs(s.currentY - s.targetY) < 0.01) s.currentY = s.targetY;

    el.style.transform =
      `perspective(800px) rotateX(${s.currentY}deg) rotateY(${-s.currentX}deg)`;

    // keep looping while values haven't settled
    const settled =
      s.currentX === s.targetX && s.currentY === s.targetY;

    if (!settled) {
      s.rafId = requestAnimationFrame(tick);
    } else {
      s.rafId = null;
    }
  }, []);

  const startLoop = useCallback(() => {
    if (state.current.rafId === null) {
      state.current.rafId = requestAnimationFrame(tick);
    }
  }, [tick]);

  // ── event handlers ──────────────────────────────────────────────
  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const mq = window.matchMedia(DESKTOP_MQ);
    isDesktop.current = mq.matches;

    const onMqChange = (e: MediaQueryListEvent) => {
      isDesktop.current = e.matches;
      if (!e.matches) {
        // reset immediately when leaving desktop
        state.current.targetX = 0;
        state.current.targetY = 0;
        startLoop();
      }
    };
    mq.addEventListener('change', onMqChange);

    const onMouseMove = (e: MouseEvent) => {
      if (!isDesktop.current) return;
      const rect = el.getBoundingClientRect();
      // normalise to -1 … +1
      const nx = ((e.clientX - rect.left) / rect.width  - 0.5) * 2;
      const ny = ((e.clientY - rect.top)  / rect.height - 0.5) * 2;

      state.current.targetX = nx * MAX_TILT_DEG;
      state.current.targetY = ny * MAX_TILT_DEG;
      state.current.hovering = true;
      startLoop();
    };

    const onMouseLeave = () => {
      state.current.targetX = 0;
      state.current.targetY = 0;
      state.current.hovering = false;
      startLoop();
    };

    // set will-change once
    el.style.willChange = 'transform';
    el.style.transition = 'none'; // we handle easing manually

    el.addEventListener('mousemove', onMouseMove, { passive: true });
    el.addEventListener('mouseleave', onMouseLeave, { passive: true });

    return () => {
      el.removeEventListener('mousemove', onMouseMove);
      el.removeEventListener('mouseleave', onMouseLeave);
      mq.removeEventListener('change', onMqChange);
      if (state.current.rafId !== null) {
        cancelAnimationFrame(state.current.rafId);
      }
      // clean up inline styles
      el.style.willChange = '';
      el.style.transform = '';
    };
  }, [startLoop]);

  return ref;
}
