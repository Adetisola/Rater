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
  isAdmin?: boolean;
  onReplyTo: (reply: CritiqueReply) => void;
  onDelete: (replyId: string) => Promise<void>;
  onReport: (replyId: string) => void;
  isHighlighted?: boolean;
}

export function CritiqueReplyItem({
  reply,
  currentUserId,
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
    return (
      <div
        id={`reply-${reply.id}`}
        className="w-full py-2.5 px-3 rounded-xl bg-gray-50/60 border border-dashed border-gray-200 text-xs text-gray-400 italic flex items-center gap-2"
      >
        <span>This reply was deleted.</span>
      </div>
    );
  }

  const timeLabel = formatTimestamp(reply.created_at, now);
  const fullTime = getFullTimestamp(reply.created_at);
  const username = reply.author?.username;
  const displayName = reply.author?.name || (username ? `@${username}` : 'Creative');
  const isAuthor = currentUserId && reply.author_id === currentUserId;
  const canDelete = Boolean(isAuthor);

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
          ? 'bg-primary/5 ring-2 ring-primary/40'
          : 'bg-gray-50/50 hover:bg-gray-50 border border-gray-150/80'
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
              className="text-xs font-semibold text-black hover:text-primary truncate transition-colors focus:outline-none"
            >
              {displayName}
            </Link>
          ) : (
            <span className="text-xs font-semibold text-black truncate">{displayName}</span>
          )}

          {/* Contextual "Replying to @username" indicator */}
          {reply.parent_reply_author_username && (
            <div className="flex items-center gap-1 text-[11px] text-gray-400 shrink-0">
              <CornerDownRight className="w-3 h-3 text-gray-400" />
              <span>replying to</span>
              <Link
                href={`/@${reply.parent_reply_author_username}`}
                scroll={false}
                onClick={(e) => e.stopPropagation()}
                className="font-medium text-gray-600 hover:text-primary transition-colors focus:outline-none"
              >
                @{reply.parent_reply_author_username}
              </Link>
            </div>
          )}

          <span 
            className="text-[11px] text-gray-400 font-normal shrink-0" 
            title={fullTime}
            suppressHydrationWarning
          >
            {timeLabel}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="text-xs text-gray-800 leading-relaxed pl-8.5 pr-1">
        <MentionRenderer content={reply.content} />
      </div>

      {/* Actions */}
      {!reply.is_optimistic && (
        <div className="flex items-center gap-3 mt-2 pl-8.5 text-[11px] font-medium text-gray-400">
          <button
            type="button"
            onClick={() => onReplyTo(reply)}
            className="hover:text-black transition-colors focus:outline-none flex items-center gap-1"
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
                        className="hover:underline text-red-600 focus:outline-none"
                      >
                        Yes
                      </button>
                      <span>/</span>
                      <button
                        type="button"
                        onClick={() => setIsConfirmingDelete(false)}
                        className="hover:underline text-gray-500 font-normal focus:outline-none"
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

          {!isAuthor && (
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
