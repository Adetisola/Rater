/**
 * Curated Freshness V1 — Default Homepage Sorting Algorithm
 * 
 * Buckets:
 * - Bucket A (Standout): Posts with the Top Rated badge. Rate-limited to 1 per 6-8 cards.
 * - Bucket B (Active & Emerging): Posts from the last 14-21 days.
 * - Bucket C (Older Archive): All other posts.
 * 
 * Ordering:
 * - Bucket A: Top Rated badge, then recency.
 * - Bucket B: Recency with light engagement signal (review count).
 * - Bucket C: Recency only.
 */

import { type Post, calculatePostMetrics } from './mockData';
import { computeBadges } from './badgeUtils';

const BUCKET_B_WINDOW_DAYS = 17; // Middle of 14-21 range
const STANDOUT_SPACING = 7;      // Middle of 6-8 range

/**
 * Seeded random for gentle, stable variation.
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
function shuffleWithinDays<T extends { created_at: string }>(posts: T[], seed: number): T[] {
  const random = seededRandom(seed);
  
  // Group by day
  const dayGroups: Record<string, T[]> = {};
  posts.forEach(post => {
    const day = post.created_at.split('T')[0];
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
 * Curated Freshness Sort (Async Version)
 * Returns posts sorted according to the Curated Freshness V1 algorithm.
 */
export async function curatedFreshnessSort(posts: Post[]): Promise<Post[]> {
  const now = Date.now();
  const BUCKET_B_MS = BUCKET_B_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  // 1. Compute badges for all posts (now async)
  const badgeMap = await computeBadges(posts);

  // 2. Pre-calculate metrics for all posts (needed for Bucket B sorting)
  // This avoids async sorting pitfalls
  const metricsMap: Record<string, { review_count: number }> = {};
  await Promise.all(posts.map(async post => {
    const m = await calculatePostMetrics(post.id);
    metricsMap[post.id] = { review_count: m.review_count };
  }));

  // 3. Categorize into buckets
  const bucketA: Post[] = []; // Standout (Top Rated badge)
  const bucketB: Post[] = []; // Active & Emerging (recent)
  const bucketC: Post[] = []; // Older Archive

  posts.forEach(post => {
    const badge = badgeMap[post.id];
    const postAge = now - new Date(post.created_at).getTime();

    if (badge === 'top_rated_active') {
      bucketA.push(post);
    } else if (postAge <= BUCKET_B_MS) {
      bucketB.push(post);
    } else {
      bucketC.push(post);
    }
  });

  // --- Sort Bucket A: Recency (only Top Rated badge exists) ---
  bucketA.sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  // --- Sort Bucket B: Recency with engagement signal ---
  bucketB.sort((a, b) => {
    const aTime = new Date(a.created_at).getTime();
    const bTime = new Date(b.created_at).getTime();
    
    // Primary: Recency
    const timeDiff = bTime - aTime;
    
    // If same day, use engagement as tiebreaker
    const aDay = a.created_at.split('T')[0];
    const bDay = b.created_at.split('T')[0];
    
    if (aDay === bDay) {
      // Slight engagement bonus (review count)
      const aCount = metricsMap[a.id]?.review_count || 0;
      const bCount = metricsMap[b.id]?.review_count || 0;
      return bCount - aCount;
    }
    
    return timeDiff;
  });

  // --- Sort Bucket C: Recency only ---
  bucketC.sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  // --- Apply gentle variation (shuffle within day groups) ---
  const daySeed = Math.floor(Date.now() / (24 * 60 * 60 * 1000)); // Changes daily
  const shuffledB = shuffleWithinDays(bucketB, daySeed);
  const shuffledC = shuffleWithinDays(bucketC, daySeed);

  // --- Interleave: Rate-limit Bucket A posts ---
  const result: Post[] = [];
  const standoutQueue = [...bucketA];
  const regularQueue = [...shuffledB, ...shuffledC];

  let cardsSinceLastStandout = STANDOUT_SPACING; 

  while (standoutQueue.length > 0 || regularQueue.length > 0) {
    if (standoutQueue.length > 0 && cardsSinceLastStandout >= STANDOUT_SPACING) {
      result.push(standoutQueue.shift()!);
      cardsSinceLastStandout = 0;
    } else if (regularQueue.length > 0) {
      result.push(regularQueue.shift()!);
      cardsSinceLastStandout++;
    } else if (standoutQueue.length > 0) {
      result.push(standoutQueue.shift()!);
    }
  }

  return result;
}

export function isCuratedFreshness(sortBy: string): boolean {
  return sortBy === 'balanced';
}
