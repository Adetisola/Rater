import { useState, useEffect } from 'react';

export function useMasonryColumns() {
  const [columns, setColumns] = useState(1);

  useEffect(() => {
    const updateColumns = () => {
      const width = window.innerWidth;
      if (width >= 2400) {
        setColumns(6);
      } else if (width >= 1800) {
        setColumns(5);
      } else if (width >= 1280) {
        setColumns(4); // xl
      } else if (width >= 1024) {
        setColumns(3); // lg
      } else if (width >= 768) {
        setColumns(2); // tablet portrait
      } else {
        setColumns(1); // mobile
      }
    };

    updateColumns();
    window.addEventListener('resize', updateColumns);
    return () => window.removeEventListener('resize', updateColumns);
  }, []);

  return columns;
}
