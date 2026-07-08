/**
 * Reviews Domain Service
 *
 * Handles reading and writing review data to Supabase.
 * Metrics (averages, scores, distributions) live natively on the Post object via DB triggers.
 */

import type { Review } from '@/types';
import { supabase } from './supabase/client';

// ─── Reads ────────────────────────────────────────────────────────────────────

/**
 * Fetch all reviews for a given post.
 */
export async function getReviewsByPostId(postId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles(id, username, name, avatar_url, bg_color)')
    .eq('post_id', postId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }

  // Map the joined profile data to the reviewer_name format expected by UI
  return data.map((row: any) => {
    const ratings: Record<string, number> = {};
    const allowedRatings = ['aesthetics', 'clarity', 'purpose', 'usability', 'recognition', 'impact', 'engagement', 'composition', 'detail'];
    
    allowedRatings.forEach(key => {
      if (row[key] !== null && row[key] !== undefined) {
        ratings[key] = row[key];
      }
    });

    return {
      id: row.id,
      post_id: row.post_id,
      reviewer_id: row.reviewer_id,
      device_id: row.device_id,
      reviewer_name: row.profiles?.name || row.reviewer_name || 'Anonymous',
      ratings,
      comment: row.comment,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  });
}

/**
 * Resolve the display name for a review's author.
 * Since getReviewsByPostId now joins and populates reviewer_name, this is a simple pass-through.
 */
export function getReviewerName(review: Review): string {
  return review.reviewer_name || 'Anonymous';
}

// ─── Writes ───────────────────────────────────────────────────────────────────

export async function submitReview(
  review: Omit<Review, 'id' | 'created_at' | 'updated_at'>
): Promise<{ ok: true; review: Review } | { ok: false; error: string }> {
  // Get active session user if any
  let userId;
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    userId = sessionData?.session?.user?.id;
  } catch (err) {
    console.warn("Could not fetch session locally, falling back to guest mode if device_id is present.", err);
  }

  if (!userId && !review.device_id) {
    return { ok: false, error: 'Must provide either a logged-in user or a device_id for guest reviews.' };
  }

  const payload: any = {
    post_id: review.post_id,
    comment: review.comment || null,
    updated_at: new Date().toISOString()
  };

  if (userId) {
    payload.reviewer_id = userId;
  } else {
    payload.device_id = review.device_id;
    payload.reviewer_name = review.reviewer_name || 'Anonymous';
  }

  // Inject all possible ratings
  const allowedRatings = ['aesthetics', 'clarity', 'purpose', 'usability', 'recognition', 'impact', 'engagement', 'composition', 'detail'];
  allowedRatings.forEach(key => {
    if (review.ratings[key] !== undefined) {
      payload[key] = review.ratings[key];
    }
  });

  // Determine conflict resolution strategy
  const onConflict = userId ? 'post_id,reviewer_id' : 'post_id,device_id';

  const { data, error } = await supabase
    .from('reviews')
    .upsert(payload, { onConflict })
    .select()
    .single();

  if (error) {
    console.error('Error submitting review:', JSON.stringify(error, null, 2), error);
    return { ok: false, error: error.message || 'Unknown database error' };
  }

  return { 
    ok: true, 
    review: data as Review 
  };
}
