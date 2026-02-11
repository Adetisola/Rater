// RevealSection - Intersection Observer wrapper for landing page sections
// Delays mounting of children until they enter the viewport
// Prevents layout shifts from offscreen sections affecting initial load

import { useRef, useState, useEffect, type ReactNode } from 'react';
import { motion } from 'framer-motion';

interface RevealSectionProps {
  children: ReactNode;
  /** Minimum height placeholder before content mounts (prevents layout collapse) */
  minHeight?: string;
  /** Root margin to trigger slightly before entering viewport */
  rootMargin?: string;
  /** Delay in ms before allowing reveal (used to let hero settle first) */
  mountDelay?: number;
}

export function RevealSection({ 
  children, 
  minHeight = '100px',
  rootMargin = '100px 0px',
  mountDelay = 0
}: RevealSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isDelayComplete, setIsDelayComplete] = useState(mountDelay === 0);

  // Handle mount delay (lets hero settle before other sections can reveal)
  useEffect(() => {
    if (mountDelay === 0) return;
    const timer = setTimeout(() => setIsDelayComplete(true), mountDelay);
    return () => clearTimeout(timer);
  }, [mountDelay]);

  // Intersection Observer - triggers when section enters viewport
  useEffect(() => {
    if (!isDelayComplete) return;

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Only reveal once
        }
      },
      {
        rootMargin,
        threshold: 0.01, // Trigger as soon as 1% is visible
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [isDelayComplete, rootMargin]);

  return (
    <div ref={ref} style={{ minHeight: isVisible ? undefined : minHeight }}>
      {isVisible ? (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      ) : null}
    </div>
  );
}
