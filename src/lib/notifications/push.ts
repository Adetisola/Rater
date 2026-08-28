/**
 * Server-Side Web Push Dispatcher
 *
 * Dispatches VAPID web-push notifications to all active subscriptions for a given profile,
 * handles 30-minute aggregation tags, and prunes 410/404 dead subscriptions.
 *
 * Delivery observability: each dispatch records per-endpoint accepted/rejected state,
 * status code, and timing so Samsung Internet and other platform failures are diagnosable.
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

/** Per-subscription dispatch result — for delivery observability */
interface EndpointDispatchResult {
  subscriptionId: string;
  /** Endpoint prefix only (not full URL to avoid logging user-identifying data) */
  endpointPrefix: string;
  accepted: boolean;
  statusCode?: number;
  errorMessage?: string;
  durationMs: number;
}

/**
 * Dispatches a Web Push notification to all active devices registered to a profile.
 * Returns aggregated sent/failed counts plus per-endpoint results for observability.
 */
export async function dispatchWebPush({
  profileId,
  title,
  body,
  targetUrl,
  groupKey,
  notificationId,
  actions,
}: DispatchWebPushOptions): Promise<{ sent: number; failed: number; results: EndpointDispatchResult[] }> {
  if (!vapidPublicKey || !vapidPrivateKey) {
    globalLogger.warn('[WebPush] VAPID keys not configured — skipping push dispatch');
    return { sent: 0, failed: 0, results: [] };
  }

  const adminClient = getAdminClient();
  if (!adminClient) return { sent: 0, failed: 0, results: [] };

  const dispatchStartMs = Date.now();

  // 1. Fetch all push subscriptions for this user
  const { data: subscriptions, error } = await adminClient
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('profile_id', profileId);

  if (error || !subscriptions || subscriptions.length === 0) {
    globalLogger.info('[WebPush] No active subscriptions for profile', { profileId });
    return { sent: 0, failed: 0, results: [] };
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
    // Timestamp so the SW can display the accurate notification time
    timestamp: Date.now(),
  });

  let sent = 0;
  let failed = 0;
  const deadSubscriptionIds: string[] = [];
  const results: EndpointDispatchResult[] = [];

  // 2. Send in parallel to all active endpoints with per-endpoint timing
  await Promise.all(
    subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        },
      };

      // Safe prefix for logging (avoids logging full URL which may contain tokens)
      const endpointPrefix = sub.endpoint.substring(0, 40) + '…';
      const endpointStartMs = Date.now();

      try {
        await webpush.sendNotification(pushSubscription, payload, {
          TTL: 86400, // 24 hours — FCM/Mozilla hold the message if device is unreachable
          urgency: 'high',
        });
        const durationMs = Date.now() - endpointStartMs;
        sent++;
        results.push({
          subscriptionId: sub.id,
          endpointPrefix,
          accepted: true,
          durationMs,
        });
        globalLogger.info('[WebPush] Endpoint accepted push', {
          subscriptionId: sub.id,
          endpointPrefix,
          durationMs,
        });
      } catch (err: any) {
        const durationMs = Date.now() - endpointStartMs;
        failed++;
        const statusCode = err?.statusCode;
        const errorMessage = err?.message || String(err);

        results.push({
          subscriptionId: sub.id,
          endpointPrefix,
          accepted: false,
          statusCode,
          errorMessage,
          durationMs,
        });

        // 3. Prune 410 Gone / 404 Not Found dead endpoints (authoritative signal)
        if (statusCode === 410 || statusCode === 404) {
          deadSubscriptionIds.push(sub.id);
          globalLogger.info('[WebPush] Dead endpoint — scheduling pruning', {
            subscriptionId: sub.id,
            endpointPrefix,
            statusCode,
          });
        } else {
          // Non-fatal delivery error — log for platform diagnosis (e.g. Samsung Internet)
          globalLogger.warn('[WebPush] Push dispatch error on endpoint', {
            subscriptionId: sub.id,
            endpointPrefix,
            statusCode,
            errorMessage,
            durationMs,
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

  const totalDurationMs = Date.now() - dispatchStartMs;

  globalLogger.info('[WebPush] Dispatch completed', {
    profileId,
    sent,
    failed,
    pruned: deadSubscriptionIds.length,
    subscriptionCount: subscriptions.length,
    totalDurationMs,
    // Per-endpoint result array for delivery tracing
    endpointResults: results.map((r) => ({
      subscriptionId: r.subscriptionId,
      accepted: r.accepted,
      statusCode: r.statusCode,
      durationMs: r.durationMs,
      ...(r.errorMessage ? { errorMessage: r.errorMessage } : {}),
    })),
  });

  return { sent, failed, results };
}
