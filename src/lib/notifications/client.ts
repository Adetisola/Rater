/**
 * Client-Side Notification Service
 *
 * Provides client helpers to query notifications, toggle read states,
 * and manage Web Push subscription state.
 */

import { supabase } from '@/lib/supabase/client';
import type { Notification, NotificationPreferences } from '@/types';

// Helper to convert base64 URL to Uint8Array for VAPID subscription
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Fetch a page of notifications for the current profile.
 */
export async function getNotifications(
  profileId: string,
  options: { filter?: 'all' | 'unread'; limit?: number; offset?: number } = {}
): Promise<Notification[]> {
  if (!supabase || !profileId) return [];

  const { filter = 'all', limit = 20, offset = 0 } = options;

  let query = supabase
    .from('notifications')
    .select(`
      *,
      actor:profiles!actor_id(id, name, username, avatar_url),
      post:posts!post_id(id, title, image_url, category)
    `)
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (filter === 'unread') {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[Notifications] Error fetching notifications:', error);
    return [];
  }

  return (data || []) as unknown as Notification[];
}

/**
 * Fetch the exact unread notification count.
 */
export async function getUnreadCount(profileId: string): Promise<number> {
  if (!supabase || !profileId) return 0;

  const { count, error } = await supabase
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('profile_id', profileId)
    .eq('is_read', false);

  if (error) {
    console.error('[Notifications] Error fetching unread count:', error);
    return 0;
  }

  return count || 0;
}

/**
 * Mark a single notification as read.
 */
export async function markAsRead(notificationId: string): Promise<void> {
  if (!supabase || !notificationId) return;

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('id', notificationId);

  if (error) {
    console.error('[Notifications] Error marking notification as read:', error);
  }
}

/**
 * Mark all unread notifications for a profile as read.
 */
export async function markAllAsRead(profileId: string): Promise<void> {
  if (!supabase || !profileId) return;

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq('profile_id', profileId)
    .eq('is_read', false);

  if (error) {
    console.error('[Notifications] Error marking all notifications as read:', error);
  }
}

/**
 * Fetch user notification preferences.
 */
export async function getNotificationPreferences(profileId: string): Promise<NotificationPreferences | null> {
  if (!supabase || !profileId) return null;

  const { data, error } = await supabase
    .from('notification_preferences')
    .select('*')
    .eq('profile_id', profileId)
    .single();

  if (error) {
    console.error('[Notifications] Error fetching preferences:', error);
    return null;
  }

  return data as NotificationPreferences;
}

/**
 * Update user notification preferences.
 */
export async function updateNotificationPreferences(
  profileId: string,
  updates: Partial<Omit<NotificationPreferences, 'id' | 'profile_id' | 'created_at' | 'updated_at'>>
): Promise<boolean> {
  if (!supabase || !profileId) return false;

  const { error } = await supabase
    .from('notification_preferences')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('profile_id', profileId);

  if (error) {
    console.error('[Notifications] Error updating preferences:', error);
    return false;
  }

  return true;
}

/**
 * Request Web Push permission and register the device subscription.
 */
export async function registerPushSubscription(profileId: string): Promise<{ ok: boolean; error?: string }> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return { ok: false, error: 'Push notifications are not supported by this browser.' };
  }

  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!vapidPublicKey) {
    return { ok: false, error: 'VAPID public key is not configured.' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { ok: false, error: 'Permission was denied or dismissed.' };
    }

    const registration = await navigator.serviceWorker.ready;
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as unknown as ArrayBuffer,
      });
    }

    const rawKey = subscription.getKey ? subscription.getKey('p256dh') : null;
    const rawAuth = subscription.getKey ? subscription.getKey('auth') : null;

    if (!rawKey || !rawAuth) {
      return { ok: false, error: 'Failed to extract push encryption keys.' };
    }

    const p256dh = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(rawKey))));
    const auth = btoa(String.fromCharCode.apply(null, Array.from(new Uint8Array(rawAuth))));

    // Post subscription to backend endpoint
    const response = await fetch('/api/notifications/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        profileId,
        endpoint: subscription.endpoint,
        p256dh,
        auth,
        userAgent: navigator.userAgent,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      return { ok: false, error: errData.error || 'Failed to save push subscription.' };
    }

    return { ok: true };
  } catch (err: any) {
    console.error('[Push] Error subscribing to push:', err);
    return { ok: false, error: err?.message || 'Error activating push notifications.' };
  }
}

/**
 * Unsubscribe current browser from Web Push.
 */
export async function unregisterPushSubscription(profileId: string): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await fetch('/api/notifications/push/subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profileId,
          endpoint: subscription.endpoint,
        }),
      });

      await subscription.unsubscribe();
    }
    return true;
  } catch (err) {
    console.error('[Push] Error unsubscribing from push:', err);
    return false;
  }
}

/**
 * Check if the current browser device is subscribed to push.
 */
export async function isPushSubscribedOnDevice(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
    return false;
  }

  try {
    if (Notification.permission !== 'granted') return false;
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return Boolean(subscription);
  } catch {
    return false;
  }
}
