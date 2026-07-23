"use client";

import { useState, useEffect } from 'react';
import type { PostMetrics } from '@/types';
import { getPostMetrics } from '@/lib/metrics';

/**
 * Hook to fetch metrics for a post.
 * In production, this might subscribe to a Supabase real-time channel.
 */
export function usePostMetrics(postId: string) {
  const [metrics, setMetrics] = useState<PostMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    getPostMetrics(postId)
      .then(data => {
        if (isMounted) {
          setMetrics(data);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [postId]);

  return { metrics, loading, error };
}
