import { create } from 'zustand';
import type { Notification } from '@/types';
import { supabase } from '@/lib/supabase/client';
import { getNotifications, getUnreadCount, markAsRead as apiMarkAsRead, markAllAsRead as apiMarkAllAsRead } from '@/lib/notifications/client';

interface NotificationStoreState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  activeFilter: 'all' | 'unread';
  currentProfileId: string | null;

  // Actions
  fetchInitial: (profileId: string) => Promise<void>;
  fetchNotifications: (profileId: string, filter?: 'all' | 'unread', refresh?: boolean) => Promise<void>;
  loadMore: (profileId: string) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: (profileId: string) => Promise<void>;
  setActiveFilter: (filter: 'all' | 'unread') => void;
  subscribeToRealtime: (profileId: string) => () => void;
  reset: () => void;
}

const PAGE_SIZE = 20;

export const useNotificationStore = create<NotificationStoreState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  isLoadingMore: false,
  hasMore: true,
  activeFilter: 'all',
  currentProfileId: null,

  fetchInitial: async (profileId: string) => {
    if (!profileId) return;
    set({ currentProfileId: profileId, isLoading: true });

    try {
      const [items, unread] = await Promise.all([
        getNotifications(profileId, { filter: get().activeFilter, limit: PAGE_SIZE, offset: 0 }),
        getUnreadCount(profileId),
      ]);

      set({
        notifications: items,
        unreadCount: unread,
        hasMore: items.length >= PAGE_SIZE,
        isLoading: false,
      });
    } catch (err) {
      console.error('[NotificationStore] Failed to fetch initial notifications:', err);
      set({ isLoading: false });
    }
  },

  fetchNotifications: async (profileId: string, filter = 'all', refresh = true) => {
    if (!profileId) return;
    set({ isLoading: refresh, activeFilter: filter, currentProfileId: profileId });

    try {
      const [items, unread] = await Promise.all([
        getNotifications(profileId, { filter, limit: PAGE_SIZE, offset: 0 }),
        getUnreadCount(profileId),
      ]);

      set({
        notifications: items,
        unreadCount: unread,
        hasMore: items.length >= PAGE_SIZE,
        isLoading: false,
      });
    } catch (err) {
      console.error('[NotificationStore] Failed to fetch notifications:', err);
      set({ isLoading: false });
    }
  },

  loadMore: async (profileId: string) => {
    const { notifications, activeFilter, hasMore, isLoadingMore } = get();
    if (!profileId || !hasMore || isLoadingMore) return;

    set({ isLoadingMore: true });

    try {
      const nextItems = await getNotifications(profileId, {
        filter: activeFilter,
        limit: PAGE_SIZE,
        offset: notifications.length,
      });

      set({
        notifications: [...notifications, ...nextItems],
        hasMore: nextItems.length >= PAGE_SIZE,
        isLoadingMore: false,
      });
    } catch (err) {
      console.error('[NotificationStore] Failed to load more:', err);
      set({ isLoadingMore: false });
    }
  },

  markAsRead: async (notificationId: string) => {
    const { notifications, unreadCount } = get();
    const target = notifications.find((n) => n.id === notificationId);

    // Optimistic UI update
    if (target && !target.is_read) {
      set({
        notifications: notifications.map((n) =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, unreadCount - 1),
      });
    }

    try {
      await apiMarkAsRead(notificationId);
    } catch (err) {
      console.error('[NotificationStore] Error in markAsRead:', err);
    }
  },

  markAllAsRead: async (profileId: string) => {
    const { notifications } = get();

    // Optimistic UI update
    set({
      notifications: notifications.map((n) => ({
        ...n,
        is_read: true,
        read_at: new Date().toISOString(),
      })),
      unreadCount: 0,
    });

    try {
      await apiMarkAllAsRead(profileId);
    } catch (err) {
      console.error('[NotificationStore] Error in markAllAsRead:', err);
    }
  },

  setActiveFilter: (filter: 'all' | 'unread') => {
    const { currentProfileId } = get();
    if (currentProfileId) {
      get().fetchNotifications(currentProfileId, filter, true);
    } else {
      set({ activeFilter: filter });
    }
  },

  subscribeToRealtime: (profileId: string) => {
    if (!supabase || !profileId) return () => {};

    const channelName = `profile-notifications:${profileId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${profileId}`,
        },
        async (payload) => {
          const newRow = payload.new as Notification;
          if (!newRow) return;

          // Fetch full enriched notification with joined actor and post
          const enrichedList = await getNotifications(profileId, { limit: 1, offset: 0 });
          const enrichedItem = enrichedList.find((item) => item.id === newRow.id) || newRow;

          const { notifications, unreadCount, activeFilter } = get();

          // Deduplicate if already present locally
          if (notifications.some((n) => n.id === newRow.id)) return;

          const shouldIncludeInView = activeFilter === 'all' || (activeFilter === 'unread' && !enrichedItem.is_read);

          set({
            notifications: shouldIncludeInView ? [enrichedItem, ...notifications] : notifications,
            unreadCount: unreadCount + 1,
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `profile_id=eq.${profileId}`,
        },
        (payload) => {
          const updatedRow = payload.new as Notification;
          if (!updatedRow) return;

          const { notifications } = get();
          set({
            notifications: notifications.map((n) =>
              n.id === updatedRow.id ? { ...n, ...updatedRow } : n
            ),
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },

  reset: () => {
    set({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      isLoadingMore: false,
      hasMore: true,
      activeFilter: 'all',
      currentProfileId: null,
    });
  },
}));
