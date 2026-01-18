import type { Post } from './mockData';

type BadgeType = 'top-rated' | 'most-discussed' | null;

/**
 * Computes which badge (if any) a post should display.
 * 
 * Rules:
 * - Top Rated: Highest rated post per category in the last 30 days. One per category.
 * - Most Discussed: Highest review count per category in the last 7 days. One per category.
 * - If a post qualifies for both → Top Rated wins.
 * - Most Discussed goes to the runner-up if Top Rated is taken.
 */
export function computeBadges(posts: Post[]): Record<string, BadgeType> {
  const now = Date.now();
  const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;
  const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

  const badges: Record<string, BadgeType> = {};

  // Group posts by category
  const postsByCategory: Record<string, Post[]> = {};
  posts.forEach(post => {
    if (!postsByCategory[post.category]) {
      postsByCategory[post.category] = [];
    }
    postsByCategory[post.category].push(post);
  });

  // For each category, determine badges
  Object.entries(postsByCategory).forEach(([category, categoryPosts]) => {
    
    // Filter posts within 30-day window for Top Rated
    const postsLast30Days = categoryPosts.filter(p => {
      const createdTime = new Date(p.createdAt).getTime();
      return (now - createdTime) <= THIRTY_DAYS && !p.rating.isLocked && p.rating.average > 0;
    });

    // Filter posts within 7-day window for Most Discussed
    const postsLast7Days = categoryPosts.filter(p => {
      const createdTime = new Date(p.createdAt).getTime();
      return (now - createdTime) <= SEVEN_DAYS && !p.rating.isLocked && p.rating.reviewCount > 0;
    });

    // Find Top Rated (highest average rating in last 30 days)
    let topRatedPost: Post | null = null;
    if (postsLast30Days.length > 0) {
      topRatedPost = postsLast30Days.reduce((best, current) => 
        current.rating.average > best.rating.average ? current : best
      );
      badges[topRatedPost.id] = 'top-rated';
    }

    // Find Most Discussed (highest review count in last 7 days)
    // If the top reviewed post is already Top Rated, give Most Discussed to runner-up
    if (postsLast7Days.length > 0) {
      const sortedByReviews = [...postsLast7Days].sort((a, b) => 
        b.rating.reviewCount - a.rating.reviewCount
      );

      for (const post of sortedByReviews) {
        // Skip if this post already has Top Rated badge
        if (badges[post.id] === 'top-rated') {
          continue;
        }
        badges[post.id] = 'most-discussed';
        break; // Only one Most Discussed per category
      }
    }
  });

  return badges;
}

/**
 * Helper to get a single post's badge.
 * Call computeBadges once and use this to look up individual posts.
 */
export function getBadgeForPost(postId: string, badgeMap: Record<string, BadgeType>): BadgeType {
  return badgeMap[postId] || null;
}
