import { useState, useEffect, type RefObject } from 'react';

// The minimum ideal width a column should be before the grid considers adding a new one.
// Matches the standard browse feed card sizing (~210px–280px).
const MIN_COLUMN_WIDTH = 210;
const GAP = 16; // 1rem (gap-4 equivalent)

export function useMasonryColumns(containerRef?: RefObject<HTMLElement | null>) {
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const updateColumns = () => {
      const targetElement = containerRef?.current;
      const width = targetElement && targetElement.offsetWidth > 0
        ? targetElement.offsetWidth
        : document.documentElement.clientWidth;
      
      // Explicit viewport breakpoints for Mobile and Tablet explicitly requested by design
      if (width <= 375) {
        setColumns(1);
        return;
      }
      
      if (width > 375 && width <= 640) {
        setColumns(2);
        return;
      }
      
      // Estimate the available container width by subtracting side padding 
      const padding = targetElement ? 0 : (width >= 768 ? 48 : 32);
      const availableWidth = width - padding;
      
      // Calculate how many times a 'minimum sized column + gap' fits into the available space
      const calculatedColumns = Math.floor((availableWidth + GAP) / (MIN_COLUMN_WIDTH + GAP));
      
      // Enforce at least 1 column, and max out safely so it doesn't span endlessly on ultra-wides
      setColumns(Math.max(1, Math.min(10, calculatedColumns)));
    };

    updateColumns();
    
    let animationFrameId: number;
    const handleResize = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(updateColumns);
    };

    window.addEventListener('resize', handleResize);
    
    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef?.current) {
      resizeObserver = new ResizeObserver(handleResize);
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [containerRef]);

  return columns;
}
