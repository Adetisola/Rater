import { supabase } from '@/lib/supabase/client';
import type { FeedbackRequest, FeedbackComment } from '@/types';

export interface GetFeedbackBoardParams {
  type?: string;
  status?: string;
  category?: string;
  searchQuery?: string;
  sortBy?: 'Most Upvoted' | 'Newest' | 'Recently Active';
  view?: 'all' | 'roadmap' | 'following' | 'my_feedback';
  userId?: string | null;
  cursor?: { created_at?: string; upvote_count?: number; id?: string } | null;
  limit?: number;
}

export interface FeedbackBoardResponse {
  items: FeedbackRequest[];
  nextCursor: { created_at?: string; upvote_count?: number; id?: string } | null;
  hasMore: boolean;
  totalCount?: number;
}

/**
 * Fetch feedback board items with cursor pagination and rich filters
 */
export async function getFeedbackBoard({
  type = 'All',
  status = 'All',
  category = 'All',
  searchQuery = '',
  sortBy = 'Most Upvoted',
  view = 'all',
  userId = null,
  cursor = null,
  limit = 20,
}: GetFeedbackBoardParams): Promise<FeedbackBoardResponse> {
  let query = supabase
    .from('feedback_requests_with_stats')
    .select('*, author:profiles!feedback_requests_author_id_fkey(name, username, avatar_url, bg_color)');

  // 1. View-based Filtering
  if (view === 'my_feedback') {
    if (!userId) return { items: [], nextCursor: null, hasMore: false };
    query = query.eq('author_id', userId);
  } else if (view === 'following') {
    if (!userId) return { items: [], nextCursor: null, hasMore: false };
    const { data: followRows } = await supabase
      .from('feedback_follows')
      .select('request_id')
      .eq('user_id', userId);

    const followedIds = (followRows || []).map(f => f.request_id);
    if (followedIds.length === 0) return { items: [], nextCursor: null, hasMore: false };
    query = query.in('id', followedIds);
  } else if (view === 'roadmap') {
    // Only active roadmap items
    if (status === 'All') {
      query = query.in('status', ['Under Review', 'Planned', 'In Progress', 'Completed']);
    }
  }

  // 2. Filter by Type
  if (type !== 'All') {
    query = query.eq('type', type);
  }

  // 3. Filter by Status (if not All)
  if (status !== 'All') {
    query = query.eq('status', status);
  }

  // 4. Filter by Category
  if (category !== 'All') {
    query = query.eq('category', category);
  }

  // 5. Text Search (Debounced on caller side)
  if (searchQuery && searchQuery.trim().length > 0) {
    const term = searchQuery.trim();
    query = query.or(`title.ilike.%${term}%,description.ilike.%${term}%`);
  }

  // 6. Sorting & Cursor Pagination
  if (sortBy === 'Most Upvoted') {
    query = query
      .order('is_pinned', { ascending: false, nullsFirst: false })
      .order('upvote_count', { ascending: false })
      .order('created_at', { ascending: false });

    if (cursor?.upvote_count !== undefined && cursor?.id) {
      query = query.lt('upvote_count', cursor.upvote_count);
    }
  } else if (sortBy === 'Newest') {
    query = query
      .order('is_pinned', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (cursor?.created_at) {
      query = query.lt('created_at', cursor.created_at);
    }
  } else if (sortBy === 'Recently Active') {
    query = query
      .order('is_pinned', { ascending: false, nullsFirst: false })
      .order('updated_at', { ascending: false });

    if (cursor?.created_at) {
      query = query.lt('updated_at', cursor.created_at);
    }
  }

  // Fetch limit + 1 to detect hasMore
  query = query.limit(limit + 1);

  const { data, error } = await query;

  if (error || !data) {
    console.error('[Feedback] getFeedbackBoard error:', error);
    return { items: [], nextCursor: null, hasMore: false };
  }

  const hasMore = data.length > limit;
  const items = hasMore ? data.slice(0, limit) : data;

  // 7. Resolve user votes and follows if authenticated
  if (userId && items.length > 0) {
    const itemIds = items.map(i => i.id);

    const [votesRes, followsRes] = await Promise.all([
      supabase
        .from('feedback_votes')
        .select('request_id')
        .eq('user_id', userId)
        .in('request_id', itemIds),
      supabase
        .from('feedback_follows')
        .select('request_id')
        .eq('user_id', userId)
        .in('request_id', itemIds),
    ]);

    const votedSet = new Set((votesRes.data || []).map(v => v.request_id));
    const followedSet = new Set((followsRes.data || []).map(f => f.request_id));

    items.forEach((item: any) => {
      item.has_voted = votedSet.has(item.id);
      item.is_following = followedSet.has(item.id);
    });
  }

  // Calculate next cursor
  let nextCursor = null;
  if (hasMore && items.length > 0) {
    const lastItem = items[items.length - 1];
    nextCursor = {
      id: lastItem.id,
      upvote_count: lastItem.upvote_count ?? 0,
      created_at: lastItem.created_at ?? undefined,
    };
  }

  return {
    items: items as FeedbackRequest[],
    nextCursor,
    hasMore,
  };
}

/**
 * Fetch top 5 popular active requests within the last 90 days
 */
export async function getPopularFeedback(userId?: string | null): Promise<FeedbackRequest[]> {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  let query = supabase
    .from('feedback_requests_with_stats')
    .select('*, author:profiles!feedback_requests_author_id_fkey(name, username, avatar_url, bg_color)')
    .not('status', 'in', '("Declined","Resolved Duplicate","Completed")')
    .gte('created_at', ninetyDaysAgo.toISOString())
    .order('upvote_count', { ascending: false })
    .order('comment_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(5);

  const { data, error } = await query;

  if (error || !data) {
    console.error('[Feedback] getPopularFeedback error:', error);
    return [];
  }

  if (userId && data.length > 0) {
    const itemIds = data.map(i => i.id);
    const { data: voteRows } = await supabase
      .from('feedback_votes')
      .select('request_id')
      .eq('user_id', userId)
      .in('request_id', itemIds);

    const votedSet = new Set((voteRows || []).map(v => v.request_id));
    data.forEach((item: any) => {
      item.has_voted = votedSet.has(item.id);
    });
  }

  return data as FeedbackRequest[];
}

/**
 * Live similarity search for non-blocking duplicate detection
 */
export async function checkSimilarFeedback(title: string): Promise<FeedbackRequest[]> {
  const trimmed = title.trim();
  if (trimmed.length < 8) return [];

  const { data, error } = await supabase
    .from('feedback_requests_with_stats')
    .select('id, title, slug, status, upvote_count, category')
    .or(`title.ilike.%${trimmed}%`)
    .order('upvote_count', { ascending: false })
    .limit(3);

  if (error || !data) {
    return [];
  }

  return data as FeedbackRequest[];
}

/**
 * Atomic Vote / Unvote with Database Enforcement
 */
export async function toggleFeedbackVote(
  requestId: string,
  userId: string,
  currentlyVoted: boolean
): Promise<{ success: boolean; newVoteState: boolean }> {
  try {
    if (currentlyVoted) {
      const { error } = await supabase
        .from('feedback_votes')
        .delete()
        .eq('request_id', requestId)
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true, newVoteState: false };
    } else {
      const { error } = await supabase
        .from('feedback_votes')
        .insert({
          request_id: requestId,
          user_id: userId,
        });

      if (error) throw error;
      return { success: true, newVoteState: true };
    }
  } catch (err) {
    console.error('[Feedback] toggleFeedbackVote failed:', err);
    return { success: false, newVoteState: currentlyVoted };
  }
}

/**
 * Atomic Follow / Unfollow with Database Enforcement
 */
export async function toggleFeedbackFollow(
  requestId: string,
  userId: string,
  currentlyFollowing: boolean
): Promise<{ success: boolean; newFollowState: boolean }> {
  try {
    if (currentlyFollowing) {
      const { error } = await supabase
        .from('feedback_follows')
        .delete()
        .eq('request_id', requestId)
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true, newFollowState: false };
    } else {
      const { error } = await supabase
        .from('feedback_follows')
        .insert({
          request_id: requestId,
          user_id: userId,
        });

      if (error) throw error;
      return { success: true, newFollowState: true };
    }
  } catch (err) {
    console.error('[Feedback] toggleFeedbackFollow failed:', err);
    return { success: false, newFollowState: currentlyFollowing };
  }
}

/**
 * Add Plaintext Comment
 */
export async function addFeedbackComment(
  requestId: string,
  _userId: string,
  content: string
): Promise<{ data: FeedbackComment | null; error: string | null }> {
  const sanitized = content.trim().slice(0, 1000);
  if (!sanitized) return { data: null, error: 'Comment cannot be empty' };

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return { data: null, error: 'You must be signed in to post a comment.' };
    }

    const res = await fetch('/api/feedback/comment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        requestId,
        content: sanitized,
      }),
    });

    const json = await res.json();
    if (!res.ok || !json.ok) {
      return { data: null, error: json.error || 'Failed to post comment.' };
    }

    return { data: json.data as FeedbackComment, error: null };
  } catch (err: any) {
    console.error('[Feedback] addFeedbackComment error:', err);
    return { data: null, error: err?.message || 'Network error posting comment.' };
  }
}

/**
 * Soft Delete Comment
 */
export async function softDeleteFeedbackComment(
  commentId: string,
  userId: string
): Promise<{ success: boolean; error: string | null }> {
  const { error } = await supabase
    .from('feedback_comments')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId,
    })
    .eq('id', commentId)
    .eq('author_id', userId);

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true, error: null };
}
