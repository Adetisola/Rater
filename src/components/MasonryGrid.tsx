import { useMemo } from 'react';
import type { Post } from '../logic/mockData';
import { PostCard } from './PostCard';
import { computeBadges } from '../logic/badgeUtils';
import { useMasonryColumns } from '../hooks/useMasonryColumns';

interface MasonryGridProps {
  posts: Post[];
  onPostClick?: (post: Post) => void;
}

export function MasonryGrid({ posts, onPostClick }: MasonryGridProps) {
  const columnCount = useMasonryColumns();
  const badgeMap = useMemo(() => computeBadges(posts), [posts]);

  // Distribute posts into columns
  const columns = useMemo(() => {
    const cols: Post[][] = Array.from({ length: columnCount }, () => []);
    posts.forEach((post, i) => {
      cols[i % columnCount].push(post);
    });
    return cols;
  }, [posts, columnCount]);

  return (
    <div className="w-full max-w-[1600px] mx-auto px-6 pb-20">
      <div className="flex gap-6 items-start justify-center">
        {columns.map((colPosts, colIndex) => (
          <div key={colIndex} className="flex-1 flex flex-col gap-6 w-full min-w-0">
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

