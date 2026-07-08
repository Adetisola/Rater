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
  setCachedInsight as saveInsights,
  hasCachedInsight,
} from '@/utils/insightCache';

/**
 * Invalidate (clear) the cached insight for a post.
 * Called when new reviews are submitted or a post is updated.
 *
 * TODO(milestone-5): supabase.from('insight_cache').delete().eq('post_id', postId)
 */
export function invalidateInsights(postId: string): void {
  if (typeof window === 'undefined') return;
  const key = `rater-insights-${postId}`;
  try {
    localStorage.removeItem(key);
  } catch {
    // localStorage unavailable — fail silently
  }
}
