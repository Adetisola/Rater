"use client";

import { useRouter } from 'next/navigation';
import { 
  MessageSquare, 
  Sparkles, 
  Trophy, 
  CheckCircle, 
  ShieldAlert, 
  Layers,
  BookmarkCheck
} from 'lucide-react';
import type { Notification } from '@/types';
import { UserAvatar } from '../UserAvatar';
import { formatDistanceToNowStrict } from 'date-fns';
import { cn } from '@/lib/utils';

interface NotificationItemProps {
  notification: Notification;
  onRead?: (id: string) => void;
  onCloseParent?: () => void;
  compact?: boolean;
}

export function NotificationItem({
  notification,
  onRead,
  onCloseParent,
}: NotificationItemProps) {
  const router = useRouter();

  const getCategoryIcon = (category?: string, type?: string) => {
    const t = type || '';
    const c = category || '';
    if (t.includes('TOP_RATED')) return <Trophy className="w-3.5 h-3.5 text-amber-500" />;
    if (t.includes('INSIGHTS')) return <Sparkles className="w-3.5 h-3.5 text-amber-500" />;
    if (t.includes('RATING_UNLOCKED')) return <CheckCircle className="w-3.5 h-3.5 text-green-500" />;
    if (t.includes('WORK_PUBLISHED')) return <Sparkles className="w-3.5 h-3.5 text-primary" />;
    if (t.includes('FEEDBACK_STATUS')) return <BookmarkCheck className="w-3.5 h-3.5 text-primary" />;
    if (t.includes('FEEDBACK_REQUEST_REPLY')) return <CheckCircle className="w-3.5 h-3.5 text-primary" />;
    if (t.includes('FEEDBACK_COMMENT')) return <MessageSquare className="w-3.5 h-3.5 text-amber-500" />;
    if (c === 'system') return <ShieldAlert className="w-3.5 h-3.5 text-red-500" />;
    if (c === 'community') return <MessageSquare className="w-3.5 h-3.5 text-primary" />;
    if (c === 'activity') return <MessageSquare className="w-3.5 h-3.5 text-primary" />;
    return <Layers className="w-3.5 h-3.5 text-gray-500" />;
  };

  const getFormattedTime = (dateStr?: string) => {
    if (!dateStr) return 'recently';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'recently';
      return formatDistanceToNowStrict(d, { addSuffix: true });
    } catch {
      return 'recently';
    }
  };

  const handleClick = (e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (onRead && !notification.is_read) {
      onRead(notification.id);
    }
    if (onCloseParent) {
      onCloseParent();
    }
    const targetUrl = notification.action_url || '/browse';
    if (targetUrl.startsWith('mailto:') || targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
      window.location.href = targetUrl;
    } else {
      router.push(targetUrl);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "group relative flex w-full items-start gap-3.5 p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-200 cursor-pointer",
        notification.is_read
          ? "bg-white hover:bg-gray-50/90 border-gray-100"
          : "bg-amber-50/25 hover:bg-amber-50/50 border-primary/25 ring-1 ring-primary/10"
      )}
    >
      {/* Actor Avatar or Category Icon */}
      <div className="relative shrink-0 mt-0.5">
        {notification.actor ? (
          <UserAvatar
            avatarUrl={notification.actor.avatar_url}
            size="sm"
            className="w-10 h-10 rounded-full border border-gray-100 shadow-2xs"
          />
        ) : (
          <div className="w-10 h-10 rounded-2xl bg-gray-100/80 flex items-center justify-center border border-gray-200/60 shadow-2xs">
            {getCategoryIcon(notification.category, notification.type)}
          </div>
        )}

        {/* Small Category Badge Indicator */}
        {notification.actor && (
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white flex items-center justify-center shadow-xs border border-gray-100">
            {getCategoryIcon(notification.category, notification.type)}
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center justify-between gap-2 mb-1">
          <p className={cn(
            "text-xs sm:text-[13px] truncate tracking-tight",
            notification.is_read ? "font-semibold text-gray-800" : "font-bold text-gray-950"
          )}>
            {notification.title}
          </p>
          <span className="text-[10px] sm:text-[11px] text-gray-400 shrink-0 font-mono">
            {getFormattedTime(notification.created_at)}
          </span>
        </div>

        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-2.5 font-normal">
          {notification.message}
        </p>

        {/* Action Button */}
        <div className="flex items-center justify-between pt-0.5">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-white border border-gray-200/90 group-hover:border-primary/50 group-hover:bg-primary/10 text-[11px] font-bold text-gray-900 shadow-2xs transition-all">
            <span>{notification.action_label || 'View'}</span>
          </div>
        </div>
      </div>

      {/* Right Compact Post Thumbnail (if linked to a Work) */}
      {notification.post?.image_url && (
        <div className="shrink-0 relative w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-gray-100 border border-gray-200/80 shadow-2xs mt-0.5">
          <img
            src={notification.post.image_url}
            alt={notification.post.title || "Work preview"}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
    </button>
  );
}
