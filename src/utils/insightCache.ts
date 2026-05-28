/**
 * Insight Cache — localStorage-based cache for LLM synthesis results.
 *
 * - Key format: rater-insights-{postId}
 * - TTL: 24 hours
 * - Invalidated when review count changes (new reviews submitted)
 */

const CACHE_PREFIX = 'rater-insights-';
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface CachedInsight {
  summary: string;
  strengths: string[];
  areasToImprove: string[];
  model?: string;
}

interface CacheEntry {
  result: CachedInsight;
  reviewCount: number;
  timestamp: number;
}

function getCacheKey(postId: string): string {
  return `${CACHE_PREFIX}${postId}`;
}

/**
 * Get a cached insight result if it exists and is still valid.
 * Returns null if no cache, expired, or review count has changed.
 */
export function getCachedInsight(postId: string, currentReviewCount: number): CachedInsight | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = localStorage.getItem(getCacheKey(postId));
    if (!raw) return null;

    const entry: CacheEntry = JSON.parse(raw);

    // Check TTL
    if (Date.now() - entry.timestamp > TTL_MS) {
      localStorage.removeItem(getCacheKey(postId));
      return null;
    }

    // Check if review count has changed (new reviews invalidate cache)
    if (entry.reviewCount !== currentReviewCount) {
      localStorage.removeItem(getCacheKey(postId));
      return null;
    }

    return entry.result;
  } catch {
    return null;
  }
}

/**
 * Cache an LLM synthesis result.
 */
export function setCachedInsight(postId: string, result: CachedInsight, reviewCount: number): void {
  if (typeof window === 'undefined') return;

  try {
    const entry: CacheEntry = {
      result,
      reviewCount,
      timestamp: Date.now(),
    };
    localStorage.setItem(getCacheKey(postId), JSON.stringify(entry));
  } catch {
    // localStorage full or unavailable — fail silently
  }
}

/**
 * Check if a valid cache exists without retrieving the full result.
 */
export function hasCachedInsight(postId: string, currentReviewCount: number): boolean {
  return getCachedInsight(postId, currentReviewCount) !== null;
}
