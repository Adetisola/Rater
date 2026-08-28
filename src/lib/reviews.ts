/**
 * Reviews Domain Service
 *
 * Handles reading and writing review data to Supabase.
 * Metrics (averages, scores, distributions) live natively on the Post object via DB triggers.
 */

import type { Review, CritiqueReply, CritiqueRepliesResponse } from '@/types';
import { supabase } from './supabase/client';
import { populateProfileCache } from './profiles';

// ─── Reads ────────────────────────────────────────────────────────────────────

/**
 * Fetch all reviews for a given post with aggregated reply stats and read status.
 */
export async function getReviewsByPostId(postId: string): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles:reviewer_id(id, username, name, avatar_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }

  // Cache the reviewer profiles so they appear correctly in the UI
  const profilesToCache = data.map((row: any) => row.profiles).filter(Boolean);
  if (profilesToCache.length > 0) populateProfileCache(profilesToCache);

  const reviewIds = data.map((row: any) => row.id);
  const replyStatsMap: Record<string, { count: number; latest_reply_at?: string }> = {};
  const readStatsMap: Record<string, string> = {};

  if (reviewIds.length > 0) {
    // 1. Fetch reply counts and latest reply timestamps
    const { data: replyRows } = await supabase
      .from('critique_replies')
      .select('id, critique_id, created_at')
      .in('critique_id', reviewIds)
      .is('deleted_at', null);

    (replyRows || []).forEach((rep: any) => {
      const current = replyStatsMap[rep.critique_id] || { count: 0 };
      current.count++;
      if (!current.latest_reply_at || new Date(rep.created_at) > new Date(current.latest_reply_at)) {
        current.latest_reply_at = rep.created_at;
      }
      replyStatsMap[rep.critique_id] = current;
    });

    // 2. Fetch read timestamps for the current user
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;
      if (currentUserId) {
        const { data: readRows } = await supabase
          .from('critique_reply_reads')
          .select('critique_id, last_read_reply_at')
          .eq('user_id', currentUserId)
          .in('critique_id', reviewIds);

        (readRows || []).forEach((rd: any) => {
          readStatsMap[rd.critique_id] = rd.last_read_reply_at;
        });
      }
    } catch {
      // Non-blocking for unauthenticated guests
    }
  }

  // Map the joined profile data to the reviewer format expected by UI
  return data.map((row: any) => {
    const ratings: Record<string, number> = {};
    const allowedRatings = ['aesthetics', 'clarity', 'purpose', 'usability', 'recognition', 'impact', 'engagement', 'composition', 'detail'];
    
    allowedRatings.forEach(key => {
      if (row[key] !== null && row[key] !== undefined) {
        ratings[key] = row[key];
      }
    });

    const authorProfile = row.profiles ? {
      id: row.profiles.id,
      username: row.profiles.username,
      name: row.profiles.name,
      avatar_url: row.profiles.avatar_url || undefined,
    } as any : undefined;

    const stats = replyStatsMap[row.id];
    const lastReadAt = readStatsMap[row.id];
    const hasUnread = Boolean(
      stats?.latest_reply_at &&
      (!lastReadAt || new Date(stats.latest_reply_at) > new Date(lastReadAt))
    );

    return {
      id: row.id,
      post_id: row.post_id,
      reviewer_id: row.reviewer_id,
      reviewer_name: row.profiles?.name || 'Anonymous',
      author: authorProfile,
      ratings,
      comment: row.comment,
      created_at: row.created_at,
      updated_at: row.updated_at,
      reply_count: stats?.count || 0,
      latest_reply_at: stats?.latest_reply_at || null,
      has_unread_replies: hasUnread,
    };
  });
}

/**
 * Fetch a single review by ID with aggregated reply stats and read status.
 */
export async function fetchCritiqueById(critiqueId: string): Promise<Review | null> {
  try {
    const { data: row, error } = await supabase
      .from('reviews')
      .select('*, profiles:reviewer_id(id, username, name, avatar_url)')
      .eq('id', critiqueId)
      .maybeSingle();

    if (error || !row) {
      if (error) console.error('Error fetching critique by ID:', error);
      return null;
    }

    if (row.profiles) populateProfileCache([row.profiles]);

    // Reply stats
    const { data: replyRows } = await supabase
      .from('critique_replies')
      .select('id, created_at')
      .eq('critique_id', critiqueId)
      .is('deleted_at', null);

    let replyCount = 0;
    let latestReplyAt: string | undefined = undefined;

    (replyRows || []).forEach((rep: any) => {
      replyCount++;
      if (!latestReplyAt || new Date(rep.created_at) > new Date(latestReplyAt)) {
        latestReplyAt = rep.created_at;
      }
    });

    // Read status
    let lastReadAt: string | undefined = undefined;
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const currentUserId = sessionData?.session?.user?.id;
      if (currentUserId) {
        const { data: readRow } = await supabase
          .from('critique_reply_reads')
          .select('last_read_reply_at')
          .eq('user_id', currentUserId)
          .eq('critique_id', critiqueId)
          .maybeSingle();

        if (readRow) lastReadAt = readRow.last_read_reply_at;
      }
    } catch {
      // Non-blocking
    }

    const ratings: Record<string, number> = {};
    const allowedRatings = ['aesthetics', 'clarity', 'purpose', 'usability', 'recognition', 'impact', 'engagement', 'composition', 'detail'];
    allowedRatings.forEach(key => {
      if (row[key] !== null && row[key] !== undefined) {
        ratings[key] = row[key];
      }
    });

    const authorProfile = row.profiles ? {
      id: row.profiles.id,
      username: row.profiles.username,
      name: row.profiles.name,
      avatar_url: row.profiles.avatar_url || undefined,
    } as any : undefined;

    const hasUnread = Boolean(
      latestReplyAt && (!lastReadAt || new Date(latestReplyAt) > new Date(lastReadAt))
    );

    return {
      id: row.id,
      post_id: row.post_id,
      reviewer_id: row.reviewer_id,
      reviewer_name: row.profiles?.name || 'Anonymous',
      author: authorProfile,
      ratings,
      comment: row.comment,
      created_at: row.created_at,
      updated_at: row.updated_at,
      reply_count: replyCount,
      latest_reply_at: latestReplyAt || null,
      has_unread_replies: hasUnread,
    };
  } catch (err) {
    console.error('Failed to fetch critique by ID:', err);
    return null;
  }
}

/**
 * Resolves the parent critique and post IDs for a given reply.
 * Useful when deep links only specify `replyId` without `critiqueId`.
 */
export async function resolveReplyContext(
  replyId: string
): Promise<{ critiqueId: string; postId: string; isDeleted: boolean } | null> {
  try {
    const { data: replyRow, error: replyErr } = await supabase
      .from('critique_replies')
      .select('id, critique_id, deleted_at')
      .eq('id', replyId)
      .maybeSingle();

    if (replyErr || !replyRow) return null;

    const { data: reviewRow } = await supabase
      .from('reviews')
      .select('id, post_id')
      .eq('id', replyRow.critique_id)
      .maybeSingle();

    if (!reviewRow) return null;

    return {
      critiqueId: replyRow.critique_id,
      postId: reviewRow.post_id,
      isDeleted: Boolean(replyRow.deleted_at),
    };
  } catch (err) {
    console.error('Error resolving reply context:', err);
    return null;
  }
}

/**
 * Resolve the display name for a review's author.
 */
export function getReviewerName(review: Review): string {
  return review.author?.name || review.reviewer_name || 'Anonymous';
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

// ─── Critique Replies ─────────────────────────────────────────────────────────

/**
 * Fetch replies for a critique with cursor-based pagination.
 */
export async function fetchCritiqueReplies(
  critiqueId: string,
  cursor?: string,
  limit: number = 3,
  targetReplyId?: string
): Promise<CritiqueRepliesResponse> {
  const url = new URL(`/api/critiques/${critiqueId}/replies`, window.location.origin);
  url.searchParams.set('limit', String(limit));
  if (cursor) url.searchParams.set('cursor', cursor);
  if (targetReplyId) url.searchParams.set('targetReplyId', targetReplyId);

  const res = await fetch(url.toString());
  if (!res.ok) {
    throw new Error('Failed to fetch replies');
  }
  const data = await res.json();
  return data.data as CritiqueRepliesResponse;
}

/**
 * Submit a new threaded reply to a critique or to another reply.
 */
export async function submitCritiqueReply(
  critiqueId: string,
  content: string,
  parentReplyId?: string
): Promise<{ ok: boolean; reply?: CritiqueReply; error?: string }> {
  let token = null;
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    token = sessionData?.session?.access_token;
  } catch (err) {
    console.warn('Could not fetch session locally.', err);
  }

  if (!token) {
    return { ok: false, error: 'You must be logged in to reply.' };
  }

  try {
    const res = await fetch(`/api/critiques/${critiqueId}/replies`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content, parent_reply_id: parentReplyId }),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      return { ok: false, error: data?.error || 'Failed to submit reply' };
    }

    return { ok: true, reply: data.data as CritiqueReply };
  } catch (err: any) {
    console.error('Error submitting reply:', err);
    return { ok: false, error: err.message || 'Network error' };
  }
}

/**
 * Soft-delete a critique reply.
 */
export async function deleteCritiqueReply(
  replyId: string
): Promise<{ ok: boolean; error?: string }> {
  let token = null;
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    token = sessionData?.session?.access_token;
  } catch (err) {
    console.warn('Could not fetch session locally.', err);
  }

  if (!token) {
    return { ok: false, error: 'You must be logged in to delete a reply.' };
  }

  try {
    const res = await fetch(`/api/critiques/replies/${replyId}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      return { ok: false, error: data?.error || 'Failed to delete reply' };
    }

    return { ok: true };
  } catch (err: any) {
    console.error('Error deleting reply:', err);
    return { ok: false, error: err.message || 'Network error' };
  }
}

/**
 * Mark a critique reply thread as read for the current user.
 */
export async function markCritiqueThreadAsRead(critiqueId: string): Promise<void> {
  let token = null;
  try {
    const { data: sessionData } = await supabase.auth.getSession();
    token = sessionData?.session?.access_token;
  } catch {
    return;
  }

  if (!token) return;

  try {
    await fetch(`/api/critiques/${critiqueId}/read`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    // Non-blocking
  }
}

