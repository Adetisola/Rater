import { headers } from "next/headers";
import { getPost } from "@/lib/posts";
import { PostDetailContent } from "@/components/PostDetailContent";
import { notFound } from "next/navigation";
import type { Metadata, ResolvingMetadata } from "next";
import { extractPublicId } from "@/lib/cloudinary/transforms";
import Link from "next/link";

export const dynamic = 'force-dynamic';

function cleanAndTruncate(text: string, maxLen: number = 140): string {
  if (!text) return "";
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (cleaned.length <= maxLen) return cleaned;
  
  let truncated = cleaned.slice(0, maxLen);
  const lastSpace = truncated.lastIndexOf(" ");
  if (lastSpace > 0) {
    truncated = truncated.slice(0, lastSpace);
  }
  return truncated.trim() + "...";
}

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
  let ogWidth = post.media?.[0]?.width;
  let ogHeight = post.media?.[0]?.height;
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  
  if (rawPostImageUrl && cloudName) {
    const publicId = extractPublicId(rawPostImageUrl);
    if (publicId) {
      // WhatsApp requires <300KB, JPG. We use c_limit to preserve the exact original aspect ratio
      // while ensuring the resolution doesn't exceed 1200x1200.
      ogImageUrl = `https://res.cloudinary.com/${cloudName}/image/upload/c_limit,w_1200,h_1200,f_jpg,q_auto/${publicId}`;
      
      // Calculate scaled dimensions for accurate meta tags if original dimensions exist
      if (ogWidth && ogHeight) {
        const maxDimension = Math.max(ogWidth, ogHeight);
        if (maxDimension > 1200) {
          const scale = 1200 / maxDimension;
          ogWidth = Math.round(ogWidth * scale);
          ogHeight = Math.round(ogHeight * scale);
        }
      }
    }
  }

  const images = ogImageUrl
    ? [
        {
          url: ogImageUrl,
          ...(ogWidth ? { width: ogWidth } : {}),
          ...(ogHeight ? { height: ogHeight } : {}),
          alt: post.title,
        }
      ]
    : previousImages;

  // Formatting Title: {Post Title} • by @{username}
  const username = post.author?.username;
  const displayName = post.author?.name;
  let creator = "";
  if (username) {
    creator = `@${username}`;
  } else if (displayName) {
    creator = displayName;
  }
  const ogTitle = creator ? `${post.title} • by ${creator}` : post.title;

  // Formatting Description:
  let ogDescription = "";
  const cleanDesc = post.description ? post.description.replace(/\s+/g, ' ').trim() : "";

  if (cleanDesc) {
    // Case 1: Post has description
    const truncated = cleanAndTruncate(cleanDesc, 140);
    
    let suffixParts: string[] = [];
    if (post.category) {
      suffixParts.push(post.category);
    }
    
    const reviewCount = post.review_count || 0;
    const avgScore = post.average_score || 0;
    
    // rating is unlocked if review_count >= 3
    if (reviewCount >= 3 && avgScore > 0) {
      suffixParts.push(`★ ${avgScore.toFixed(1)}`);
      suffixParts.push(`${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}`);
    } else if (reviewCount > 0) {
      suffixParts.push(`${reviewCount} ${reviewCount === 1 ? 'review' : 'reviews'}`);
    } else if (creator) {
      suffixParts.push(`by ${creator}`);
    }
    
    const suffix = suffixParts.join(" • ");
    ogDescription = truncated ? `${truncated}\n\n${suffix}` : suffix;
  } else {
    // Case 2: Post has no description
    let parts: string[] = [];
    if (post.category) {
      parts.push(post.category);
    }
    if (creator) {
      parts.push(`by ${creator}`);
    }
    parts.push("View on Rater.");
    ogDescription = parts.join(" • ");
  }

  return {
    title: ogTitle,
    description: ogDescription,
    alternates: {
      canonical: `/post/${id}`,
    },
    openGraph: {
      title: ogTitle,
      description: ogDescription,
      url: `https://www.raterapp.site/post/${id}`,
      siteName: "Rater",
      images: images,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: ogDescription,
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
        <h2 className="text-xl font-medium text-black mb-2">This post is no longer available</h2>
        <p className="text-gray-500 max-w-md mx-auto mb-8">
          The author has removed this design or it is no longer visible.
        </p>
        <Link 
          href="/browse"
          className="inline-flex items-center justify-center rounded-full font-medium transition-all active:scale-95 bg-primary text-white hover:bg-[#E5B011] h-10 px-6 py-2 text-sm"
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
