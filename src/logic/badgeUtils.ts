import type { Post, Review } from './mockData';

type BadgeType = 'top-rated' | null;

// Constants
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_REVIEWS_FOR_BADGE = 5;

/**
 * Get reviews that occurred within the last 7 days.
 * Uses review timestamps, not post creation time.
 */
function getReviewsInWindow(reviews: Review[], windowMs: number = SEVEN_DAYS_MS): Review[] {
  const now = Date.now();
  return reviews.filter(review => {
    const reviewTime = new Date(review.createdAt).getTime();
    return (now - reviewTime) <= windowMs;
  });
}

/**
 * Get the most recent review timestamp from a list of reviews.
 * Returns 0 if no reviews exist.
 */
function getMostRecentReviewTime(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  return Math.max(...reviews.map(r => new Date(r.createdAt).getTime()));
}

/**
 * Check if a post is eligible for a badge.
 * 
 * Eligibility rules:
 * - Post must have ≥5 structured reviews (locked posts cannot win any badge)
 * - Post must have at least one review within the last 7 days
 */
function isEligibleForBadge(post: Post): boolean {
  // Must have at least 5 reviews total (use reviewCount from rating object)
  if (post.rating.reviewCount < MIN_REVIEWS_FOR_BADGE) {
    return false;
  }
  
  // Rating must be unlocked
  if (post.rating.isLocked) {
    return false;
  }
  
  // Must have at least one review within the last 7 days
  const recentReviews = getReviewsInWindow(post.reviews);
  if (recentReviews.length === 0) {
    return false;
  }
  
  return true;
}

/**
 * Comparator for Top Rated badge selection.
 * Returns negative if `a` should rank higher, positive if `b` should rank higher.
 * 
 * Selection order:
 * 1. Higher average rating
 * 2. Higher review count (tie-breaker 1)
 * 3. Most recent review activity (tie-breaker 2)
 * 4. Older post (tie-breaker 3)
 */
function compareForTopRated(a: Post, b: Post): number {
  // 1. Higher average rating wins
  if (a.rating.average !== b.rating.average) {
    return b.rating.average - a.rating.average;
  }
  
  // 2. Higher review count wins
  if (a.rating.reviewCount !== b.rating.reviewCount) {
    return b.rating.reviewCount - a.rating.reviewCount;
  }
  
  // 3. Most recent review activity wins
  const aRecentTime = getMostRecentReviewTime(a.reviews);
  const bRecentTime = getMostRecentReviewTime(b.reviews);
  if (aRecentTime !== bRecentTime) {
    return bRecentTime - aRecentTime; // Higher (more recent) time wins
  }
  
  // 4. Older post wins (earlier createdAt)
  const aCreated = new Date(a.createdAt).getTime();
  const bCreated = new Date(b.createdAt).getTime();
  return aCreated - bCreated; // Lower (older) time wins
}

/**
 * Computes which badge (if any) each post should display.
 * 
 * Badge System Rules (Rater v1):
 * - Total badges: 1 (global, not per-category)
 * - Top Rated: 1 post with highest average rating
 * - "Most Discussed" is NOT a badge — it's shown as lightweight review count metadata
 * 
 * Eligibility:
 * - Post must have ≥5 structured reviews
 * - Post must have reviews within the last 7 days
 * - Rating must be unlocked
 */
export function computeBadges(posts: Post[]): Record<string, BadgeType> {
  const badges: Record<string, BadgeType> = {};
  
  // Filter to only eligible posts
  const eligiblePosts = posts.filter(isEligibleForBadge);
  
  if (eligiblePosts.length === 0) {
    return badges;
  }
  
  // --- TOP RATED ---
  const sortedForTopRated = [...eligiblePosts].sort(compareForTopRated);
  const topRatedPost = sortedForTopRated[0];
  
  if (topRatedPost) {
    badges[topRatedPost.id] = 'top-rated';
  }
  
  return badges;
}

/**
 * Helper to get a single post's badge.
 * Call computeBadges once and use this to look up individual posts.
 */
export function getBadgeForPost(postId: string, badgeMap: Record<string, BadgeType>): BadgeType {
  return badgeMap[postId] || null;
}
