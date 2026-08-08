/**
 * Insight Cache — Supabase-based cache for LLM synthesis results.
 *
 * - Stored in `insight_cache` table
 * - Invalidated or overwritten when review count changes
 */

import { supabase } from '@/lib/supabase/client';

export interface CachedInsight {
  summary: string;
  strengths: string[];
  areasToImprove: string[];
  model?: string;
}

/**
 * Get a cached insight result if it exists and is still valid.
 * Returns null if no cache or review count has changed.
 */
export async function getCachedInsight(postId: string, currentReviewCount: number): Promise<CachedInsight | null> {
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('insight_cache')
      .select('result, review_count')
      .eq('post_id', postId)
      .single();

    if (error || !data) return null;

    // Check if review count has changed (new reviews invalidate cache)
    if (data.review_count !== currentReviewCount) {
      // The old cache is stale, but we let the backend handle the overwrite
      return null;
    }

    return data.result as CachedInsight;
  } catch {
    return null;
  }
}



/**
 * Check if a valid cache exists without retrieving the full result.
 */
export async function hasCachedInsight(postId: string, currentReviewCount: number): Promise<boolean> {
  return (await getCachedInsight(postId, currentReviewCount)) !== null;
}
