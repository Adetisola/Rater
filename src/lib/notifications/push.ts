/**
 * Server-Side Web Push Dispatcher
 *
 * Dispatches VAPID web-push notifications to all active subscriptions for a given profile,
 * handles 30-minute aggregation tags, and prunes 410/404 dead subscriptions.
 */

import 'server-only';
import webpush from 'web-push';
import { createClient } from '@supabase/supabase-js';
import { globalLogger } from '@/lib/logger';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

// Configure VAPID details if configured in environment
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:hello@raterapp.site';

if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  } catch (err) {
    console.warn('[WebPush] Error initializing VAPID details:', err);
  }
}

import type { PushNotificationAction } from './types';

export interface DispatchWebPushOptions {
  profileId: string;
  title: string;
  body: string;
  targetUrl: string;
  groupKey?: string;
  notificationId?: string;
  actions?: PushNotificationAction[];
}

/**
 * Dispatches a Web Push notification to all active devices registered to a profile.
 */
export async function dispatchWebPush({
  profileId,
  title,
  body,
  targetUrl,
  groupKey,
  notificationId,
  actions,
}: DispatchWebPushOptions): Promise<{ sent: number; failed: number }> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    globalLogger.warn('[WebPush] VAPID keys not configured — skipping push dispatch');
    return { sent: 0, failed: 0 };
  }

  const adminClient = getAdminClient();
  if (!adminClient) return { sent: 0, failed: 0 };

  // 1. Fetch all push subscriptions for this user
  const { data: subscriptions, error } = await adminClient
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('profile_id', profileId);

  if (error || !subscriptions || subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const actionUrls: Record<string, string> = {};
  const formattedActions = (actions || []).map((a) => {
    if (a.url) {
      actionUrls[a.action] = a.url;
    }
    return {
      action: a.action,
      title: a.title,
      icon: a.icon || '/icons/icon-192.png',
    };
  });

  const payload = JSON.stringify({
    title,
    body,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    targetUrl,
    groupKey,
    id: notificationId,
    actions: formattedActions,
    actionUrls,
  });

  let sent = 0;
  let failed = 0;
  const deadSubscriptionIds: string[] = [];

  // 2. Send in parallel to all active endpoints
  await Promise.all(
    subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      try {
        await webpush.sendNotification(pushSubscription, payload, {
          TTL: 86400, // 24 hours
          urgency: 'high',
        });
        sent++;
      } catch (err: any) {
        failed++;
        const statusCode = err?.statusCode;

        // 3. Prune 410 Gone / 404 Not Found dead endpoints
        if (statusCode === 410 || statusCode === 404) {
          deadSubscriptionIds.push(sub.id);
        } else {
          globalLogger.warn('[WebPush] Push dispatch error on device', {
            subscriptionId: sub.id,
            statusCode,
            message: err?.message,
          });
        }
      }
    })
  );

  // 4. Batch delete expired/uninstalled subscriptions
  if (deadSubscriptionIds.length > 0) {
    try {
      await adminClient
        .from('push_subscriptions')
        .delete()
        .in('id', deadSubscriptionIds);
    } catch (delErr) {
      console.warn('[WebPush] Error deleting dead subscriptions:', delErr);
    }
  }

  globalLogger.info('[WebPush] Dispatch completed', { profileId, sent, failed, pruned: deadSubscriptionIds.length });
  return { sent, failed };
}
