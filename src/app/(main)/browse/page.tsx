import { Suspense } from 'react';
import BrowseContent from '@/components/BrowseContent';
import { getFeedPosts } from '@/lib/posts';

export const dynamic = 'force-dynamic';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

export default async function BrowsePage(props: { searchParams: SearchParams }) {
  const searchParams = await props.searchParams;
  
  const q = typeof searchParams.q === 'string' ? searchParams.q : undefined;
  const sort = typeof searchParams.sort === 'string' ? searchParams.sort : 'balanced';
  
  let cat = searchParams.cat;
  if (typeof cat === 'string') cat = [cat];
  else if (!cat) cat = [];

  const avatar = typeof searchParams.avatar === 'string' ? searchParams.avatar : undefined;

  let initialPosts = [];

  if (q && q.trim().length >= 2) {
    const { searchPosts } = await import('@/lib/algolia/search');
    // On the server, we don't build the local Fuse.js index for fallback.
    // If Algolia fails here, it returns empty. The client will still have Fuse fallback.
    const results = await searchPosts({} as any, q, 100);
    initialPosts = results.map(r => r.post);
  } else {
    initialPosts = await getFeedPosts({
      limit: 13,
      categories: cat as string[],
      sortBy: sort as 'balanced' | 'highest_rated' | 'most_reviewed' | 'newest',
      avatarId: avatar
    });
  }
  
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <BrowseContent initialPosts={initialPosts} />
    </Suspense>
  );
}
