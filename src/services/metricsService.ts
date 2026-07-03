import { supabase } from '../lib/supabaseClient';
import { safeQueryExecute, type ServiceResponse } from './baseService';
import type { PostMetrics } from '@/types';

export const metricsService = {
  /**
   * Fetches the current calculated metrics for a post from the post_metrics view.
   */
  async fetchPostMetrics(postId: string): Promise<ServiceResponse<PostMetrics>> {
    return safeQueryExecute<PostMetrics>(
      supabase
        .from('post_metrics')
        .select('*')
        .eq('post_id', postId)
        .single()
    );
  },

  /**
   * Subscribes to rating metrics updates.
   * Since Supabase Realtime doesn't support direct subscriptions on PostgreSQL Views,
   * we subscribe to changes on the underlying physical 'reviews' table for this post_id.
   * When any review change is captured, we re-fetch the latest metrics from the view
   * and invoke the update callback.
   */
  subscribeToMetrics(postId: string, onUpdate: (metrics: PostMetrics) => void) {
    const channel = supabase
      .channel(`live-post-metrics-${postId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to INSERTs, UPDATEs, and DELETEs to keep averages accurate
          schema: 'public',
          table: 'reviews',
          filter: `post_id=eq.${postId}`,
        },
        async () => {
          const res = await this.fetchPostMetrics(postId);
          if (res.ok && res.data) {
            onUpdate(res.data);
          }
        }
      )
      .subscribe();

    // Returns a cleanup function that the consuming React component can invoke on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }
};
