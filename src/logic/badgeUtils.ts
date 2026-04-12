import type { Post, Review } from './mockData';
import { MOCK_AVATARS, getReviewsByPostId, calculatePostMetrics } from './mockData';

export type BadgeType = 'top_rated_active' | 'top_rated_previous' | null;

// ─── Constants ────────────────────────────────────────────────────────────────
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_REVIEWS_FOR_BADGE = 5;
const MAX_TOP_RATED_BADGES = 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true if every review in the list has valid structured rating fields.
 */
function hasAllStructuredReviews(reviews: Review[]): boolean {
  return reviews.every(review => {
    const { clarity, purpose, aesthetics } = review;
    const isValid = (n: number) => typeof n === 'number' && n >= 1 && n <= 5;
    return isValid(clarity) && isValid(purpose) && isValid(aesthetics);
  });
}

/**
 * Returns true if the post was created within the last 7 days.
 */
function isPostWithinWindow(post: Post): boolean {
  const now = Date.now();
  const created = new Date(post.createdAt).getTime();
  return (now - created) <= SEVEN_DAYS_MS;
}

/**
 * Returns true if the post's avatar is NOT blocked.
 */
function isAvatarNotBlocked(post: Post): boolean {
  const avatar = MOCK_AVATARS[post.avatarId];
  if (!avatar) return true;
  return !avatar.isBlocked;
}

// ─── Eligibility ──────────────────────────────────────────────────────────────

/**
 * A post is eligible for Top Rated if ALL of the following are true:
 * 1. Rating is unlocked (reviewCount >= 3) - but for Top Rated we enforce MIN_REVIEWS_FOR_BADGE (5)
 * 2. reviewCount >= 5
 * 3. Post was created within the last 7 days
 * 4. All reviews have valid ratings
 * 5. Avatar is not blocked
 */
function isEligibleForBadge(post: Post): boolean {
  const metrics = calculatePostMetrics(post.id);
  
  if (!metrics.ratingUnlocked) return false;
  if (metrics.reviewCount < MIN_REVIEWS_FOR_BADGE) return false;
  if (!isPostWithinWindow(post)) return false;
  
  const reviews = getReviewsByPostId(post.id);
  if (!hasAllStructuredReviews(reviews)) return false;
  
  if (!isAvatarNotBlocked(post)) return false;
  return true;
}

// ─── Ranking ──────────────────────────────────────────────────────────────────

function compareForTopRated(a: Post, b: Post): number {
  const metricsA = calculatePostMetrics(a.id);
  const metricsB = calculatePostMetrics(b.id);

  // 1. Higher average rating wins
  if (metricsB.averageScore !== metricsA.averageScore) {
    return metricsB.averageScore - metricsA.averageScore;
  }

  // 2. Higher review count wins
  if (metricsB.reviewCount !== metricsA.reviewCount) {
    return metricsB.reviewCount - metricsA.reviewCount;
  }

  // 3. More recently created wins
  const aCreated = new Date(a.createdAt).getTime();
  const bCreated = new Date(b.createdAt).getTime();
  return bCreated - aCreated;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Computes active Top Rated badges.
 */
export function computeBadges(posts: Post[]): Record<string, BadgeType> {
  const badges: Record<string, BadgeType> = {};

  const eligiblePosts = posts.filter(isEligibleForBadge);
  if (eligiblePosts.length === 0) return badges;

  const ranked = [...eligiblePosts].sort(compareForTopRated);
  const topN = ranked.slice(0, MAX_TOP_RATED_BADGES);
  
  for (const post of topN) {
    badges[post.id] = 'top_rated_active';
  }

  return badges;
}

export function getBadgeForPost(postId: string, badgeMap: Record<string, BadgeType>): BadgeType {
  return badgeMap[postId] || null;
}


