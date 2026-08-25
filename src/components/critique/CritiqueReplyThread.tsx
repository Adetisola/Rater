"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronUp, MessageSquare, Loader2 } from 'lucide-react';
import { CritiqueReplyItem } from './CritiqueReplyItem';
import { ReplyComposer } from './ReplyComposer';
import { fetchCritiqueReplies, submitCritiqueReply, deleteCritiqueReply, markCritiqueThreadAsRead } from '@/lib/reviews';
import { showToast } from '@/components/GlobalOverlays';
import { useAuthState } from '@/context/AuthContext';
import type { Review, CritiqueReply, Post } from '@/types';

interface CritiqueReplyThreadProps {
  critique: Review;
  post: Post;
  initialExpanded?: boolean;
  targetReplyId?: string | null;
  onOpenReportModal?: (targetType: 'reply', targetId: string) => void;
}

export function CritiqueReplyThread({
  critique,
  post,
  initialExpanded = false,
  targetReplyId = null,
  onOpenReportModal,
}: CritiqueReplyThreadProps) {
  const { currentProfile } = useAuthState();
  const [isExpanded, setIsExpanded] = useState(initialExpanded || Boolean(targetReplyId));
  const [replies, setReplies] = useState<CritiqueReply[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);
  const [replyCount, setReplyCount] = useState(critique.reply_count || 0);
  const [hasUnread, setHasUnread] = useState(critique.has_unread_replies || false);
  const [replyingTo, setReplyingTo] = useState<{ username: string; name?: string; replyId?: string } | null>(null);
  const [highlightedReplyId, setHighlightedReplyId] = useState<string | null>(targetReplyId);

  const threadContainerRef = useRef<HTMLDivElement>(null);

  // Sync prop changes
  useEffect(() => {
    if (critique.reply_count !== undefined) {
      setReplyCount(critique.reply_count);
    }
  }, [critique.reply_count]);

  useEffect(() => {
    if (critique.has_unread_replies !== undefined) {
      setHasUnread(critique.has_unread_replies);
    }
  }, [critique.has_unread_replies]);

  // Load initial page of replies
  const loadInitialReplies = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetchCritiqueReplies(critique.id, undefined, 3);
      setReplies(res.replies);
      setNextCursor(res.nextCursor);
      setReplyCount(res.totalCount);
      setHasFetched(true);

      // Mark read in background
      markCritiqueThreadAsRead(critique.id);
      setHasUnread(false);
    } catch (err: any) {
      console.error('Failed to load critique replies:', err);
      showToast('Could not load replies. Try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [critique.id]);

  // Auto-expand and fetch if targetReplyId is present
  useEffect(() => {
    if (targetReplyId) {
      setIsExpanded(true);
      if (!hasFetched) {
        loadInitialReplies();
      }
    }
  }, [targetReplyId, hasFetched, loadInitialReplies]);

  // Handle deep-link scrolling
  useEffect(() => {
    if (highlightedReplyId && replies.length > 0) {
      const el = document.getElementById(`reply-${highlightedReplyId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const timer = setTimeout(() => setHighlightedReplyId(null), 4000);
        return () => clearTimeout(timer);
      }
    }
  }, [highlightedReplyId, replies]);

  // Expand / collapse toggle
  const handleToggleExpand = async () => {
    if (!isExpanded) {
      setIsExpanded(true);
      if (!hasFetched) {
        await loadInitialReplies();
      } else {
        markCritiqueThreadAsRead(critique.id);
        setHasUnread(false);
      }
    } else {
      setIsExpanded(false);
      setReplyingTo(null);
    }
  };

  // Click direct reply action
  const handleOpenComposer = async () => {
    if (!isExpanded) {
      setIsExpanded(true);
      if (!hasFetched) {
        await loadInitialReplies();
      }
    }
    const critiqueAuthorUsername = critique.author?.username;
    if (critiqueAuthorUsername && critiqueAuthorUsername !== currentProfile?.username) {
      setReplyingTo({
        username: critiqueAuthorUsername,
        name: critique.author?.name,
      });
    } else {
      setReplyingTo(null);
    }
  };

  // Reply to another reply
  const handleReplyToItem = (item: CritiqueReply) => {
    if (!isExpanded) setIsExpanded(true);
    setReplyingTo({
      username: item.author?.username || 'creative',
      name: item.author?.name,
      replyId: item.id,
    });
  };

  // Load next page of replies (cursor pagination)
  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    try {
      setIsLoadingMore(true);
      const res = await fetchCritiqueReplies(critique.id, nextCursor, 10);
      setReplies((prev) => [...prev, ...res.replies]);
      setNextCursor(res.nextCursor);
    } catch (err: any) {
      console.error('Failed to load more replies:', err);
      showToast('Could not load more replies.', 'error');
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Submit reply with Optimistic UI
  const handleSubmitReply = async (content: string, parentReplyId?: string) => {
    if (!currentProfile) return;

    const tempId = `temp_${Date.now()}`;
    const optimisticReply: CritiqueReply = {
      id: tempId,
      critique_id: critique.id,
      author_id: currentProfile.id,
      parent_reply_id: parentReplyId || null,
      parent_reply_author_username: replyingTo?.username || null,
      parent_reply_author_name: replyingTo?.name || null,
      content,
      created_at: new Date().toISOString(),
      author: currentProfile,
      has_children: false,
      is_tombstone: false,
      is_optimistic: true,
    };

    // 1. Optimistically append reply and increment count
    setReplies((prev) => [...prev, optimisticReply]);
    setReplyCount((prev) => prev + 1);
    setIsSubmitting(true);

    try {
      // 2. Dispatch to server
      const result = await submitCritiqueReply(critique.id, content, parentReplyId);

      if (!result.ok || !result.reply) {
        throw new Error(result.error || 'Failed to post reply.');
      }

      // 3. Swap temp with persisted reply
      setReplies((prev) =>
        prev.map((r) => (r.id === tempId ? result.reply! : r))
      );
      showToast('Reply posted', 'success');
    } catch (err: any) {
      // Rollback on error
      setReplies((prev) => prev.filter((r) => r.id !== tempId));
      setReplyCount((prev) => Math.max(prev - 1, 0));
      showToast(err.message || 'Failed to post reply', 'error');
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete reply
  const handleDeleteReply = async (replyId: string) => {
    try {
      const result = await deleteCritiqueReply(replyId);
      if (!result.ok) {
        showToast(result.error || 'Failed to delete reply', 'error');
        return;
      }

      // Check if deleted reply has child replies in current list
      const hasChildren = replies.some((r) => r.parent_reply_id === replyId && !r.deleted_at);

      if (hasChildren) {
        // Convert to tombstone
        setReplies((prev) =>
          prev.map((r) =>
            r.id === replyId
              ? { ...r, is_tombstone: true, content: 'This reply was deleted.', deleted_at: new Date().toISOString() }
              : r
          )
        );
      } else {
        // Remove completely
        setReplies((prev) => prev.filter((r) => r.id !== replyId));
        setReplyCount((prev) => Math.max(prev - 1, 0));
      }

      showToast('Reply deleted', 'success');
    } catch {
      showToast('Failed to delete reply', 'error');
    }
  };

  // Report reply
  const handleReportReply = (replyId: string) => {
    if (onOpenReportModal) {
      onOpenReportModal('reply', replyId);
    } else {
      showToast('Reporting reply...', 'info');
    }
  };

  // Gather participants for @ autocomplete
  const participants = useMemo(() => {
    const map = new Map<string, { id?: string; username: string; name: string; avatar_url?: string | null }>();

    if (critique.author?.username) {
      map.set(critique.author.username.toLowerCase(), {
        id: critique.author.id,
        username: critique.author.username,
        name: critique.author.name,
        avatar_url: critique.author.avatar_url,
      });
    }

    if (post.author?.username) {
      map.set(post.author.username.toLowerCase(), {
        id: post.author.id,
        username: post.author.username,
        name: post.author.name,
        avatar_url: post.author.avatar_url,
      });
    }

    replies.forEach((r) => {
      if (r.author?.username) {
        map.set(r.author.username.toLowerCase(), {
          id: r.author.id,
          username: r.author.username,
          name: r.author.name,
          avatar_url: r.author.avatar_url,
        });
      }
    });

    return Array.from(map.values());
  }, [critique.author, post.author, replies]);

  return (
    <div ref={threadContainerRef} className="w-full mt-2 pt-2 border-t border-gray-100/80">
      {/* Collapsed / Expand Control Bar */}
      <div className="flex items-center justify-between text-xs font-medium text-gray-500">
        <div className="flex items-center gap-2">
          {replyCount > 0 ? (
            <button
              type="button"
              onClick={handleToggleExpand}
              className="inline-flex items-center gap-1.5 hover:text-black transition-colors focus:outline-none py-1 group/btn"
            >
              <MessageSquare className="w-3.5 h-3.5 text-gray-400 group-hover/btn:text-black transition-colors" />
              <span>
                {isExpanded ? 'Hide replies' : `View ${replyCount} ${replyCount === 1 ? 'reply' : 'replies'}`}
              </span>
              {isExpanded ? (
                <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              )}
            </button>
          ) : null}

          {/* Unread "New replies" badge */}
          {hasUnread && !isExpanded && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold tracking-tight animate-in fade-in duration-200">
              New replies
            </span>
          )}
        </div>

        {/* Minimal Reply trigger button */}
        {!isExpanded && (
          <button
            type="button"
            onClick={handleOpenComposer}
            className="hover:text-primary font-medium text-xs transition-colors focus:outline-none py-1 ml-auto"
          >
            Reply
          </button>
        )}
      </div>

      {/* Expanded Thread Content */}
      {isExpanded && (
        <div className="mt-3 space-y-2.5 pl-2 sm:pl-4 border-l-2 border-primary/20 animate-in fade-in duration-200">
          {isLoading ? (
            <div className="py-4 flex items-center justify-center gap-2 text-xs text-gray-400 font-medium">
              <Loader2 className="w-4 h-4 animate-spin text-primary" />
              <span>Loading discussion...</span>
            </div>
          ) : replies.length === 0 ? (
            <div className="py-2 text-xs text-gray-400 italic">
              No replies yet. Start the conversation.
            </div>
          ) : (
            <>
              {replies.map((reply) => (
                <CritiqueReplyItem
                  key={reply.id}
                  reply={reply}
                  currentUserId={currentProfile?.id}
                  isAdmin={Boolean(currentProfile?.is_admin)}
                  onReplyTo={handleReplyToItem}
                  onDelete={handleDeleteReply}
                  onReport={handleReportReply}
                  isHighlighted={highlightedReplyId === reply.id}
                />
              ))}

              {nextCursor && (
                <div className="pt-1 pb-1">
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="text-xs font-semibold text-primary hover:text-[#E5B011] disabled:text-gray-400 flex items-center gap-1.5 focus:outline-none transition-colors"
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Loading more...</span>
                      </>
                    ) : (
                      <>
                        <span>Show more replies</span>
                        <ChevronDown className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              )}
            </>
          )}

          {/* Reply Composer */}
          <ReplyComposer
            critiqueId={critique.id}
            replyingTo={replyingTo}
            onClearReplyingTo={() => setReplyingTo(null)}
            onSubmitReply={handleSubmitReply}
            isSubmitting={isSubmitting}
            participants={participants}
          />
        </div>
      )}
    </div>
  );
}
