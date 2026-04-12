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
}

export function MasonryGrid({ posts, badgeMap, hotPostIds }: MasonryGridProps) {
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
    <div className="w-full max-w-[2600px] mx-auto px-2 xs:px-4 md:px-6 pb-20">
      <div className="flex gap-2 xs:gap-4 items-start justify-center text-left">
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
    </div>
  );
}

