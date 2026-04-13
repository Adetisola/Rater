import { MOCK_POSTS } from "@/logic/mockData";
import { PostDetailContent } from "@/components/PostDetailContent";
import { notFound } from "next/navigation";

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const post = MOCK_POSTS.find((p) => p.id === id);

  if (!post) {
    notFound();
  }

  return (
    <main className="flex-1 w-full relative">
      <PostDetailContent post={post} />
    </main>
  );
}
