import { useMemo } from 'react';
import type { Post } from '../logic/mockData';
import { PostCard } from './PostCard';
import { computeBadges } from '../logic/badgeUtils';

interface MasonryGridProps {
  posts: Post[];
  onPostClick?: (post: Post) => void;
}

export function MasonryGrid({ posts, onPostClick }: MasonryGridProps) {
  // Compute badges once for all posts
  const badgeMap = useMemo(() => computeBadges(posts), [posts]);

  return (
    <div className="w-full max-w-[1600px] mx-auto columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 pb-20 px-6">
      {posts.map((post) => (
        <div key={post.id} onClick={() => onPostClick?.(post)}>
            <PostCard post={post} badge={badgeMap[post.id]} />
        </div>
      ))}
    </div>
  );
}

