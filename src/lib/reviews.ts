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
      reviewer_name: row.profiles?.name || 'Anonymous',
      ratings,
      comment: row.comment,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  });
}

/**
 * Resolve the display name for a review's author.
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
    console.warn("Could not fetch session locally.", err);
  }

  if (!token) {
    return { ok: false, error: 'You must be logged in to submit a review.' };
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  try {
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers,
      body: JSON.stringify(review)
    });

    const data = await response.json().catch(() => null);
    if (!response.ok || !data) {
      return { ok: false, error: data?.error || 'Failed to submit review' };
    }

    return { ok: true, review: data.review as Review };
  } catch (error: any) {
    console.error('Error submitting review:', error);
    return { ok: false, error: error.message || 'Network error' };
  }
}

export async function updateReview(
  reviewId: string,
  updates: Partial<Omit<Review, 'id' | 'post_id' | 'reviewer_id' | 'created_at' | 'updated_at'>>
): Promise<{ ok: true; review: Review } | { ok: false; error: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { ok: false, error: 'You must be logged in to edit a review.' };
    }

    const dbPayload: any = {
      comment: updates.comment !== undefined ? updates.comment : undefined,
      updated_at: new Date().toISOString()
    };

    const allowedRatings = ['aesthetics', 'clarity', 'purpose', 'usability', 'recognition', 'impact', 'engagement', 'composition', 'detail'];
    if (updates.ratings) {
      allowedRatings.forEach(key => {
        if (updates.ratings![key] !== undefined) {
          dbPayload[key] = updates.ratings![key];
        }
      });
    }

    const { data, error } = await supabase
      .from('reviews')
      .update(dbPayload)
      .eq('id', reviewId)
      .eq('reviewer_id', session.user.id) // Double check client-side
      .select()
      .single();

    if (error) throw error;
    if (!data) throw new Error("Review not found or unauthorized");

    const { getProfileById } = await import('@/lib/profiles');
    const profile = await getProfileById(session.user.id);

    return { 
      ok: true, 
      review: {
        id: data.id,
        post_id: data.post_id,
        reviewer_id: data.reviewer_id,
        reviewer_name: profile?.name || 'Anonymous',
        ratings: updates.ratings || {},
        comment: data.comment,
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    };
  } catch (error: any) {
    console.error('Error updating review:', error);
    const { normalizeError } = await import('@/lib/errors/normalizeError');
    const norm = normalizeError(error, { fallbackMessage: "Couldn't update your review. Try again." });
    return { ok: false, error: norm.message };
  }
}

export async function deleteReview(reviewId: string): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      return { ok: false, error: 'You must be logged in to delete a review.' };
    }

    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId)
      .eq('reviewer_id', session.user.id); // Double check client-side

    if (error) throw error;

    return { ok: true };
  } catch (error: any) {
    console.error('Error deleting review:', error);
    const { normalizeError } = await import('@/lib/errors/normalizeError');
    const norm = normalizeError(error, { fallbackMessage: "Couldn't delete your review. Try again." });
    return { ok: false, error: norm.message };
  }
}
