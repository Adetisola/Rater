"use client";

import { useMemo } from 'react';
import type { Post } from '../logic/mockData';
import { PostCard } from './PostCard';
import { useMasonryColumns } from '../hooks/useMasonryColumns';

import type { BadgeType } from '../logic/badgeUtils';

interface MasonryGridProps {
  posts: Post[];
  badgeMap: Record<string, BadgeType>;
  hotPostIds: Set<string>;
  isLoading?: boolean;
}

export function MasonryGrid({ posts, badgeMap, hotPostIds, isLoading }: MasonryGridProps) {
  const columnCount = useMasonryColumns();

  // Distribute posts into columns
  const columns = useMemo(() => {
    const cols: Post[][] = Array.from({ length: columnCount }, () => []);
    posts.forEach((post, i) => {
      cols[i % columnCount].push(post);
    });
    return cols;
  }, [posts, columnCount]);

  return (
    <div className="w-full max-w-[2600px] mx-auto px-2 xs:px-2 md:px-4 pb-20 relative">
      {isLoading && (
        <div className="absolute top-0 left-0 right-0 z-50 flex justify-center pt-10 pointer-events-none">
          <div className="bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-[#FEC312] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-gray-500">Updating Feed...</span>
          </div>
        </div>
      )}
      
      <div className={`flex gap-2 xs:gap-4 items-start justify-center text-left transition-opacity duration-300 ${isLoading && posts.length === 0 ? 'opacity-0' : 'opacity-100'}`}>
        {columns.map((colPosts, colIndex) => (
          <div key={colIndex} className="flex-1 flex flex-col gap-2 xs:gap-4 w-full min-w-0">
            {colPosts.map((post) => (
              <PostCard 
                key={post.id} 
                post={post} 
                badge={badgeMap[post.id]} 
                isHot={hotPostIds.has(post.id)} 
              />
            ))}
          </div>
        ))}
      </div>
      
      {isLoading && posts.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center py-40">
           <div className="w-10 h-10 border-4 border-[#FEC312] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

