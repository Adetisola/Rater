import { supabase } from '@/lib/supabase/client';
import { redis } from '@/lib/redis';

export interface SearchEventPayload {
  query: string;
  userId?: string | null;
  isAuthenticated?: boolean;
  resultCount: number;
  selectedResultType?: 'search' | 'avatar' | 'post' | 'category' | null;
  selectedResultId?: string | null;
}

export interface SearchMetricItem {
  query: string;
  count: number;
}

/**
 * Constructs a normalized signature for a committed Browse search.
 * Ensures identical queries, category filters, and avatar filters produce matching signatures
 * for robust deduplication.
 */
export function buildBrowseTrackingSignature(
  query: string,
  categories: readonly string[] | string[],
  avatarId?: string | null
): string {
  return `${query.trim().toLowerCase()}|${categories.join(',')}|${avatarId || ''}`;
}

/**
 * Validates whether a query meets the minimum length requirement to be recorded as a search event.
 */
export function isSearchEligibleForTracking(query: string): boolean {
  return query.trim().length >= 2;
}

/**
 * Record a search event to Supabase (permanent historical intelligence)
 * and update Redis counters for fast autocomplete and trending aggregation.
 */
export async function trackSearchEvent(event: SearchEventPayload): Promise<void> {
  const normalized = event.query.trim().toLowerCase();
  if (!normalized || normalized.length < 2) return;

  try {
    // 1. Permanent store in Supabase
    supabase.from('search_events').insert({
      query: event.query.trim(),
      normalized_query: normalized,
      user_id: event.userId || null,
      is_authenticated: Boolean(event.isAuthenticated),
      result_count: event.resultCount,
      selected_result_type: event.selectedResultType || null,
      selected_result_id: event.selectedResultId || null,
    }).then(({ error }) => {
      if (error) console.warn('[SearchAnalytics] Supabase insert warning:', error.message);
    });

    // 2. Fast Redis aggregation (if available)
    if (redis) {
      const now = new Date();
      const hourKey = `${now.getUTCFullYear()}-${now.getUTCMonth() + 1}-${now.getUTCDate()}-${now.getUTCHours()}`;

      // Increment all-time / rolling popular count
      await redis.zincrby('rater:search:popular', 1, normalized);

      // If zero results, increment no-result counter for admin product intelligence
      if (event.resultCount === 0) {
        await redis.zincrby('rater:search:no_results', 1, normalized);
      }

      // Track hourly bucket for 48h trend velocity
      const trendKey = `rater:search:hourly:${hourKey}`;
      await redis.zincrby(trendKey, 1, normalized);
      await redis.expire(trendKey, 60 * 60 * 48); // 48h TTL
    }
  } catch (err: any) {
    console.warn('[SearchAnalytics] Tracking error:', err.message);
  }
}

/**
 * Get popular searches across the platform.
 */
export async function getPopularSearches(limit = 8): Promise<string[]> {
  try {
    if (redis) {
      const items = await redis.zrange<string[]>('rater:search:popular', 0, limit - 1, {
        rev: true,
      });
      if (items && items.length > 0) return items;
    }

    // Fallback: Query Supabase
    const { data } = await supabase
      .from('search_events')
      .select('normalized_query')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      const counts: Record<string, number> = {};
      data.forEach(d => {
        counts[d.normalized_query] = (counts[d.normalized_query] || 0) + 1;
      });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([q]) => q);
    }
  } catch (e) {
    console.warn('[SearchAnalytics] getPopularSearches error:', e);
  }

  return [];
}

/**
 * Get top no-result searches for Admin discovery.
 */
export async function getNoResultSearches(limit = 20): Promise<SearchMetricItem[]> {
  try {
    if (redis) {
      const results = await redis.zrange<string[]>('rater:search:no_results', 0, limit - 1, {
        rev: true,
        withScores: true,
      });
      if (results && results.length > 0) {
        const list: SearchMetricItem[] = [];
        for (let i = 0; i < results.length; i += 2) {
          list.push({ query: results[i], count: Number(results[i + 1]) });
        }
        return list;
      }
    }

    // Fallback: Query Supabase
    const { data } = await supabase
      .from('search_events')
      .select('normalized_query')
      .eq('result_count', 0)
      .limit(100);

    if (data) {
      const counts: Record<string, number> = {};
      data.forEach(d => {
        counts[d.normalized_query] = (counts[d.normalized_query] || 0) + 1;
      });
      return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([query, count]) => ({ query, count }));
    }
  } catch (e) {
    console.warn('[SearchAnalytics] getNoResultSearches error:', e);
  }
  return [];
}

export interface SearchIntelligenceSummary {
  totalSearches: number;
  zeroResultCount: number;
  popularSearches: SearchMetricItem[];
  noResultSearches: SearchMetricItem[];
}

export async function getSearchIntelligenceSummary(): Promise<SearchIntelligenceSummary> {
  let totalSearches = 0;
  let zeroResultCount = 0;
  let popularSearches: SearchMetricItem[] = [];
  let noResultSearches: SearchMetricItem[] = [];

  try {
    // 1. Get counts from Supabase
    const [totalRes, zeroRes] = await Promise.all([
      supabase.from('search_events').select('*', { count: 'exact', head: true }),
      supabase.from('search_events').select('*', { count: 'exact', head: true }).eq('result_count', 0),
    ]);

    totalSearches = totalRes.count || 0;
    zeroResultCount = zeroRes.count || 0;

    // 2. Popular searches from Redis or Supabase
    if (redis) {
      const popScores = await redis.zrange<string[]>('rater:search:popular', 0, 9, {
        rev: true,
        withScores: true,
      });
      if (popScores && popScores.length > 0) {
        for (let i = 0; i < popScores.length; i += 2) {
          popularSearches.push({ query: popScores[i], count: Number(popScores[i + 1]) });
        }
      }
    }

    if (popularSearches.length === 0) {
      const popularStrings = await getPopularSearches(10);
      popularSearches = popularStrings.map(q => ({ query: q, count: 1 }));
    }

    // 3. No-result searches
    noResultSearches = await getNoResultSearches(10);
  } catch (err) {
    console.warn('[SearchAnalytics] getSearchIntelligenceSummary error:', err);
  }

  return {
    totalSearches,
    zeroResultCount,
    popularSearches,
    noResultSearches,
  };
}
