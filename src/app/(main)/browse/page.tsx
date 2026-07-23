import { Suspense } from 'react';
import BrowseContent from '@/components/BrowseContent';
import { getFeedPosts } from '@/lib/posts';

export const dynamic = 'force-dynamic';

export default async function BrowsePage() {
  const initialPosts = await getFeedPosts({ limit: 13 });
  
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <BrowseContent initialPosts={initialPosts} />
    </Suspense>
  );
}
