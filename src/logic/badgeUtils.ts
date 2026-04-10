import type { Post, Review } from './mockData';
import { MOCK_AVATARS } from './mockData';

type BadgeType = 'top-rated' | null;

// ─── Constants ────────────────────────────────────────────────────────────────
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const MIN_REVIEWS_FOR_BADGE = 5;
const MAX_TOP_RATED_BADGES = 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Returns true if every review in the list has valid structured rating fields.
 * Fields required: clarity (visual_clarity), purpose (purpose_effectiveness),
 * aesthetics (aesthetic_quality) — all must be numbers between 1 and 5.
 */
function hasAllStructuredReviews(reviews: Review[]): boolean {
  return reviews.every(review => {
    const { clarity, purpose, aesthetics } = review.ratings;
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
 * Returns true if the post's designer is NOT blocked.
 */
function isDesignerNotBlocked(post: Post): boolean {
  const avatar = MOCK_AVATARS[post.designerId];
  // If the avatar doesn't exist in MOCK_AVATARS, treat as safe.
  if (!avatar) return true;
  return !avatar.isBlocked;
}

// ─── Eligibility ──────────────────────────────────────────────────────────────

/**
 * A post is eligible for Top Rated if ALL of the following are true:
 *
 * 1. Rating is unlocked (isLocked === false)
 * 2. review_count >= 5
 * 3. Post was created within the last 7 days
 * 4. All reviews have valid structured rating fields
 * 5. The post's designer is not blocked
 */
function isEligibleForBadge(post: Post): boolean {
  if (post.rating.isLocked) return false;
  if (post.rating.reviewCount < MIN_REVIEWS_FOR_BADGE) return false;
  if (!isPostWithinWindow(post)) return false;
  if (!hasAllStructuredReviews(post.reviews)) return false;
  if (!isDesignerNotBlocked(post)) return false;
  return true;
}

// ─── Ranking ──────────────────────────────────────────────────────────────────

/**
 * Comparator for Top Rated badge selection.
 *
 * Ranking priority:
 * 1. overall_score (rating.average) DESC
 * 2. review_count DESC
 * 3. created_at DESC (most recently created wins ties)
 */
function compareForTopRated(a: Post, b: Post): number {
  // 1. Higher average rating wins
  if (b.rating.average !== a.rating.average) {
    return b.rating.average - a.rating.average;
  }

  // 2. Higher review count wins
  if (b.rating.reviewCount !== a.rating.reviewCount) {
    return b.rating.reviewCount - a.rating.reviewCount;
  }

  // 3. More recently created wins
  const aCreated = new Date(a.createdAt).getTime();
  const bCreated = new Date(b.createdAt).getTime();
  return bCreated - aCreated;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Computes the Top Rated badge map for a list of posts.
 *
 * Rules:
 * - Only eligible posts (see isEligibleForBadge) are considered.
 * - Top 3 posts by ranking receive the 'top-rated' badge.
 * - If fewer than 3 qualify, only those that qualify receive the badge.
 * - Requirements are NEVER lowered to fill the quota.
 * - Badge is NOT permanent — recalculate on every render cycle.
 */
export function computeBadges(posts: Post[]): Record<string, BadgeType> {
  const badges: Record<string, BadgeType> = {};

  // 1. Filter to eligible posts only
  const eligiblePosts = posts.filter(isEligibleForBadge);

  if (eligiblePosts.length === 0) return badges;

  // 2. Sort by ranking criteria
  const ranked = [...eligiblePosts].sort(compareForTopRated);

  // 3. Assign badge to top N (strict limit, no padding)
  const topN = ranked.slice(0, MAX_TOP_RATED_BADGES);
  for (const post of topN) {
    badges[post.id] = 'top-rated';
  }

  return badges;
}

/**
 * Helper to look up a single post's badge from a pre-computed badge map.
 * Always call computeBadges once per render and reuse the result.
 */
export function getBadgeForPost(postId: string, badgeMap: Record<string, BadgeType>): BadgeType {
  return badgeMap[postId] || null;
}

/**
 * RECALCULATION LOGIC (Simulated Hourly Job)
 * 
 * Rules for each cycle:
 * 1. Fetch posts from last 7 days
 * 2. Filter: unlocked, review_count >= 5, non-blocked
 * 3. Rank: score DESC, review_count DESC, created DESC
 * 4. Select top 3
 * 5. Update states: active Top Rated to top 3, preserve "Previously Top Rated"
 */
export function runHourlyRecalculation(posts: Post[]) {
    // 1. Get current winners
    const badgeMap = computeBadges(posts);
    
    // 2. Persist the state: If it's Top Rated NOW, it's permanently "wasTopRated" too
    posts.forEach(post => {
        if (badgeMap[post.id] === 'top-rated') {
            post.wasTopRated = true;
        }
    });

    console.log('Hourly Top Rated recalculation complete. Top 3 badges assigned.');
}


