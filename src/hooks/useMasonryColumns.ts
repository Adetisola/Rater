import { useState, useEffect } from 'react';

// The minimum ideal width a column should be before the grid considers adding a new one.
// Decreasing this fits MORE columns on smaller screens, increasing it creates WIDER cards.
const MIN_COLUMN_WIDTH = 260;
const GAP = 16; // 1rem (gap-4 equivalent)

export function useMasonryColumns() {
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const updateColumns = () => {
      // Get the width of the main viewport (excluding scrollbars)
      const width = document.documentElement.clientWidth;
      
      // Estimate the available container width by subtracting side padding 
      // Accounts for Tailwind classes px-4 (32px total) on mobile, px-6 (48px total) on desktop
      const padding = width >= 768 ? 48 : 32;
      const availableWidth = width - padding;
      
      // Calculate how many times a 'minimum sized column + gap' fits into the available space
      const calculatedColumns = Math.floor((availableWidth + GAP) / (MIN_COLUMN_WIDTH + GAP));
      
      // Enforce at least 1 column, and max out safely so it doesn't span endlessly on ultra-wides
      // Usually around 8 or 10 is a good maximal cap for ~4K screens
      setColumns(Math.max(1, Math.min(10, calculatedColumns)));
    };

    // Run initially
    updateColumns();
    
    // Use an animation frame to avoid rapid thrashing on resize
    let timeoutId: number;
    const handleResize = () => {
      cancelAnimationFrame(timeoutId);
      timeoutId = requestAnimationFrame(updateColumns);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(timeoutId);
    };
  }, []);

  return columns;
}
