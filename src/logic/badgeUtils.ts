import type { Post, Review, BadgeType } from '../types';
export type { BadgeType };
import { getReviewsByPostId } from '@/lib/reviews';
import { getReviewMode } from '../config/reviewModes';
import { MAX_TOP_RATED_BADGES, MIN_REVIEWS_FOR_BADGE, BADGE_WINDOW_DAYS } from '@/constants/badges';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const BADGE_WINDOW_MS = BADGE_WINDOW_DAYS * 24 * 60 * 60 * 1000;

/**
 * Returns true if every review has valid structured rating fields for its category.
 */
function hasAllStructuredReviews(post: Post, reviews: Review[]): boolean {
  const modeConfig = getReviewMode(post.category);
  return reviews.every(review => {
    const hasCurrentMode = modeConfig.criteria.every(c => {
      const val = review.ratings?.[c.dbKey];
      return typeof val === 'number' && val >= 1 && val <= 5;
    });

    if (hasCurrentMode) return true;

    // Fallback for legacy mock data that universally uses clarity, purpose, aesthetics
    return ['clarity', 'purpose', 'aesthetics'].every(key => {
      const val = review.ratings?.[key];
      return typeof val === 'number' && val >= 1 && val <= 5;
    });
  });
}

/**
 * Returns true if the post was created within the badge eligibility window.
 */
function isPostWithinWindow(post: Post): boolean {
  return Date.now() - new Date(post.created_at).getTime() <= BADGE_WINDOW_MS;
}

// ─── Eligibility ──────────────────────────────────────────────────────────────

/**
 * A post is eligible for Top Rated if ALL of the following are true:
 * 1. Rating is unlocked (review_count >= 3)
 * 2. review_count >= MIN_REVIEWS_FOR_BADGE
 * 3. Post was created within the badge window
 * 4. All reviews have valid structured ratings
 *
 * NOTE: Blocked avatar enforcement removed from client-side badge logic.
 * TODO(supabase): enforce via RLS policy — blocked avatars' posts will be
 * excluded from queries before they reach this function.
 */
async function isEligibleForBadge(post: Post): Promise<boolean> {
  const isUnlocked = (post.review_count || 0) >= 3;
  if (!isUnlocked) return false;
  if ((post.review_count || 0) < MIN_REVIEWS_FOR_BADGE) return false;
  if (!isPostWithinWindow(post)) return false;

  const reviews = await getReviewsByPostId(post.id);
  if (!hasAllStructuredReviews(post, reviews)) return false;

  return true;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Computes active Top Rated badges for a set of posts.
 * Returns a Record<postId, BadgeType> for the top eligible posts.
 *
 * TODO(milestone-7): replace with supabase.from('badges').select().in('post_id', ids)
 */
export async function computeBadges(posts: Post[]): Promise<Record<string, BadgeType>> {
  const finalBadges: Record<string, BadgeType> = {};

  const eligibilityResults = await Promise.all(posts.map(post => isEligibleForBadge(post)));
  const eligiblePosts = posts.filter((_, i) => eligibilityResults[i]);

  if (eligiblePosts.length === 0) return finalBadges;

  const ranked = [...eligiblePosts].sort((a, b) => {
    const mA_score = a.average_score || 0;
    const mB_score = b.average_score || 0;
    const mA_count = a.review_count || 0;
    const mB_count = b.review_count || 0;
    if (mB_score !== mA_score) return mB_score - mA_score;
    if (mB_count !== mA_count) return mB_count - mA_count;
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  ranked.slice(0, MAX_TOP_RATED_BADGES).forEach(p => {
    finalBadges[p.id] = 'top_rated_active';
  });

  return finalBadges;
}

export function getBadgeForPost(postId: string, badgeMap: Record<string, BadgeType>): BadgeType {
  return badgeMap[postId] || null;
}
