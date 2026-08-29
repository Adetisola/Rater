/**
 * Insights Domain Service
 *
 * Public API for Rater's insight engine — context-aware creative perception
 * synthesis. The underlying logic lives in utils/insightEngine.ts and
 * utils/insightCache.ts. This file provides the service boundary.
 *
 * Phase 1: thin wrappers around existing utility functions.
 * Milestone 5: add server-side caching via Supabase (replace insightCache localStorage).
 *
 * Synchronization:
 *   When reviews change (new submission) → call invalidateInsights(postId)
 *   so stale cached insights are cleared and regenerated on next view.
 */

export {
  synthesizeInsights as generateInsights,
  type PerceptionInsights,
  type PerceptionTheme,
} from '@/utils/insightEngine';

export {
  getCachedInsight as getCachedInsights,

  hasCachedInsight,
} from '@/utils/insightCache';

/**
 * Invalidate (clear) the cached insight for a post.
 * Called when new reviews are submitted or a post is updated.
 *
 * INTENTIONAL: Reply creation does NOT call this function.
 * Replies represent a conversational engagement layer and do not alter the
 * structured rating/critique data that Insights synthesizes. Perception cache
 * remains valid until a new critique (review) is submitted or deleted.
 */
export async function invalidateInsights(postId: string): Promise<void> {
  const { supabase } = await import('@/lib/supabase/client');
  if (!supabase) return;
  try {
    await supabase.from('insight_cache').delete().eq('post_id', postId);
  } catch {
    // Fail silently
  }
}
