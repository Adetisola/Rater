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
      await supabase.from('insight_cache').delete().eq('post_id', postId);
      return null;
    }

    return data.result as CachedInsight;
  } catch {
    return null;
  }
}

/**
 * Cache an LLM synthesis result.
 */
export async function setCachedInsight(postId: string, result: CachedInsight, reviewCount: number): Promise<void> {
  if (!supabase) return;

  try {
    await supabase.from('insight_cache').upsert({
      post_id: postId,
      result,
      review_count: reviewCount
    });
  } catch {
    // Fail silently
  }
}

/**
 * Check if a valid cache exists without retrieving the full result.
 */
export async function hasCachedInsight(postId: string, currentReviewCount: number): Promise<boolean> {
  return (await getCachedInsight(postId, currentReviewCount)) !== null;
}
