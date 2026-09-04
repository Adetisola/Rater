"use client";

import { useState } from 'react';
import Link from 'next/link';
import { CornerDownRight, Loader2 } from 'lucide-react';
import { UserAvatar } from '@/components/UserAvatar';
import { MentionRenderer } from './MentionRenderer';
import { formatTimestamp, getFullTimestamp } from '@/utils/dateUtils';
import { useNow } from '@/context/TimeContext';
import type { CritiqueReply } from '@/types';

interface CritiqueReplyItemProps {
  reply: CritiqueReply;
  currentUserId?: string;
  postAuthorId?: string;
  isAdmin?: boolean;
  onReplyTo: (reply: CritiqueReply) => void;
  onDelete: (replyId: string) => Promise<void>;
  onReport: (replyId: string) => void;
  isHighlighted?: boolean;
}

export function CritiqueReplyItem({
  reply,
  currentUserId,
  postAuthorId,
  onReplyTo,
  onDelete,
  onReport,
  isHighlighted = false,
}: CritiqueReplyItemProps) {
  const now = useNow();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // If this reply is a tombstone
  if (reply.is_tombstone) {
    const isViolationRemoval = Boolean(reply.deleted_by && reply.deleted_by !== reply.author_id);
    return (
      <div
        id={`reply-${reply.id}`}
        className="w-full py-2.5 px-3 rounded-xl bg-surface-subtle border border-dashed border-border-default text-xs text-text-muted italic flex items-center gap-2"
      >
        <span>
          {isViolationRemoval
            ? 'This reply was removed due to community violations.'
            : 'This reply was deleted.'}
        </span>
      </div>
    );
  }

  const timeLabel = formatTimestamp(reply.created_at, now);
  const fullTime = getFullTimestamp(reply.created_at);
  const username = reply.author?.username;
  const displayName = reply.author?.name || (username ? `@${username}` : 'Creative');
  const isReplyOwner = currentUserId && reply.author_id === currentUserId;
  const canDelete = Boolean(isReplyOwner);
  const isPostAuthor = Boolean(postAuthorId && (reply.author_id === postAuthorId || reply.author?.id === postAuthorId));

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await onDelete(reply.id);
    } catch {
      setIsDeleting(false);
      setIsConfirmingDelete(false);
    }
  };

  return (
    <div
      id={`reply-${reply.id}`}
      className={`group/reply w-full rounded-2xl p-3.5 transition-all duration-300 ${
        isHighlighted
          ? 'bg-primary/5 ring-2 ring-primary/40 border border-primary/20'
          : 'bg-surface-subtle hover:bg-surface-interactive border border-border-subtle'
      } ${reply.is_optimistic ? 'opacity-70' : ''}`}
    >
      {/* Header: Author + Replying-to + Timestamp */}
      <div className="flex items-center gap-2.5 mb-2">
        {username ? (
          <Link
            href={`/@${username}`}
            scroll={false}
            onClick={(e) => e.stopPropagation()}
            className="shrink-0 rounded-full hover:ring-1 ring-primary focus:outline-none transition-all"
          >
            <UserAvatar
              avatarUrl={reply.author?.avatar_url}
              size="xs"
              className="w-6 h-6"
              iconClassName="w-3/4 h-3/4"
            />
          </Link>
        ) : (
          <div className="shrink-0">
            <UserAvatar
              avatarUrl={reply.author?.avatar_url}
              size="xs"
              className="w-6 h-6"
              iconClassName="w-3/4 h-3/4"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 min-w-0 flex-1">
          {username ? (
            <Link
              href={`/@${username}`}
              scroll={false}
              onClick={(e) => e.stopPropagation()}
              className="text-xs font-semibold text-text-primary hover:text-primary truncate transition-colors focus:outline-none"
            >
              {displayName}
            </Link>
          ) : (
            <span className="text-xs font-semibold text-text-primary truncate">{displayName}</span>
          )}

          {isPostAuthor && (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium tracking-tight bg-primary/20 text-text-primary border border-primary/30 select-none shrink-0">
              Author
            </span>
          )}

          {/* Contextual "Replying to @username" indicator */}
          {reply.parent_reply_author_username && (
            <div className="flex items-center gap-1 text-[11px] text-text-muted shrink-0">
              <CornerDownRight className="w-3 h-3 text-text-muted" />
              <span>replying to</span>
              <Link
                href={`/@${reply.parent_reply_author_username}`}
                scroll={false}
                onClick={(e) => e.stopPropagation()}
                className="font-medium text-text-secondary hover:text-primary transition-colors focus:outline-none"
              >
                @{reply.parent_reply_author_username}
              </Link>
            </div>
          )}

          <span 
            className="text-[11px] text-text-muted font-normal shrink-0" 
            title={fullTime}
            suppressHydrationWarning
          >
            {timeLabel}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="text-xs text-text-primary leading-relaxed pl-8.5 pr-1">
        <MentionRenderer content={reply.content} />
      </div>

      {/* Actions */}
      {!reply.is_optimistic && (
        <div className="flex items-center gap-3 mt-2 pl-8.5 text-[11px] font-medium text-text-muted">
          <button
            type="button"
            onClick={() => onReplyTo(reply)}
            className="hover:text-text-primary transition-colors focus:outline-none flex items-center gap-1"
          >
            <span>Reply</span>
          </button>

          {canDelete && (
            <>
              <span>•</span>
              {isConfirmingDelete ? (
                <div className="flex items-center gap-1.5 text-red-500 font-semibold animate-in fade-in duration-150">
                  {isDeleting ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <>
                      <span>Delete?</span>
                      <button
                        type="button"
                        onClick={handleDelete}
                        className="hover:underline text-red-400 focus:outline-none"
                      >
                        Yes
                      </button>
                      <span>/</span>
                      <button
                        type="button"
                        onClick={() => setIsConfirmingDelete(false)}
                        className="hover:underline text-text-muted font-normal focus:outline-none"
                      >
                        No
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="hover:text-red-500 transition-colors focus:outline-none"
                >
                  Delete
                </button>
              )}
            </>
          )}

          {!isReplyOwner && (
            <>
              <span>•</span>
              <button
                type="button"
                onClick={() => onReport(reply.id)}
                className="hover:text-red-500 transition-colors focus:outline-none"
              >
                Report
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
