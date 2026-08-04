import { headers } from "next/headers";
import { getPost } from "@/lib/posts";
import { PostDetailContent } from "@/components/PostDetailContent";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata, ResolvingMetadata } from "next";
import { extractPublicId } from "@/lib/cloudinary/transforms";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  const previousImages = (await parent).openGraph?.images || [];
  const rawPostImageUrl = post.media?.[0]?.url || post.image_url;
  
  let ogImageUrl = rawPostImageUrl;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  if (rawPostImageUrl && cloudName) {
    const publicId = extractPublicId(rawPostImageUrl);
    if (publicId) {
      // WhatsApp requires <300KB, JPG, preferably 1200x630.
      // We use c_pad to ensure the design isn't cut off.
      ogImageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/c_pad,w_1200,h_630,f_jpg,q_auto/${publicId}`;
    }
  }

  const images = ogImageUrl
    ? [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: post.title,
        }
      ]
    : previousImages;

  return {
    title: `${post.title} — Rater`,
    description: post.description || `View ${post.title} on Rater`,
    openGraph: {
      title: post.title,
      description: post.description,
      images: images,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: ogImageUrl ? [ogImageUrl] : undefined,
    },
  };
}

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

  const headersList = await headers();
  const userAgent = headersList.get('user-agent') || '';
  const isMobile = /mobile|android|iphone|ipad|phone/i.test(userAgent);

  // 4. Render the client-side interactive content, passing the server-fetched post
  return (
    <main className="flex-1 w-full relative">
      <PostDetailContent key={post.id} post={post} initialIsMobile={isMobile} />
    </main>
  );
}
