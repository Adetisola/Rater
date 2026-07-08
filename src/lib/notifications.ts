/**
 * Notifications Domain Service
 *
 * Handles user notification reads and writes.
 * Phase 1: typed stubs only — notifications are not yet implemented in the UI.
 * Milestone 5: implement with Supabase Realtime subscriptions.
 *
 * TODO(milestone-5):
 *   - supabase.from('notifications').select().eq('avatar_id', avatarId)
 *   - supabase.channel('notifications').on('INSERT', handler).subscribe()
 */

import type { Notification } from '@/types';

/**
 * Fetch all notifications for a user, ordered by newest first.
 */
export async function getNotifications(avatarId: string): Promise<Notification[]> {
  // TODO(milestone-5): supabase.from('notifications').select().eq('avatar_id', avatarId).order('created_at', { ascending: false })
  void avatarId;
  return [];
}

/**
 * Get the count of unread notifications.
 */
export async function getUnreadCount(avatarId: string): Promise<number> {
  // TODO(milestone-5): supabase.from('notifications').select('id', { count: 'exact' }).eq('avatar_id', avatarId).eq('is_read', false)
  void avatarId;
  return 0;
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(notificationId: string): Promise<void> {
  // TODO(milestone-5): supabase.from('notifications').update({ is_read: true }).eq('id', notificationId)
  void notificationId;
}

/**
 * Mark all notifications for a user as read.
 */
export async function markAllAsRead(avatarId: string): Promise<void> {
  // TODO(milestone-5): supabase.from('notifications').update({ is_read: true }).eq('avatar_id', avatarId)
  void avatarId;
}
