/**
 * Reviews Domain Service
 *
 * Handles reading and writing review data to Supabase.
 * Metrics (averages, scores, distributions) live natively on the Post object via DB triggers.
 */

import type { Review } from '@/types';
import { supabase } from './supabase/client';
import { populateProfileCache } from './profiles';

// ─── Reads ────────────────────────────────────────────────────────────────────

/**
 * Fetch all reviews for a given post.
 */
export async function getReviewsByPostId(postId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles(id, username, name, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }

  // Cache the reviewer profiles so they appear correctly in the UI
  const profilesToCache = data.map((row: any) => row.profiles).filter(Boolean);
  if (profilesToCache.length > 0) populateProfileCache(profilesToCache);

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
  let token = null;
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    token = sessionData?.session?.access_token;
  } catch (err) {
    console.warn("Could not fetch session locally, falling back to guest mode.", err);
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers,
      body: JSON.stringify(review)
    });

    const data = await response.json();
    if (!response.ok) {
      return { ok: false, error: data.error || 'Failed to submit review' };
    }

    return { ok: true, review: data.review as Review };
  } catch (error: any) {
    console.error('Error submitting review:', error);
    return { ok: false, error: error.message || 'Network error' };
  }
}
