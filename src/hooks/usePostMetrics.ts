"use client";

import { useState, useEffect } from 'react';
import type { PostMetrics } from '@/types';
import { metricsService } from '../services/metricsService';

/**
 * Hook to fetch metrics for a post with real-time updates from Supabase.
 */
export function usePostMetrics(postId: string) {
  const [metrics, setMetrics] = useState<PostMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const loadMetrics = async () => {
      const res = await metricsService.fetchPostMetrics(postId);
      if (isMounted) {
        if (res.ok && res.data) {
          setMetrics(res.data);
          setError(null);
        } else {
          setError(new Error(res.error || 'Failed to fetch metrics'));
        }
        setLoading(false);
      }
    };

    loadMetrics();

    // Subscribe to live metrics updates
    const unsubscribe = metricsService.subscribeToMetrics(postId, (updatedMetrics) => {
      if (isMounted) {
        setMetrics(updatedMetrics);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [postId]);

  return { metrics, loading, error };
}
