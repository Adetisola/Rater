"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  getFeedbackBoard, 
  toggleFeedbackVote, 
  toggleFeedbackFollow,
  type GetFeedbackBoardParams
} from '@/lib/feedback/server';
import type { FeedbackRequest } from '@/types';
import { useAuthState } from '@/context/AuthContext';
import { showToast } from '@/components/GlobalOverlays';

export function useFeedback({
  type = 'All',
  status = 'All',
  category = 'All',
  searchQuery = '',
  sortBy = 'Most Upvoted',
  view = 'all',
}: Omit<GetFeedbackBoardParams, 'userId' | 'cursor' | 'limit'>) {
  const { currentProfile } = useAuthState();
  const [feedback, setFeedback] = useState<FeedbackRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nextCursorRef = useRef<{ created_at?: string; upvote_count?: number; id?: string } | null>(null);
  const requestSeqRef = useRef<number>(0);

  const fetchInitial = useCallback(async () => {
    const seq = ++requestSeqRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const res = await getFeedbackBoard({
        type,
        status,
        category,
        searchQuery,
        sortBy,
        view,
        userId: currentProfile?.id || null,
        cursor: null,
        limit: 20,
      });

      // Discard stale responses from fast typing/filtering
      if (seq !== requestSeqRef.current) return;

      setFeedback(res.items);
      nextCursorRef.current = res.nextCursor;
      setHasMore(res.hasMore);
    } catch (err: any) {
      if (seq !== requestSeqRef.current) return;
      setError(err?.message || 'Failed to load feedback');
    } finally {
      if (seq === requestSeqRef.current) {
        setIsLoading(false);
      }
    }
  }, [type, status, category, searchQuery, sortBy, view, currentProfile?.id]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  const loadMore = async () => {
    if (isLoadingMore || !hasMore || !nextCursorRef.current) return;

    setIsLoadingMore(true);
    try {
      const res = await getFeedbackBoard({
        type,
        status,
        category,
        searchQuery,
        sortBy,
        view,
        userId: currentProfile?.id || null,
        cursor: nextCursorRef.current,
        limit: 20,
      });

      setFeedback(prev => [...prev, ...res.items]);
      nextCursorRef.current = res.nextCursor;
      setHasMore(res.hasMore);
    } catch (err: any) {
      showToast('Failed to load more feedback.', 'error');
    } finally {
      setIsLoadingMore(false);
    }
  };

  /**
   * Optimistic Voting with Automatic Rollback
   */
  const toggleVote = async (requestId: string) => {
    if (!currentProfile) {
      showToast('Please sign in to upvote feedback.', 'info');
      return;
    }

    const target = feedback.find(f => f.id === requestId);
    if (!target) return;

    const wasVoted = !!target.has_voted;
    const oldVoteCount = target.upvote_count ?? 0;
    const newVoteCount = wasVoted ? Math.max(0, oldVoteCount - 1) : oldVoteCount + 1;

    // Optimistic state update
    setFeedback(prev =>
      prev.map(item =>
        item.id === requestId
          ? { ...item, has_voted: !wasVoted, upvote_count: newVoteCount }
          : item
      )
    );

    const { success, newVoteState } = await toggleFeedbackVote(requestId, currentProfile.id, wasVoted);

    // Rollback on network/db failure
    if (!success || newVoteState === wasVoted) {
      setFeedback(prev =>
        prev.map(item =>
          item.id === requestId
            ? { ...item, has_voted: wasVoted, upvote_count: oldVoteCount }
            : item
        )
      );
      showToast('Failed to update vote. Please check your connection.', 'error');
    }
  };

  /**
   * Optimistic Following with Automatic Rollback
   */
  const toggleFollow = async (requestId: string) => {
    if (!currentProfile) {
      showToast('Please sign in to follow feedback requests.', 'info');
      return;
    }

    const target = feedback.find(f => f.id === requestId);
    if (!target) return;

    const wasFollowing = !!target.is_following;
    const oldFollowCount = target.follow_count ?? 0;
    const newFollowCount = wasFollowing ? Math.max(0, oldFollowCount - 1) : oldFollowCount + 1;

    // Optimistic state update
    setFeedback(prev =>
      prev.map(item =>
        item.id === requestId
          ? { ...item, is_following: !wasFollowing, follow_count: newFollowCount }
          : item
      )
    );

    const { success, newFollowState } = await toggleFeedbackFollow(requestId, currentProfile.id, wasFollowing);

    // Rollback on network/db failure
    if (!success || newFollowState === wasFollowing) {
      setFeedback(prev =>
        prev.map(item =>
          item.id === requestId
            ? { ...item, is_following: wasFollowing, follow_count: oldFollowCount }
            : item
        )
      );
      showToast('Failed to update follow status.', 'error');
    } else {
      showToast(
        newFollowState ? 'Following request! You will be notified of status updates.' : 'Unfollowed request.',
        'success'
      );
    }
  };

  return {
    feedback,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    loadMore,
    refetch: fetchInitial,
    toggleVote,
    toggleFollow,
  };
}
