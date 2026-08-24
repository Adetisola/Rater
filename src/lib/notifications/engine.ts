/**
 * Rater Notification Engine
 *
 * Core orchestrator for multi-channel notification processing:
 * 1. Checks idempotency & prevents duplicate delivery
 * 2. Enforces preference gates (with system bypass)
 * 3. Writes immutable record to PostgreSQL `notifications` table
 * 4. Broadcasts to Realtime WebSocket
 * 5. Dispatches Web Push & selective Brevo transactional emails
 */

import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { NOTIFICATION_REGISTRY } from './registry';
import type { NormalizedNotificationEvent } from './types';
import type { NotificationPreferences } from '@/types';
import { globalLogger } from '@/lib/logger';
import { dispatchWebPush } from './push';
import { sendNotificationEmail } from '@/lib/email/events';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase Service Role configuration');
  }
  return createClient(url, key);
}

export class NotificationEngine {
  /**
   * Dispatches a single normalized notification event through the pipeline.
   */
  public static async dispatch(event: NormalizedNotificationEvent): Promise<{ ok: boolean; notificationId?: string; skipped?: string }> {
    const {
      eventType,
      recipientProfileId,
      actorProfileId,
      targetEntityId,
      feedbackRequestId,
      idempotencyKey,
      groupKey,
      metadata = {},
    } = event;

    const eventDef = NOTIFICATION_REGISTRY[eventType];
    if (!eventDef) {
      globalLogger.warn(`[NotificationEngine] Unknown event type: ${eventType}`);
      return { ok: false, skipped: 'Unknown event type' };
    }

    const adminClient = getAdminClient();

    try {
      // 1. Resolve Recipient Profile & Email
      const { data: recipient, error: recErr } = await adminClient
        .from('profiles')
        .select('id, name, email, is_blocked')
        .eq('id', recipientProfileId)
        .single();

      if (recErr || !recipient) {
        globalLogger.warn('[NotificationEngine] Recipient profile not found', { recipientProfileId });
        return { ok: false, skipped: 'Recipient not found' };
      }

      // 2. Fetch Recipient Preferences
      const { data: userPrefs } = await adminClient
        .from('notification_preferences')
        .select('*')
        .eq('profile_id', recipientProfileId)
        .single();

      const preferences: NotificationPreferences = userPrefs || {
        id: '',
        profile_id: recipientProfileId,
        in_app_enabled: true,
        push_enabled: true,
        email_enabled: true,
        notify_critiques: true,
        notify_milestones: true,
        notify_insights: true,
        created_at: '',
        updated_at: '',
      };

      // 3. Resolve Actor Name if present
      let actorName: string | undefined = undefined;
      if (actorProfileId) {
        const { data: actor } = await adminClient
          .from('profiles')
          .select('name')
          .eq('id', actorProfileId)
          .single();
        actorName = actor?.name || undefined;
      }

      // 4. Render Canonical Copy
      const rendered = eventDef.renderCopy({
        actorName,
        workTitle: metadata.workTitle,
        postId: targetEntityId || undefined,
        reviewId: metadata.reviewId,
        badgeId: metadata.badgeId,
        feedbackTitle: metadata.feedbackTitle,
        feedbackSlug: metadata.feedbackSlug,
        metadata,
      });

      // 5. System Bypass vs. User Preference Gate
      const isSystemBypass = eventDef.category === 'system' || eventDef.priority === 'urgent';
      const shouldDeliverInApp = isSystemBypass || (preferences.in_app_enabled && (!eventDef.preferenceKey || preferences[eventDef.preferenceKey]));
      const shouldDeliverPush = eventDef.channels.push && (isSystemBypass || (preferences.push_enabled && (!eventDef.preferenceKey || preferences[eventDef.preferenceKey])));
      const shouldDeliverEmail = eventDef.channels.email && (isSystemBypass || (preferences.email_enabled && (!eventDef.preferenceKey || preferences[eventDef.preferenceKey])));

      // 6. Write Immutable In-App Record with Idempotency Lock
      let notificationId: string | undefined = undefined;

      if (shouldDeliverInApp) {
        const { data: insertedNotification, error: insertErr } = await adminClient
          .from('notifications')
          .upsert(
            {
              profile_id: recipientProfileId,
              actor_id: actorProfileId || null,
              type: eventType,
              category: eventDef.category,
              title: rendered.title,
              message: rendered.message,
              action_label: rendered.actionLabel,
              action_url: rendered.actionUrl,
              post_id: targetEntityId || null,
              feedback_request_id: feedbackRequestId || null,
              idempotency_key: idempotencyKey,
              group_key: groupKey || null,
              metadata,
              is_read: false,
            },
            { onConflict: 'idempotency_key', ignoreDuplicates: true }
          )
          .select('id')
          .maybeSingle();

        if (insertErr) {
          globalLogger.error('[NotificationEngine] Failed to write notification record', { error: insertErr.message, idempotencyKey });
          return { ok: false, skipped: insertErr.message };
        }

        // If insert returned null, it was deduplicated via idempotency_key!
        if (!insertedNotification) {
          globalLogger.info('[NotificationEngine] Event deduplicated via idempotencyKey', { idempotencyKey });
          return { ok: true, skipped: 'Deduplicated' };
        }

        notificationId = insertedNotification.id;
      }

      // 7. Tier 2: Web Push Dispatch (Non-blocking)
      if (shouldDeliverPush) {
        try {
          await dispatchWebPush({
            profileId: recipientProfileId,
            title: rendered.pushTitle || rendered.title,
            body: rendered.pushBody || rendered.message,
            targetUrl: rendered.actionUrl,
            groupKey: groupKey || undefined,
            notificationId,
            actions: rendered.pushActions,
          });
        } catch (pushErr) {
          globalLogger.warn('[NotificationEngine] Web push delivery failed (non-blocking)', {
            recipientProfileId,
            error: pushErr instanceof Error ? pushErr.message : String(pushErr),
          });
        }
      }

      // 8. Tier 3: Brevo Transactional Email Dispatch (High-Signal Moments Only)
      if (shouldDeliverEmail && recipient.email) {
        try {
          await sendNotificationEmail({
            eventType,
            toEmail: recipient.email,
            toName: recipient.name,
            subject: rendered.emailSubject || rendered.title,
            workTitle: metadata.workTitle,
            actionUrl: rendered.actionUrl,
            actionLabel: rendered.actionLabel,
          });
        } catch (emailErr) {
          globalLogger.warn('[NotificationEngine] Transactional email delivery failed (non-blocking)', {
            recipientEmail: recipient.email,
            error: emailErr instanceof Error ? emailErr.message : String(emailErr),
          });
        }
      }

      globalLogger.info('[NotificationEngine] Notification successfully dispatched', {
        eventType,
        recipientProfileId,
        notificationId,
      });

      return { ok: true, notificationId };
    } catch (err: any) {
      globalLogger.error('[NotificationEngine] Unexpected dispatch error', {
        eventType,
        error: err?.message || String(err),
      });
      return { ok: false, skipped: err?.message || 'Unexpected error' };
    }
  }

  /**
   * Batch dispatch multiple normalized events.
   */
  public static async dispatchBatch(events: NormalizedNotificationEvent[]): Promise<void> {
    for (const event of events) {
      await this.dispatch(event);
    }
  }
}
