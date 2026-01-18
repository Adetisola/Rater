/**
 * Curated Freshness V1 — Default Homepage Sorting Algorithm
 * 
 * Buckets:
 * - Bucket A (Standout): Posts with badges. Rate-limited to 1 per 6-8 cards.
 * - Bucket B (Active & Emerging): Posts from the last 14-21 days.
 * - Bucket C (Older Archive): All other posts.
 * 
 * Ordering:
 * - Bucket A: Badge priority (Top Rated > Most Discussed), then recency.
 * - Bucket B: Recency with light engagement signal (review count).
 * - Bucket C: Recency only.
 */

import type { Post } from './mockData';
import { computeBadges } from './badgeUtils';

const BUCKET_B_WINDOW_DAYS = 17; // Middle of 14-21 range
const STANDOUT_SPACING = 7;      // Middle of 6-8 range

/**
 * Seeded random for gentle, stable variation.
 * Uses the day as seed so shuffles are consistent within a day but vary daily.
 */
function seededRandom(seed: number): () => number {
  return function() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

/**
 * Group posts by day (YYYY-MM-DD) and shuffle within each day group.
 */
function shuffleWithinDays<T extends { createdAt: string }>(posts: T[], seed: number): T[] {
  const random = seededRandom(seed);
  
  // Group by day
  const dayGroups: Record<string, T[]> = {};
  posts.forEach(post => {
    const day = post.createdAt.split('T')[0];
    if (!dayGroups[day]) dayGroups[day] = [];
    dayGroups[day].push(post);
  });

  // Shuffle within each day group
  Object.values(dayGroups).forEach(group => {
    for (let i = group.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [group[i], group[j]] = [group[j], group[i]];
    }
  });

  // Reconstruct: sort days (newest first), then flatten
  const sortedDays = Object.keys(dayGroups).sort((a, b) => b.localeCompare(a));
  return sortedDays.flatMap(day => dayGroups[day]);
}

/**
 * Curated Freshness Sort
 * Returns posts sorted according to the Curated Freshness V1 algorithm.
 */
export function curatedFreshnessSort(posts: Post[]): Post[] {
  const now = Date.now();
  const BUCKET_B_MS = BUCKET_B_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  // Compute badges for all posts
  const badgeMap = computeBadges(posts);

  // Categorize into buckets
  const bucketA: Post[] = []; // Standout (badge posts)
  const bucketB: Post[] = []; // Active & Emerging (recent)
  const bucketC: Post[] = []; // Older Archive

  posts.forEach(post => {
    const badge = badgeMap[post.id];
    const postAge = now - new Date(post.createdAt).getTime();

    if (badge) {
      bucketA.push(post);
    } else if (postAge <= BUCKET_B_MS) {
      bucketB.push(post);
    } else {
      bucketC.push(post);
    }
  });

  // --- Sort Bucket A: Badge priority, then recency ---
  bucketA.sort((a, b) => {
    const aBadge = badgeMap[a.id];
    const bBadge = badgeMap[b.id];
    
    // Top Rated > Most Discussed
    if (aBadge === 'top-rated' && bBadge !== 'top-rated') return -1;
    if (bBadge === 'top-rated' && aBadge !== 'top-rated') return 1;

    // Same badge type: sort by recency
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // --- Sort Bucket B: Recency with engagement signal ---
  // Engagement bonus: Higher review count gets slight priority within same day
  bucketB.sort((a, b) => {
    const aTime = new Date(a.createdAt).getTime();
    const bTime = new Date(b.createdAt).getTime();
    
    // Primary: Recency
    const timeDiff = bTime - aTime;
    
    // If same day, use engagement as tiebreaker
    const aDay = a.createdAt.split('T')[0];
    const bDay = b.createdAt.split('T')[0];
    
    if (aDay === bDay) {
      // Slight engagement bonus (review count)
      return b.rating.reviewCount - a.rating.reviewCount;
    }
    
    return timeDiff;
  });

  // --- Sort Bucket C: Recency only ---
  bucketC.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // --- Apply gentle variation (shuffle within day groups) ---
  const daySeed = Math.floor(Date.now() / (24 * 60 * 60 * 1000)); // Changes daily
  const shuffledB = shuffleWithinDays(bucketB, daySeed);
  const shuffledC = shuffleWithinDays(bucketC, daySeed);

  // --- Interleave: Rate-limit Bucket A posts ---
  // Max 1 standout post per STANDOUT_SPACING cards
  const result: Post[] = [];
  const standoutQueue = [...bucketA];
  const regularQueue = [...shuffledB, ...shuffledC];

  let cardsSinceLastStandout = STANDOUT_SPACING; // Allow first standout early

  while (standoutQueue.length > 0 || regularQueue.length > 0) {
    // Check if we can insert a standout
    if (standoutQueue.length > 0 && cardsSinceLastStandout >= STANDOUT_SPACING) {
      result.push(standoutQueue.shift()!);
      cardsSinceLastStandout = 0;
    } else if (regularQueue.length > 0) {
      result.push(regularQueue.shift()!);
      cardsSinceLastStandout++;
    } else if (standoutQueue.length > 0) {
      // Only standouts left, just add them
      result.push(standoutQueue.shift()!);
    }
  }

  return result;
}

/**
 * Check if current sort is the default "Curated Freshness"
 */
export function isCuratedFreshness(sortBy: string): boolean {
  return sortBy === '✨Curated Freshness✨';
}
