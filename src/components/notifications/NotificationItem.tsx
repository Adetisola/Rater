"use client";

import { useRouter } from 'next/navigation';
import { 
  MessageSquare, 
  Sparkles, 
  Trophy, 
  CheckCircle, 
  ShieldAlert, 
  Layers, 
  ArrowRight
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
    if (c === 'system') return <ShieldAlert className="w-3.5 h-3.5 text-red-500" />;
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
    <div
      onClick={handleClick}
      className={cn(
        "group relative flex items-start gap-3 p-3.5 rounded-2xl transition-all duration-200 cursor-pointer",
        notification.is_read
          ? "bg-transparent hover:bg-gray-50/80"
          : "bg-amber-50/30 hover:bg-amber-50/60 border border-primary/10 shadow-xs"
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
          <div className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center border border-gray-200/60 shadow-2xs">
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
      <div className="flex-1 min-w-0 pr-2">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className={cn(
            "text-xs truncate tracking-tight",
            notification.is_read ? "font-medium text-gray-800" : "font-bold text-gray-950"
          )}>
            {notification.title}
          </p>
          <span className="text-[10px] text-gray-400 shrink-0 flex items-center gap-1 font-mono">
            {getFormattedTime(notification.created_at)}
          </span>
        </div>

        <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-2 font-normal">
          {notification.message}
        </p>

        {/* Action Button & Unread Indicator */}
        <div className="flex items-center justify-between pt-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-gray-200/90 group-hover:border-primary/50 group-hover:bg-primary/15 text-[11px] font-bold text-gray-900 shadow-2xs transition-all">
            <span>{notification.action_label || 'View'}</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform text-gray-800" />
          </div>

          {!notification.is_read && (
            <span className="w-2 h-2 rounded-full bg-primary ring-2 ring-primary/20 shrink-0" />
          )}
        </div>
      </div>
    </div>
  );
}
