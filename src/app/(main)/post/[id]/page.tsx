import { getPost } from "@/lib/posts";
import { PostDetailContent } from "@/components/PostDetailContent";
import { notFound } from "next/navigation";
import Link from "next/link";

export default async function PostDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  // 1. Fetch post on the server
  const post = await getPost(id);

  // 2. If it doesn't exist at all, generic 404
  if (!post) {
    notFound();
  }

  // 3. If it's deleted, show the custom deleted UI (matching previous client-side UX)
  if (post.is_deleted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <h2 className="text-2xl font-bold text-black mb-2">This post is no longer available</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-8">
          The author has removed this design or it is no longer visible.
        </p>
        <Link 
          href="/browse"
          className="px-8 py-3 bg-primary text-black font-bold rounded-full hover:bg-[#FFD342] transition-all inline-block"
        >
          Go Back
        </Link>
      </div>
    );
  }

  // 4. Render the client-side interactive content, passing the server-fetched post
  return (
    <main className="flex-1 w-full relative">
      <PostDetailContent key={post.id} post={post} />
    </main>
  );
}
