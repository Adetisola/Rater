import type { Post } from '../types';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_REVIEW_COUNT = 5;

/**
 * Computes which posts qualify for the 🔥 (hot) indicator.
 *
 * Logic:
 * 1. Only consider posts created within the last 7 days
 * 2. Only consider posts with review_count ≥ 3
 * 3. From that pool, mark the top 10% (by review_count DESC) as hot
 *
 * This is NOT a badge. It is purely informational metadata.
 *
 * @returns A Set of post IDs that should display the 🔥 indicator
 */
export async function computeHotPosts(posts: Post[]): Promise<Set<string>> {
  const now = Date.now();

  // 1. Filter to posts from the last 7 days with ≥3 reviews
  const recentEligible = posts.filter(post => {
    const postAge = now - new Date(post.created_at).getTime();
    return postAge <= SEVEN_DAYS_MS && (post.review_count || 0) >= MIN_REVIEW_COUNT;
  });

  if (recentEligible.length === 0) {
    return new Set();
  }

  // 2. Sort by review_count DESC
  const sorted = [...recentEligible].sort(
    (a, b) => (b.review_count || 0) - (a.review_count || 0)
  );

  // 3. Top 10% threshold (at least 1 post)
  const top10Count = Math.max(1, Math.ceil(sorted.length * 0.1));

  // 4. Mark the top slice as hot
  const hotSet = new Set<string>();
  for (let i = 0; i < top10Count; i++) {
    hotSet.add(sorted[i].id);
  }

  return hotSet;
}
