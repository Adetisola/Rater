"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { MOCK_POSTS } from "@/logic/mockData";
import { PostDetailContent } from "@/components/PostDetailContent";

export default function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const resolvedParams = use(params);
  const post = MOCK_POSTS.find((p) => p.id === resolvedParams.id);

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col">
        <h1 className="text-2xl font-bold mb-4">Post not found</h1>
        <button 
          onClick={() => router.push("/app/browse")}
          className="px-6 py-2 bg-black text-white rounded-full font-semibold"
        >
          Back to Browse
        </button>
      </div>
    );
  }

  return (
    <main className="flex-1 w-full relative">
      <PostDetailContent 
          post={post} 
          onClose={() => router.back()} 
      />
    </main>
  );
}
