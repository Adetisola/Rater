"use client";

import { useEffect, useState, useRef, useCallback, type CSSProperties } from 'react';

interface AmbientPlaceholderProps {
  /** The placeholder text to display */
  text: string;
  /** Unique key that changes on each text rotation */
  transitionKey: number;
  /** Whether to show the placeholder (hidden when user is typing) */
  visible: boolean;
}

/** Shared base styles for every placeholder span */
const BASE_STYLE: CSSProperties = {
  position: 'absolute',
  left: 0,
  top: '50%',
  marginTop: '-1rem',
  width: '100%',
  pointerEvents: 'none',
  userSelect: 'none',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  color: '#9ca3af',
  fontSize: '1rem',
  lineHeight: '2rem',
  fontFamily: 'inherit',
  willChange: 'opacity, transform',
};

interface TextLayer {
  id: number;
  text: string;
  /** 'entering' → just mounted, invisible at bottom; 'visible' → resting; 'exiting' → fading out upward */
  phase: 'entering' | 'visible' | 'exiting';
}

/**
 * A subtle animated placeholder overlay for the desktop search bar.
 *
 * Uses a dual-element crossfade so the outgoing text fades out on its
 * own span (undisturbed) while the incoming text fades in on a separate
 * span. This eliminates the flash where old text snaps to new text
 * mid-exit. CSS transitions only — no framer-motion, no navbar re-renders.
 */
export function AmbientPlaceholder({ text, transitionKey, visible }: AmbientPlaceholderProps) {
  const [layers, setLayers] = useState<TextLayer[]>([
    { id: transitionKey, text, phase: 'visible' },
  ]);
  const prevKeyRef = useRef(transitionKey);
  const cleanupRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup helper — remove exited layers after their transition
  const scheduleCleanup = useCallback((exitingId: number) => {
    if (cleanupRef.current) clearTimeout(cleanupRef.current);
    cleanupRef.current = setTimeout(() => {
      setLayers(prev => prev.filter(l => l.id !== exitingId));
    }, 350); // slightly longer than the exit transition (280ms) for safety
  }, []);

  useEffect(() => {
    if (transitionKey === prevKeyRef.current) return;
    const oldKey = prevKeyRef.current;
    prevKeyRef.current = transitionKey;

    // 1. Mark the current layer as exiting, add the new layer as entering
    setLayers(prev => [
      ...prev.map(l => ({ ...l, phase: 'exiting' as const })),
      { id: transitionKey, text, phase: 'entering' as const },
    ]);

    // 2. After a micro-frame, promote the new layer to visible (triggers CSS transition)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setLayers(prev =>
          prev.map(l =>
            l.phase === 'entering' ? { ...l, phase: 'visible' } : l
          )
        );
      });
    });

    // 3. Clean up the old (exiting) layer after its animation finishes
    scheduleCleanup(oldKey);

    return () => {
      if (cleanupRef.current) clearTimeout(cleanupRef.current);
    };
  }, [transitionKey, text, scheduleCleanup]);

  // Sync text for the visible layer if it changes without a key change
  useEffect(() => {
    setLayers(prev =>
      prev.map(l =>
        l.phase === 'visible' ? { ...l, text } : l
      )
    );
  }, [text]);

  if (!visible) return null;

  return (
    <>
      {layers.map(layer => (
        <span
          key={layer.id}
          aria-hidden="true"
          style={{
            ...BASE_STYLE,
            opacity: layer.phase === 'visible' ? 1 : 0,
            transform:
              layer.phase === 'exiting'
                ? 'translateY(-5px)'
                : layer.phase === 'entering'
                ? 'translateY(5px)'
                : 'translateY(0)',
            transition:
              layer.phase === 'entering'
                ? 'none'
                : layer.phase === 'exiting'
                ? 'opacity 280ms ease-out, transform 280ms ease-out'
                : 'opacity 320ms ease-in, transform 320ms ease-in',
          }}
        >
          {layer.text}
        </span>
      ))}
    </>
  );
}
