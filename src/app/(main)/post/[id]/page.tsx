"use client";

import { usePosts } from "@/context/PostContext";
import { PostDetailContent } from "@/components/PostDetailContent";
import { notFound, useParams } from "next/navigation";

export default function PostDetailPage() {
  const { id } = useParams() as { id: string };
  const { allPosts, isLoading } = usePosts();
  
  const post = allPosts.find((p) => p.id === id);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-[#FEC312] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!post) {
    notFound();
  }

  if (post.is_deleted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <h2 className="text-2xl font-bold text-black mb-2">This post is no longer available</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-8">
          The author has removed this design or it is no longer visible.
        </p>
        <button 
          onClick={() => window.history.back()}
          className="px-8 py-3 bg-[#FEC312] text-black font-bold rounded-full hover:bg-[#FFD342] transition-all"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <main className="flex-1 w-full relative">
      <PostDetailContent key={post.id} post={post} />
    </main>
  );
}
