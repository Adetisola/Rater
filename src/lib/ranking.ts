/**
 * Ranking Domain Service
 *
 * Separates feed algorithms and sorting mechanisms from core metrics.
 */

import { supabase } from './supabase/client';

/**
 * Get the trending score for a post (review count, recency-weighted).
 * Used by hotPostUtils to determine 🔥 status.
 */
export async function getTrendingScore(postId: string): Promise<{ review_count: number }> {
  const { data, error } = await supabase
    .from('posts')
    .select('review_count')
    .eq('id', postId)
    .single();

  if (error || !data) {
    return { review_count: 0 };
  }

  return { review_count: data.review_count || 0 };
}

/**
 * Get the curated sort score for a post (review count + average).
 * Used by curatedSort.ts for the Balanced feed algorithm.
 */
export async function getCuratedScore(
  postId: string
): Promise<{ review_count: number; average_score: number }> {
  const { data, error } = await supabase
    .from('posts')
    .select('review_count, average_score')
    .eq('id', postId)
    .single();

  if (error || !data) {
    return { review_count: 0, average_score: 0 };
  }

  return {
    review_count: data.review_count || 0,
    average_score: data.average_score || 0,
  };
}
