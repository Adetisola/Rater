import { useMemo } from 'react';
import type { Post } from '../logic/mockData';
import { PostCard } from './PostCard';
import { useMasonryColumns } from '../hooks/useMasonryColumns';

type BadgeType = 'top-rated' | 'most-discussed' | null;

interface MasonryGridProps {
  posts: Post[];
  badgeMap: Record<string, BadgeType>;
  onPostClick?: (post: Post) => void;
}

export function MasonryGrid({ posts, badgeMap, onPostClick }: MasonryGridProps) {
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
    <div className="w-full max-w-[2600px] mx-auto px-6 pb-20">
      <div className="flex gap-4 items-start justify-center">
        {columns.map((colPosts, colIndex) => (
          <div key={colIndex} className="flex-1 flex flex-col gap-4 w-full min-w-0">
            {colPosts.map((post) => (
              <div key={post.id} onClick={() => onPostClick?.(post)}>
                <PostCard post={post} badge={badgeMap[post.id]} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
