"use client";

import { useMemo, useRef } from 'react';
import { PostCard } from './PostCard';
import { useMasonryColumns } from '../hooks/useMasonryColumns';
import { useNavigationStore } from '../store/navigationStore';

interface MasonryGridProps {
  postIds: string[];
  isLoading?: boolean;
  maxColumns?: number;
}

export function MasonryGrid({ postIds, isLoading, maxColumns }: MasonryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const calculatedColumns = useMasonryColumns(containerRef);
  const columnCount = maxColumns ? Math.min(calculatedColumns, maxColumns) : calculatedColumns;

  // Distribute posts into columns
  const columns = useMemo(() => {
    const cols: string[][] = Array.from({ length: columnCount }, () => []);
    
    postIds.forEach((id, i) => {
      cols[i % columnCount].push(id);
    });

    if (isLoading) {
       // On initial load, show 8 skeletons. On load more, show 1 per column.
       const skeletonCount = postIds.length === 0 ? 8 : columnCount;
       const skeletons = Array.from({ length: skeletonCount }, (_, i) => `skeleton-${i}`);
       skeletons.forEach((id, i) => {
         cols[(postIds.length + i) % columnCount].push(id);
       });
    }

    return cols;
  }, [postIds, columnCount, isLoading]);

  return (
    <div ref={containerRef} className="w-full max-w-[2600px] mx-auto px-2 xs:px-2 md:px-4 pb-20 relative">
      <div className="flex gap-2 xs:gap-4 items-start justify-center text-left transition-opacity duration-300">
        {columns.map((colPostIds, colIndex) => (
          <div key={colIndex} className="flex-1 flex flex-col gap-2 xs:gap-4 w-full min-w-0">
            {colPostIds.map((id) => (
              <PostCard 
                key={id} 
                postId={id} 
                isLoading={id.startsWith('skeleton-')}
                onClick={() => {
                  if (!id.startsWith('skeleton-')) {
                    useNavigationStore.getState().setNavigationContext(postIds);
                  }
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
