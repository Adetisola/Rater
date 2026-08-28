/**
 * Webhook & Event Normalizer
 *
 * Transforms raw database mutation payloads into structured notification events
 * using authoritative DB lookups.
 */

import { createClient } from '@supabase/supabase-js';
import type { NormalizedNotificationEvent } from './types';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * Normalizes a review INSERT event from the database webhook.
 */
export async function normalizeReviewInsertEvent(record: Record<string, any>): Promise<NormalizedNotificationEvent[]> {
  const adminClient = getAdminClient();
  if (!adminClient || !record?.post_id) return [];

  try {
    // 1. Fetch target post author and details
    const { data: post, error: postErr } = await adminClient
      .from('posts')
      .select('id, title, avatar_id, is_deleted')
      .eq('id', record.post_id)
      .single();

    if (postErr || !post || post.is_deleted) return [];

    // Suppress notifications on self-critique
    if (post.avatar_id === record.reviewer_id) return [];

    // 2. Authoritative critique count from database
    const { count: actualCount, error: countErr } = await adminClient
      .from('reviews')
      .select('id', { count: 'exact', head: true })
      .eq('post_id', record.post_id);

    if (countErr) {
      console.error('[Normalizer] Error fetching review count:', countErr);
    }

    const reviewCount = actualCount ?? 1;
    const events: NormalizedNotificationEvent[] = [];

    // 3. Critique Received Notification
    events.push({
      eventType: reviewCount === 1 ? 'FIRST_CRITIQUE_RECEIVED' : 'CRITIQUE_RECEIVED',
      recipientProfileId: post.avatar_id,
      actorProfileId: record.reviewer_id || null,
      targetEntityId: post.id,
      idempotencyKey: `critique:${record.id}`,
      groupKey: `post_critique:${post.id}`,
      metadata: {
        workTitle: post.title,
        reviewId: record.id,
        reviewCount,
      },
    });

    // 4. Overall Score Unlock Notification (Fires precisely when reaching 3 reviews)
    if (reviewCount === 3) {
      events.push({
        eventType: 'WORK_RATING_UNLOCKED',
        recipientProfileId: post.avatar_id,
        actorProfileId: null,
        targetEntityId: post.id,
        idempotencyKey: `rating_unlocked:${post.id}`,
        groupKey: `post_unlock:${post.id}`,
        metadata: {
          workTitle: post.title,
        },
      });
    }

    return events;
  } catch (err) {
    console.error('[Normalizer] Failed to normalize review insert event:', err);
    return [];
  }
}

/**
 * Normalizes a badge INSERT event from the database webhook.
 */
export async function normalizeBadgeInsertEvent(record: Record<string, any>): Promise<NormalizedNotificationEvent[]> {
  if (record?.badge_type !== 'top_rated_active' || !record?.post_id) return [];

  const adminClient = getAdminClient();
  if (!adminClient) return [];

  try {
    const { data: post } = await adminClient
      .from('posts')
      .select('id, title, avatar_id, is_deleted')
      .eq('id', record.post_id)
      .single();

    if (!post || post.is_deleted) return [];

    return [{
      eventType: 'BADGE_TOP_RATED_AWARDED',
      recipientProfileId: post.avatar_id,
      actorProfileId: null,
      targetEntityId: post.id,
      idempotencyKey: `badge_top_rated:${record.id || post.id}`,
      groupKey: `post_badge:${post.id}`,
      metadata: {
        workTitle: post.title,
        badgeId: record.id,
      },
    }];
  } catch (err) {
    console.error('[Normalizer] Failed to normalize badge event:', err);
    return [];
  }
}

/**
 * Normalizes a feedback comment INSERT event.
 */
export async function normalizeFeedbackCommentInsertEvent(record: Record<string, any>): Promise<NormalizedNotificationEvent[]> {
  const adminClient = getAdminClient();
  if (!adminClient || !record?.request_id) return [];

  try {
    const { data: feedbackReq } = await adminClient
      .from('feedback_requests')
      .select('id, title, slug, author_id')
      .eq('id', record.request_id)
      .single();

    if (!feedbackReq || feedbackReq.author_id === record.author_id) return [];

    return [{
      eventType: 'FEEDBACK_REQUEST_REPLY',
      recipientProfileId: feedbackReq.author_id,
      actorProfileId: record.author_id || null,
      feedbackRequestId: feedbackReq.id,
      idempotencyKey: `feedback_reply:${record.id}`,
      groupKey: `feedback_reply:${feedbackReq.id}`,
      metadata: {
        feedbackTitle: feedbackReq.title,
        feedbackSlug: feedbackReq.slug,
        commentId: record.id,
      },
    }];
  } catch (err) {
    console.error('[Normalizer] Failed to normalize feedback comment event:', err);
    return [];
  }
}
