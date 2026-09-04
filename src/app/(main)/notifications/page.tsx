"use client";

import { useEffect, useMemo } from 'react';
import { useAuthState } from '@/context/AuthContext';
import { useNotificationStore } from '@/store/notificationStore';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { NotificationEmptyState } from '@/components/notifications/NotificationEmptyState';
import { showSettings } from '@/components/GlobalOverlays';
import { Button } from '@/components/ui/Button';
import { CheckCheck, Settings, Loader2, Bell } from 'lucide-react';
import { isToday, isYesterday, isThisWeek, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Notification } from '@/types';

export default function NotificationsPage() {
  const { currentProfile, isLoading: isAuthLoading } = useAuthState();
  const {
    notifications,
    unreadCount,
    isLoading,
    isLoadingMore,
    hasMore,
    activeFilter,
    fetchNotifications,
    loadMore,
    setActiveFilter,
    markAsRead,
    markAllAsRead,
    subscribeToRealtime,
  } = useNotificationStore();

  useEffect(() => {
    if (currentProfile?.id) {
      fetchNotifications(currentProfile.id, activeFilter, true);
      const unsubscribe = subscribeToRealtime(currentProfile.id);
      return () => {
        unsubscribe();
      };
    }
  }, [currentProfile?.id, activeFilter, fetchNotifications, subscribeToRealtime]);

  // Group notifications by date bucket
  const groupedNotifications = useMemo(() => {
    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const thisWeek: Notification[] = [];
    const earlier: Notification[] = [];

    (notifications || []).forEach((item) => {
      if (!item) return;
      try {
        if (!item.created_at) {
          earlier.push(item);
          return;
        }
        const date = parseISO(item.created_at);
        if (!isValid(date)) {
          earlier.push(item);
          return;
        }

        if (isToday(date)) {
          today.push(item);
        } else if (isYesterday(date)) {
          yesterday.push(item);
        } else if (isThisWeek(date)) {
          thisWeek.push(item);
        } else {
          earlier.push(item);
        }
      } catch {
        earlier.push(item);
      }
    });

    return [
      { label: 'Today', items: today },
      { label: 'Yesterday', items: yesterday },
      { label: 'This Week', items: thisWeek },
      { label: 'Earlier', items: earlier },
    ].filter((group) => group.items.length > 0);
  }, [notifications]);

  if (isAuthLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-4 border border-primary/30">
          <Bell className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-bold text-text-primary mb-2">Sign in to view notifications</h2>
        <p className="text-sm text-text-secondary max-w-sm mx-auto mb-6">
          Track critiques, unlocked scores, and studio milestones on your Work.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-xl font-semibold text-text-primary tracking-tight flex items-center gap-3">
            <span>Notifications</span>
            {unreadCount > 0 && (
              <span className="px-3 py-0.5 rounded-full text-xs font-black bg-primary/20 text-text-primary">
                {unreadCount} new
              </span>
            )}
          </h1>
          <p className="text-xs sm:text-sm text-text-secondary mt-1">
            Realtime critiques, milestone unlock alerts, and studio updates.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllAsRead(currentProfile.id)}
              className="h-9 px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-surface-primary border-border-default text-text-secondary hover:bg-surface-hover hover:text-text-primary"
            >
              <CheckCheck size={16} />
              <span>Mark all read</span>
            </Button>
          )}

          <Button
            variant="outline"
            onClick={() => showSettings('notifications')}
            className="h-9 w-9 p-0 rounded-xl flex items-center justify-center bg-surface-primary border-border-default text-text-secondary hover:bg-surface-hover hover:text-text-primary"
            aria-label="Notification settings"
          >
            <Settings size={16} />
          </Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 mb-6">
        <button
          type="button"
          onClick={() => setActiveFilter('all')}
          className={cn(
            "px-4 py-2 rounded-full text-xs font-medium border transition-all duration-200",
            activeFilter === 'all'
              ? "bg-primary/10 border-primary/40 text-text-primary font-semibold"
              : "bg-surface-primary border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary"
          )}
        >
          All
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter('unread')}
          className={cn(
            "px-4 py-2 rounded-full text-xs font-medium border transition-all duration-200 flex items-center gap-1.5",
            activeFilter === 'unread'
              ? "bg-primary/10 border-primary/40 text-text-primary font-semibold"
              : "bg-surface-primary border-border-default text-text-secondary hover:border-border-strong hover:text-text-primary"
          )}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          )}
        </button>
      </div>

      {/* Main Content Feed */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24 text-text-muted">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary" />
          <span className="text-sm font-medium">Loading your notification feed...</span>
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-surface-primary rounded-3xl border border-border-default p-8 shadow-xs">
          <NotificationEmptyState filter={activeFilter} />
        </div>
      ) : (
        <div className="space-y-7">
          {groupedNotifications.map((group) => (
            <div key={group.label} className="space-y-2.5">
              <div className="flex items-center gap-2 px-1 mb-1">
                <h3 className="text-xs font-bold text-text-primary tracking-tight">
                  {group.label}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-surface-interactive text-text-muted">
                  {group.items.length}
                </span>
              </div>

              <div className="space-y-2.5">
                {group.items.map((item) => (
                  <NotificationItem
                    key={item.id}
                    notification={item}
                    onRead={markAsRead}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Load More Trigger */}
          {hasMore && (
            <div className="text-center pt-4">
              <Button
                variant="outline"
                disabled={isLoadingMore}
                onClick={() => loadMore(currentProfile.id)}
                className="h-10 px-6 rounded-full text-xs font-bold bg-surface-primary border-border-default text-text-secondary hover:bg-surface-hover hover:text-text-primary"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    <span>Loading more...</span>
                  </>
                ) : (
                  'Load older notifications'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
