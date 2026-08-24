/**
 * Notification Recipient Resolvers & Specialized Dispatchers
 *
 * Encapsulates recipient-resolution logic to decouple event triggers
 * from specific user-graph topologies (e.g. Broadcast V1 vs. Following/Followers V2).
 */

import { createClient } from '@supabase/supabase-js';
import type { NormalizedNotificationEvent } from './types';
import { NotificationEngine } from './engine';
import { globalLogger } from '@/lib/logger';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Resolves eligible recipient profile IDs for a newly published work.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * V1 (Discovery / Broadcast):
 * Resolves all active registered accounts excluding the work's author and
 * any blocked/suspended accounts.
 *
 * Future Following Plugin:
 * When Following/Followers is introduced, this function's internal query can
 * simply query the `followers` table for `authorId`:
 *   SELECT follower_id FROM followers WHERE followed_id = authorId ...
 * The rest of the notification architecture (event definition, delivery engine,
 * user preferences, push delivery, UI) remains 100% untouched.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export async function resolveNewWorkRecipients(authorId: string): Promise<string[]> {
  const adminClient = getAdminClient();
  if (!adminClient || !authorId) return [];

  try {
    const { data: profiles, error } = await adminClient
      .from('profiles')
      .select('id')
      .neq('id', authorId)
      .neq('is_blocked', true);

    if (error) {
      globalLogger.error('[RecipientResolver] Error resolving new work recipients:', {
        authorId,
        error: error.message,
      });
      return [];
    }

    return (profiles || []).map((p) => p.id).filter(Boolean);
  } catch (err: any) {
    globalLogger.error('[RecipientResolver] Failed to resolve new work recipients:', {
      authorId,
      error: err?.message || String(err),
    });
    return [];
  }
}

/**
 * Dispatches NEW_WORK_PUBLISHED notifications for a newly published public work.
 *
 * Guarantees:
 * - Only fires for public works (is_deleted is not true, has valid image_url).
 * - Author is strictly excluded from recipient list.
 * - Idempotency key `new_work:${post.id}:${recipientId}` guarantees zero duplicate
 *   notifications even if multiple processing attempts occur.
 * - NotificationEngine evaluates individual user preferences (notify_new_work, in_app, push).
 */
export async function dispatchNewWorkPublished(post: Record<string, any>): Promise<void> {
  if (!post?.id || !post?.avatar_id) return;

  // Strict public work validation: Must not be deleted and must have media content
  if (post.is_deleted === true || !post.image_url) {
    globalLogger.info('[RecipientResolver] Suppressing NEW_WORK_PUBLISHED for non-public/deleted post', {
      postId: post.id,
      isDeleted: post.is_deleted,
    });
    return;
  }

  const recipientIds = await resolveNewWorkRecipients(post.avatar_id);
  if (recipientIds.length === 0) return;

  const events: NormalizedNotificationEvent[] = recipientIds.map((recipientId) => ({
    eventType: 'NEW_WORK_PUBLISHED',
    recipientProfileId: recipientId,
    actorProfileId: post.avatar_id,
    targetEntityId: post.id,
    idempotencyKey: `new_work:${post.id}:${recipientId}`,
    groupKey: `new_work:${post.id}`,
    metadata: {
      workTitle: post.title,
      category: post.category,
      imageUrl: post.image_url,
      authorId: post.avatar_id,
    },
  }));

  globalLogger.info('[RecipientResolver] Dispatching NEW_WORK_PUBLISHED batch', {
    postId: post.id,
    recipientCount: events.length,
  });

  await NotificationEngine.dispatchBatch(events);
}
