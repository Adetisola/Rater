import type { Post, Review, BadgeType } from './mockData';
export type { BadgeType };
import { MOCK_AVATARS, getReviewsByPostId, calculatePostMetrics, MOCK_BADGES } from './mockData';

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
  const created = new Date(post.created_at).getTime();
  return (now - created) <= SEVEN_DAYS_MS;
}

/**
 * Returns true if the post's avatar is NOT blocked.
 */
function isAvatarNotBlocked(post: Post): boolean {
  const avatar = MOCK_AVATARS[post.avatar_id];
  if (!avatar) return true;
  return !avatar.is_blocked;
}

// ─── Eligibility ──────────────────────────────────────────────────────────────

/**
 * A post is eligible for Top Rated if ALL of the following are true:
 * 1. Rating is unlocked (review_count >= 3)
 * 2. review_count >= 5
 * 3. Post was created within the last 7 days
 * 4. All reviews have valid ratings
 * 5. Avatar is not blocked
 */
async function isEligibleForBadge(post: Post): Promise<boolean> {
  const metrics = await calculatePostMetrics(post.id);
  
  if (!metrics.rating_unlocked) return false;
  if (metrics.review_count < MIN_REVIEWS_FOR_BADGE) return false;
  if (!isPostWithinWindow(post)) return false;
  
  const reviews = await getReviewsByPostId(post.id);
  if (!hasAllStructuredReviews(reviews)) return false;
  
  if (!isAvatarNotBlocked(post)) return false;
  return true;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Computes active Top Rated badges.
 */
export async function computeBadges(posts: Post[]): Promise<Record<string, BadgeType>> {
  const finalBadges: Record<string, BadgeType> = {};

  // 1. Identify current ranking-based Top 3
  // Since we need to wait for each eligibility check, we use Promise.all
  const eligibilityResults = await Promise.all(posts.map(post => isEligibleForBadge(post)));
  const eligiblePosts = posts.filter((_, index) => eligibilityResults[index]);

  if (eligiblePosts.length > 0) {
    // Rank them (async sort is tricky, so we compute all metrics first)
    // For simplicity in mock, we sort them by resolution
    // Note: In production, this would be a single SQL query: 
    // SELECT * FROM posts ORDER BY average_rating DESC, review_count DESC LIMIT 3
    
    // 2. Rank them
    // Pre-calculate metrics for all eligible posts to avoid async sorting hell
    const metricsMap = await Promise.all(eligiblePosts.map(async p => ({
        id: p.id,
        m: await calculatePostMetrics(p.id)
    })));

    const ranked = [...eligiblePosts].sort((a, b) => {
        const mA = metricsMap.find(m => m.id === a.id)!.m;
        const mB = metricsMap.find(m => m.id === b.id)!.m;

        if (mB.average_score !== mA.average_score) return mB.average_score - mA.average_score;
        if (mB.review_count !== mA.review_count) return mB.review_count - mA.review_count;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    const currentTopNIds = new Set(
        ranked.slice(0, MAX_TOP_RATED_BADGES).map(p => p.id)
    );

    // 2. Process historical badges from the store
    MOCK_BADGES.forEach(record => {
        const isStillActive = currentTopNIds.has(record.post_id);
        
        if (record.badge_type === 'top_rated_active' && !isStillActive) {
        finalBadges[record.post_id] = 'top_rated_previous';
        } else {
        finalBadges[record.post_id] = record.badge_type;
        }
    });

    // 3. Apply active badges to current winners
    currentTopNIds.forEach(id => {
        finalBadges[id] = 'top_rated_active';
    });
  } else {
    // If no one is eligible today, historical active badges still transition to previous
    MOCK_BADGES.forEach(record => {
        if (record.badge_type === 'top_rated_active') {
             finalBadges[record.post_id] = 'top_rated_previous';
        } else {
             finalBadges[record.post_id] = record.badge_type;
        }
    });
  }

  return finalBadges;
}

export function getBadgeForPost(postId: string, badgeMap: Record<string, BadgeType>): BadgeType {
  return badgeMap[postId] || null;
}


