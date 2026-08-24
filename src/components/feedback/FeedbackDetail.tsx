"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase/client';
import { 
  ChevronUp, 
  ChevronLeft, 
  MessageSquare, 
  Bookmark, 
  BookmarkCheck, 
  Lock, 
  Pin, 
  Trash2, 
  Loader2, 
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuthState } from '@/context/AuthContext';
import { UserAvatar } from '../UserAvatar';
import { Button } from '../ui/Button';
import { AuthOverlay } from '../AuthOverlay';
import { showToast } from '@/components/GlobalOverlays';
import { formatDistanceToNow, parseISO, isValid } from 'date-fns';
import { 
  toggleFeedbackVote, 
  toggleFeedbackFollow, 
  addFeedbackComment, 
  softDeleteFeedbackComment 
} from '@/lib/feedback/server';
import type { FeedbackRequest, FeedbackComment } from '@/types';
import { cn } from '@/lib/utils';

interface FeedbackDetailProps {
  slug: string;
}

export function FeedbackDetail({ slug }: FeedbackDetailProps) {
  const [request, setRequest] = useState<FeedbackRequest | null>(null);
  const [comments, setComments] = useState<FeedbackComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  
  const { currentProfile } = useAuthState();

  const formatRelativeTime = (isoString?: string | null) => {
    if (!isoString) return '';
    try {
      const date = parseISO(isoString);
      if (!isValid(date)) return '';
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return '';
    }
  };

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Fetch Request with Author
        const { data: reqData, error: reqError } = await supabase
          .from('feedback_requests_with_stats')
          .select('*, author:profiles!feedback_requests_author_id_fkey(name, username, avatar_url, bg_color)')
          .eq('slug', slug)
          .single();

        if (reqError || !reqData) {
          throw new Error('Feedback request not found.');
        }

        if (!isMounted) return;

        let hasVoted = false;
        let isFollowing = false;

        // 2. Fetch User Vote & Follow Status
        if (currentProfile) {
          const [voteRes, followRes] = await Promise.all([
            supabase
              .from('feedback_votes')
              .select('request_id')
              .eq('request_id', reqData.id)
              .eq('user_id', currentProfile.id)
              .maybeSingle(),
            supabase
              .from('feedback_follows')
              .select('request_id')
              .eq('request_id', reqData.id)
              .eq('user_id', currentProfile.id)
              .maybeSingle(),
          ]);

          hasVoted = !!voteRes.data;
          isFollowing = !!followRes.data;
        }

        setRequest({
          ...reqData,
          has_voted: hasVoted,
          is_following: isFollowing,
        } as FeedbackRequest);

        // 3. Fetch Comments
        const { data: commentsData } = await supabase
          .from('feedback_comments')
          .select('*, author:profiles!feedback_comments_author_id_fkey(name, username, avatar_url, bg_color)')
          .eq('request_id', reqData.id)
          .order('created_at', { ascending: true });

        if (isMounted && commentsData) {
          setComments(commentsData as FeedbackComment[]);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to load feedback details.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, [slug, currentProfile]);

  const handleVote = async () => {
    if (!currentProfile || !request || !request.id) {
      showToast('Please sign in to upvote feedback.', 'info');
      return;
    }

    const wasVoted = !!request.has_voted;
    const oldCount = request.upvote_count ?? 0;
    const newCount = wasVoted ? Math.max(0, oldCount - 1) : oldCount + 1;

    setRequest(prev => prev ? { ...prev, has_voted: !wasVoted, upvote_count: newCount } : null);

    const { success, newVoteState } = await toggleFeedbackVote(request.id, currentProfile.id, wasVoted);
    if (!success || newVoteState === wasVoted) {
      setRequest(prev => prev ? { ...prev, has_voted: wasVoted, upvote_count: oldCount } : null);
      showToast('Vote failed. Please check your connection.', 'error');
    }
  };

  const handleFollow = async () => {
    if (!currentProfile || !request || !request.id) {
      showToast('Please sign in to follow feedback requests.', 'info');
      return;
    }

    const wasFollowing = !!request.is_following;
    const oldCount = request.follow_count ?? 0;
    const newCount = wasFollowing ? Math.max(0, oldCount - 1) : oldCount + 1;

    setRequest(prev => prev ? { ...prev, is_following: !wasFollowing, follow_count: newCount } : null);

    const { success, newFollowState } = await toggleFeedbackFollow(request.id, currentProfile.id, wasFollowing);
    if (!success || newFollowState === wasFollowing) {
      setRequest(prev => prev ? { ...prev, is_following: wasFollowing, follow_count: oldCount } : null);
      showToast('Failed to update follow status.', 'error');
    } else {
      showToast(
        newFollowState ? 'Following request! You will receive notifications on status updates.' : 'Unfollowed request.',
        'success'
      );
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentProfile || !request || !request.id) return;

    if (request.is_locked) {
      showToast('Discussion is closed for this feedback request.', 'info');
      return;
    }

    setIsSubmittingComment(true);
    const content = newComment.trim();

    try {
      const { data, error: err } = await addFeedbackComment(request.id, currentProfile.id, content);
      if (err || !data) {
        throw new Error(err || 'Failed to submit comment');
      }

      setComments(prev => [...prev, data]);
      setRequest(prev => prev ? { ...prev, comment_count: (prev.comment_count ?? 0) + 1 } : null);
      setNewComment('');
      showToast('Comment posted!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to post comment.', 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!currentProfile) return;

    const { success, error: err } = await softDeleteFeedbackComment(commentId, currentProfile.id);
    if (!success) {
      showToast(err || 'Failed to delete comment.', 'error');
      return;
    }

    setComments(prev =>
      prev.map(c =>
        c.id === commentId
          ? { ...c, deleted_at: new Date().toISOString(), deleted_by: currentProfile.id }
          : c
      )
    );
    showToast('Comment deleted.', 'success');
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-gray-400 space-y-3">
        <Loader2 size={24} className="animate-spin text-primary mx-auto" />
        <p className="text-xs font-semibold">Loading feedback details...</p>
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="max-w-4xl mx-auto py-16 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mx-auto">
          <AlertCircle size={24} />
        </div>
        <h2 className="text-lg font-bold text-gray-950">Feedback Request Not Found</h2>
        <p className="text-xs sm:text-sm text-gray-500 max-w-sm mx-auto">
          {error || "This feedback request may have been removed or does not exist."}
        </p>
        <Link href="/feedback">
          <Button variant="outline" className="h-9 px-4 rounded-xl text-xs font-bold mt-2">
            Back to Feedback Board
          </Button>
        </Link>
      </div>
    );
  }

  const isCompleted = request.status === 'Completed';
  const isPlanned = request.status === 'Planned';
  const isInProgress = request.status === 'In Progress';
  const isUnderReview = request.status === 'Under Review';
  const isDeclined = request.status === 'Declined';
  const isDuplicate = request.status === 'Resolved Duplicate';

  return (
    <div className="w-full max-w-4xl mx-auto py-4 sm:py-10 px-3.5 sm:px-6 space-y-4 sm:space-y-6 overflow-x-hidden min-w-0">
      {/* 1. Breadcrumb Navigation */}
      <Link
        href="/feedback"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-black transition-colors select-none"
      >
        <ChevronLeft size={16} />
        <span>Back to Feedback Board</span>
      </Link>

      {/* 2. Hero Request Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 p-4 sm:p-8 shadow-2xs space-y-3.5 sm:space-y-6 min-w-0">
        {/* Mobile Top Actions Row (< sm) */}
        <div className="flex sm:hidden items-center justify-between gap-2 min-w-0">
          {/* Mobile Upvote Button */}
          <button
            type="button"
            onClick={handleVote}
            className={cn(
              "h-8 px-3 rounded-full border flex items-center gap-1.5 transition-all shrink-0 select-none",
              request.has_voted
                ? "bg-amber-50 border-primary/60 text-black font-bold shadow-2xs"
                : "bg-white border-gray-200/80 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
            )}
            aria-label={`Upvote request (${request.upvote_count || 0} votes)`}
          >
            <ChevronUp size={16} strokeWidth={3} className={request.has_voted ? "text-primary" : ""} />
            <span className="text-xs font-bold">{request.upvote_count || 0}</span>
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            <span
              className={cn(
                "px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border shrink-0",
                isPlanned && "bg-blue-50 text-blue-700 border-blue-200/60",
                isInProgress && "bg-purple-50 text-purple-700 border-purple-200/60",
                isCompleted && "bg-emerald-50 text-emerald-700 border-emerald-200/60",
                isUnderReview && "bg-amber-50 text-amber-800 border-amber-200/60",
                isDeclined && "bg-red-50 text-red-700 border-red-200/60",
                isDuplicate && "bg-gray-100 text-gray-600 border-gray-200/60",
                (!request.status || request.status === 'New') && "bg-gray-50 text-gray-600 border-gray-200/60"
              )}
            >
              {request.status || 'New'}
            </span>

            {/* Mobile Follow Button */}
            <button
              type="button"
              onClick={handleFollow}
              className={cn(
                "h-8 px-2.5 rounded-full border text-xs font-semibold flex items-center gap-1 transition-all shrink-0",
                request.is_following
                  ? "bg-amber-50 border-amber-200/80 text-amber-900 shadow-2xs"
                  : "bg-white border-gray-200/80 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              )}
            >
              {request.is_following ? (
                <>
                  <BookmarkCheck size={13} className="text-primary" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <Bookmark size={13} />
                  <span>Follow</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex items-start gap-6">
          {/* Desktop Upvote Button (hidden on mobile) */}
          <button
            type="button"
            onClick={handleVote}
            className={cn(
              "hidden sm:flex w-14 sm:w-16 py-3 rounded-2xl border-2 flex-col items-center justify-center transition-all shrink-0 select-none shadow-2xs",
              request.has_voted
                ? "bg-amber-50 border-primary/60 text-black font-bold"
                : "bg-white border-gray-200/80 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
            )}
            aria-label={`Upvote request (${request.upvote_count || 0} votes)`}
          >
            <ChevronUp size={22} strokeWidth={3} className={request.has_voted ? "text-primary" : ""} />
            <span className="text-sm font-bold mt-0.5">{request.upvote_count || 0}</span>
          </button>

          {/* Header & Details */}
          <div className="flex-1 min-w-0 space-y-2.5 sm:space-y-3">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-lg sm:text-xl font-medium text-gray-950 leading-snug sm:leading-tight">
                {request.title}
              </h1>

              {/* Desktop Follow Button (hidden on mobile) */}
              <button
                type="button"
                onClick={handleFollow}
                className={cn(
                  "hidden sm:flex h-9 px-3 rounded-xl border text-xs font-semibold items-center gap-1.5 transition-all shrink-0 self-start",
                  request.is_following
                    ? "bg-amber-50 border-amber-200/80 text-amber-900 shadow-2xs"
                    : "bg-white border-gray-200/80 text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                )}
              >
                {request.is_following ? (
                  <>
                    <BookmarkCheck size={14} className="text-primary" />
                    <span>Following</span>
                  </>
                ) : (
                  <>
                    <Bookmark size={14} />
                    <span>Follow</span>
                  </>
                )}
              </button>
            </div>

            {/* Badges & Meta Row */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {request.is_pinned && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-bold bg-amber-100 text-amber-900">
                  <Pin size={11} />
                  <span>Pinned</span>
                </span>
              )}

              {request.is_locked && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-bold bg-gray-100 text-gray-700">
                  <Lock size={11} />
                  <span>Locked</span>
                </span>
              )}

              {/* Desktop Status Pill (hidden on mobile since it is on the top action bar) */}
              <span
                className={cn(
                  "hidden sm:inline-block px-2.5 py-1 rounded-full text-xs font-semibold tracking-wider border border-gray-300",
                  isPlanned && "bg-blue-50 text-blue-700 border-blue-200/60",
                  isInProgress && "bg-purple-50 text-purple-700 border-purple-200/60",
                  isCompleted && "bg-emerald-50 text-emerald-700 border-emerald-200/60",
                  isUnderReview && "bg-amber-50 text-amber-800 border-amber-200/60",
                  isDeclined && "bg-red-50 text-red-700 border-red-200/60",
                  isDuplicate && "bg-gray-100 text-gray-600 border-gray-200/60",
                  (!request.status || request.status === 'New') && "bg-gray-50 text-gray-600 border-gray-200/60"
                )}
              >
                {request.status || 'New'}
              </span>

              <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg text-[11px] sm:text-xs font-semibold bg-gray-100 text-gray-600">
                {request.category}
              </span>

              {request.author && (
                <span className="text-[11px] sm:text-xs text-gray-400">
                  by <span className="font-semibold text-gray-700">{request.author.name}</span>
                </span>
              )}

              <span className="text-[11px] sm:text-xs text-gray-400">
                {formatRelativeTime(request.created_at)}
              </span>
            </div>

            {/* Description Body */}
            <div className="pt-1 sm:pt-2 text-xs sm:text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
              {request.description}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Official Team Response Card (When Present) */}
      {request.official_response && (
        <div className="bg-amber-50/60 border border-primary/25 rounded-2xl sm:rounded-3xl p-4 sm:p-8 space-y-3 sm:space-y-3.5 shadow-2xs min-w-0 break-words">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Image
                src="/icons/rater-logo-white-bg-stroked.svg"
                alt="Rater Official"
                width={24}
                height={24}
                className="w-5.5 h-5.5 sm:w-6 sm:h-6 shrink-0 select-none"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs sm:text-[13px] font-medium text-gray-950">Official Team Response</h3>
                  <ShieldCheck size={14} className="text-primary" />
                </div>
                <p className="text-[10px] sm:text-[11px] text-gray-500">
                  Updated {formatRelativeTime(request.official_response_at)}
                </p>
              </div>
            </div>
          </div>

          <div className="text-xs sm:text-[13px] text-gray-800 whitespace-pre-wrap leading-relaxed break-words">
            {request.official_response}
          </div>
        </div>
      )}

      {/* 4. Discussion / Comments Card */}
      <div id="comments" className="bg-white rounded-2xl sm:rounded-3xl border border-gray-100 shadow-2xs overflow-hidden min-w-0">
        <div className="px-4 sm:px-6 py-3.5 sm:py-4.5 border-b border-gray-100 flex items-center justify-between bg-white">
          <h3 className="text-sm sm:text-base font-medium text-gray-950 flex items-center gap-2">
            <MessageSquare size={17} className="text-gray-400" />
            <span>Discussion ({comments.length})</span>
          </h3>
        </div>

        {/* Comment Thread List */}
        <div className="p-3.5 sm:p-6 space-y-3.5 sm:space-y-5">
          {comments.map((c) => {
            const isAuthor = currentProfile?.id === c.author_id;
            const isDeleted = !!c.deleted_at;

            return (
              <div key={c.id} className="flex items-start gap-2.5 sm:gap-3.5 group min-w-0">
                <UserAvatar avatarUrl={c.author?.avatar_url} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0 bg-gray-50/70 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-gray-100/70 break-words">
                  <div className="flex items-center justify-between gap-2 mb-1.5 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                      <span className="text-xs font-bold text-gray-900 truncate">
                        {c.author?.name || 'Community Member'}
                      </span>
                      <span className="text-[10px] sm:text-[11px] text-gray-400 shrink-0">
                        {formatRelativeTime(c.created_at)}
                      </span>
                    </div>

                    {isAuthor && !isDeleted && (
                      <button
                        type="button"
                        onClick={() => handleDeleteComment(c.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1 opacity-0 group-hover:opacity-100 shrink-0"
                        title="Delete comment"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  {isDeleted ? (
                    <p className="text-xs italic text-gray-400">Comment deleted by author.</p>
                  ) : (
                    <p className="text-xs sm:text-[13px] text-gray-800 whitespace-pre-wrap leading-relaxed break-words">
                      {c.content}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {comments.length === 0 && (
            <div className="py-6 sm:py-8 text-center text-gray-400 text-xs">
              No comments on this request yet. Be the first to join the conversation!
            </div>
          )}
        </div>

        {/* Comment Form or Locked Banner */}
        <div className="p-3.5 sm:p-5 bg-gray-50/70 border-t border-gray-100">
          {request.is_locked ? (
            <div className="p-3.5 bg-amber-50/60 border border-amber-200/50 rounded-2xl text-center space-y-1">
              <p className="text-xs font-bold text-amber-900 flex items-center justify-center gap-1.5">
                <Lock size={14} />
                <span>Discussion Closed</span>
              </p>
              <p className="text-[11px] text-amber-800">
                Comments are closed for this item, but you can still upvote and follow updates.
              </p>
            </div>
          ) : currentProfile ? (
            <form onSubmit={handleCommentSubmit} className="space-y-3">
              <div className="relative">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder={
                    currentProfile?.name
                      ? `${currentProfile.name}, what do you think?...`
                      : "What do you think?..."
                  }
                  maxLength={1000}
                  rows={3}
                  className="w-full min-h-[100px] rounded-xl border border-gray-200 bg-white px-4 pt-3 pb-8 text-xs sm:text-[13px] font-sans text-gray-950 placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none transition-all shadow-2xs"
                />
                <div
                  className={cn(
                    "absolute bottom-3 right-4 text-[10px] sm:text-xs font-medium pointer-events-none select-none transition-colors",
                    newComment.length >= 1000 ? "text-red-500 font-bold" : "text-gray-400"
                  )}
                >
                  {newComment.length} / 1000
                </div>
              </div>

              <div className="flex items-center justify-end">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={isSubmittingComment || !newComment.trim()}
                  className="h-10 px-5 rounded-full text-xs sm:text-[13px] font-medium flex items-center gap-1.5 shadow-2xs"
                >
                  {isSubmittingComment ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      <span>Post Comment</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          ) : (
            <div className="py-4 text-center space-y-2">
              <p className="text-xs text-gray-500">Sign in to join the discussion.</p>
              <Button 
                variant="outline" 
                onClick={() => setShowAuthOverlay(true)}
                className="h-8 px-4 rounded-full text-xs font-medium hover:bg-gray-100 transition-colors"
              >
                Sign In
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* In-place Sign In / Register Modal */}
      {showAuthOverlay && (
        <AuthOverlay
          initialTab="login"
          redirectOnSuccess={false}
          onClose={() => setShowAuthOverlay(false)}
        />
      )}
    </div>
  );
}
