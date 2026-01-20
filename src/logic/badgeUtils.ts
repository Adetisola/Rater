import type { Post, Review } from './mockData';

type BadgeType = 'top-rated' | 'most-discussed' | null;

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
 * Check if a post is eligible for any badge.
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
  // Note: This checks the reviews array which may be a subset of all reviews
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
 * Comparator for Most Discussed badge selection.
 * Returns negative if `a` should rank higher, positive if `b` should rank higher.
 * 
 * Selection order:
 * 1. Highest review count in last 7 days
 * 2. Most recent review (tie-breaker 1)
 * 3. Older post (tie-breaker 2)
 */
function compareForMostDiscussed(a: Post, b: Post): number {
  // 1. Highest review count in last 7 days
  const aRecentCount = getReviewsInWindow(a.reviews).length;
  const bRecentCount = getReviewsInWindow(b.reviews).length;
  if (aRecentCount !== bRecentCount) {
    return bRecentCount - aRecentCount;
  }
  
  // 2. Most recent review wins
  const aRecentTime = getMostRecentReviewTime(a.reviews);
  const bRecentTime = getMostRecentReviewTime(b.reviews);
  if (aRecentTime !== bRecentTime) {
    return bRecentTime - aRecentTime;
  }
  
  // 3. Older post wins
  const aCreated = new Date(a.createdAt).getTime();
  const bCreated = new Date(b.createdAt).getTime();
  return aCreated - bCreated;
}

/**
 * Computes which badge (if any) each post should display.
 * 
 * Badge System Rules (Rater v1):
 * - Total badges: 2 (global, not per-category)
 * - Top Rated: 1 post with highest average rating
 * - Most Discussed: 1 post with highest review count in last 7 days
 * - No badge stacking: a post can only hold ONE badge
 * - If a post qualifies for both: Top Rated wins, Most Discussed goes to runner-up
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
  // Sort eligible posts by Top Rated criteria
  const sortedForTopRated = [...eligiblePosts].sort(compareForTopRated);
  const topRatedPost = sortedForTopRated[0];
  
  if (topRatedPost) {
    badges[topRatedPost.id] = 'top-rated';
  }
  
  // --- MOST DISCUSSED ---
  // Filter out the Top Rated winner (no badge stacking)
  const remainingForMostDiscussed = eligiblePosts.filter(p => p.id !== topRatedPost?.id);
  
  if (remainingForMostDiscussed.length > 0) {
    // Sort remaining posts by Most Discussed criteria
    const sortedForMostDiscussed = [...remainingForMostDiscussed].sort(compareForMostDiscussed);
    const mostDiscussedPost = sortedForMostDiscussed[0];
    
    if (mostDiscussedPost) {
      badges[mostDiscussedPost.id] = 'most-discussed';
    }
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
