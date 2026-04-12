import { type Post, calculatePostMetrics } from './mockData';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_REVIEW_COUNT = 3;

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
export function computeHotPosts(posts: Post[]): Set<string> {
  const now = Date.now();

  // Map posts to their metrics
  const postsWithMetrics = posts.map(post => ({
    post,
    metrics: calculatePostMetrics(post.id)
  }));

  // 1. Filter to posts from the last 7 days with ≥3 reviews
  const recentEligible = postsWithMetrics.filter(({ post, metrics }) => {
    const postAge = now - new Date(post.createdAt).getTime();
    return postAge <= SEVEN_DAYS_MS && metrics.reviewCount >= MIN_REVIEW_COUNT;
  });

  if (recentEligible.length === 0) {
    return new Set();
  }

  // 2. Sort by review_count DESC
  const sorted = [...recentEligible].sort(
    (a, b) => b.metrics.reviewCount - a.metrics.reviewCount
  );

  // 3. Top 10% threshold (at least 1 post)
  const top10Count = Math.max(1, Math.ceil(sorted.length * 0.1));

  // 4. Mark the top slice as hot
  const hotSet = new Set<string>();
  for (let i = 0; i < top10Count; i++) {
    hotSet.add(sorted[i].post.id);
  }

  return hotSet;
}
