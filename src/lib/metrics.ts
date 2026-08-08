/**
 * Metrics Domain Service
 *
 * In Milestone 4, metrics are cached directly on the `posts` table
 * using a high-performance database trigger. This service simply 
 * queries those cached columns.
 */

import type { PostMetrics, Review } from '@/types';
import { supabase } from './supabase/client';

// ─── Post-Level Metrics ───────────────────────────────────────────────────────

/**
 * Get aggregated metrics for a post.
 * If additionalReviews are provided (optimistic UI), it manually merges them
 * with the base DB metrics for immediate feedback.
 */
export async function getPostMetrics(
  postId: string,
  additionalReviews?: Review[]
): Promise<PostMetrics> {
  const { data } = await supabase
    .from('posts')
    .select('review_count, average_score, criteria_scores, view_count')
    .eq('id', postId)
    .single();

  const baseMetrics: PostMetrics = {
    post_id: postId,
    review_count: data?.review_count || 0,
    view_count: data?.view_count || 0,
    average_score: data?.average_score || 0,
    rating_unlocked: (data?.review_count || 0) >= 3,
    criteria_scores: data?.criteria_scores || {},
  };

  if (!additionalReviews || additionalReviews.length === 0) {
    return baseMetrics;
  }

  // Handle optimistic merge
  const totalReviews = baseMetrics.review_count + additionalReviews.length;
  if (totalReviews === 0) return baseMetrics;

  // We approximate the new average:
  // (old_avg * old_count + sum(new_reviews_avg)) / totalReviews
  let newReviewsSum = 0;
  for (const r of additionalReviews) {
    const scores = Object.values(r.ratings || {});
    if (scores.length > 0) {
      const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
      newReviewsSum += avg;
    }
  }

  const newAverage = ((baseMetrics.average_score * baseMetrics.review_count) + newReviewsSum) / totalReviews;

  // Approximate criteria_scores
  const newCriteriaScores = { ...(baseMetrics.criteria_scores || {}) };
  for (const r of additionalReviews) {
    for (const [criterion, score] of Object.entries(r.ratings || {})) {
      const prevScore = newCriteriaScores[criterion] || 0;
      // Reverse engineer the sum, add the new score, then re-average
      const prevSum = prevScore * baseMetrics.review_count;
      newCriteriaScores[criterion] = Number(((prevSum + score) / totalReviews).toFixed(1));
    }
  }

  return {
    post_id: postId,
    review_count: totalReviews,
    view_count: baseMetrics.view_count,
    average_score: Number(newAverage.toFixed(1)),
    rating_unlocked: totalReviews >= 3,
    criteria_scores: newCriteriaScores,
  };
}

/**
 * Get the average rating for a post (unlocked only).
 */
export async function getAverageRating(postId: string): Promise<number | null> {
  const metrics = await getPostMetrics(postId);
  return metrics.rating_unlocked ? metrics.average_score : null;
}

/**
 * Get the per-criterion score distribution for a post.
 */
export async function getReviewDistribution(
  postId: string
): Promise<Record<string, number>> {
  const metrics = await getPostMetrics(postId);
  return metrics.criteria_scores || {};
}
