import type { Post, Review, BadgeType } from '../types';
export type { BadgeType };
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
 * Returns true if the post meets initial criteria for a badge without checking reviews.
 */
function meetsInitialBadgeCriteria(post: Post): boolean {
  const isUnlocked = (post.review_count || 0) >= 3;
  if (!isUnlocked) return false;
  if ((post.review_count || 0) < MIN_REVIEWS_FOR_BADGE) return false;
  if (!isPostWithinWindow(post)) return false;
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

  const candidatePosts = posts.filter(meetsInitialBadgeCriteria);
  if (candidatePosts.length === 0) return finalBadges;

  // Batch fetch reviews for all candidate posts
  const postIds = candidatePosts.map(p => p.id);
  
  // Dynamic import or utilize a client reference to avoid cyclic deps if necessary
  const { supabase } = await import('@/lib/supabase/client');
  // Select the actual flat columns from the DB (the 'ratings' field is a synthetic
  // mapping done in reviews.ts — it does not exist as a DB column)
  const RATING_COLS = 'post_id, aesthetics, clarity, purpose, usability, recognition, impact, engagement, composition, detail';
  const { data: reviewsData, error } = await supabase
    .from('reviews')
    .select(RATING_COLS)
    .in('post_id', postIds);

  if (error) {
    console.error('Error fetching reviews for badges', error);
    return finalBadges;
  }

  // Rebuild the ratings map the same way reviews.ts does
  const ALLOWED_RATINGS = ['aesthetics', 'clarity', 'purpose', 'usability', 'recognition', 'impact', 'engagement', 'composition', 'detail'];
  // Group reviews by post_id, building synthetic Review objects
  const reviewsByPostId: Record<string, any[]> = {};
  reviewsData?.forEach((row: any) => {
    const ratings: Record<string, number> = {};
    ALLOWED_RATINGS.forEach(key => {
      if (row[key] !== null && row[key] !== undefined) {
        ratings[key] = row[key];
      }
    });
    const review = { post_id: row.post_id, ratings };
    if (!reviewsByPostId[row.post_id]) reviewsByPostId[row.post_id] = [];
    reviewsByPostId[row.post_id].push(review);
  });

  const eligiblePosts = candidatePosts.filter(post => {
    const reviewsForPost = (reviewsByPostId[post.id] || []) as Review[];
    return hasAllStructuredReviews(post, reviewsForPost);
  });

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
