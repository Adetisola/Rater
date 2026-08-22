/**
 * Supabase Database Webhook — /api/webhooks/supabase
 *
 * Receives Supabase database mutation events (INSERT/UPDATE/DELETE) and routes
 * them to the appropriate event handlers and NotificationEngine.
 *
 * Security: Verified via the `x-webhook-secret` request header.
 */

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { sendWelcomeEmail } from '@/lib/email/events';
import { globalLogger } from '@/lib/logger';
import { 
  normalizeReviewInsertEvent, 
  normalizeBadgeInsertEvent, 
  normalizeFeedbackCommentInsertEvent 
} from '@/lib/notifications/normalizers';
import { NotificationEngine } from '@/lib/notifications/engine';

function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function POST(req: Request) {
  // 1. Authenticate via header
  const incomingSecret = req.headers.get('x-webhook-secret');
  const expectedSecret = process.env.WEBHOOK_SECRET;

  if (!incomingSecret || !expectedSecret || !safeCompare(incomingSecret, expectedSecret)) {
    globalLogger.warn('[Webhook/Supabase] Unauthorized request — invalid or missing x-webhook-secret');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let payload: {
    type: string;
    table: string;
    record: Record<string, any>;
    old_record: Record<string, any> | null;
  };

  try {
    payload = await req.json();
  } catch {
    globalLogger.warn('[Webhook/Supabase] Invalid JSON payload');
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { type, table, record } = payload;

  // 2. profiles INSERT → WELCOME_USER
  if (table === 'profiles' && type === 'INSERT') {
    let email = typeof record.email === 'string' && record.email ? record.email : null;
    let name = typeof record.name === 'string' ? record.name : '';
    const userId = typeof record.id === 'string' ? record.id : null;

    if (!email && userId) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (supabaseUrl && serviceRoleKey) {
        try {
          const adminClient = createClient(supabaseUrl, serviceRoleKey);
          const { data: authUser } = await adminClient.auth.admin.getUserById(userId);
          if (authUser?.user?.email) {
            email = authUser.user.email;
            if (!name && authUser.user.user_metadata?.name) {
              name = authUser.user.user_metadata.name;
            }
          }
        } catch (adminErr) {
          globalLogger.error('[Webhook/Supabase] Failed to fetch email from Auth admin', {
            userId,
            error: adminErr instanceof Error ? adminErr.message : String(adminErr),
          });
        }
      }
    }

    if (email) {
      await sendWelcomeEmail(email, name);
      globalLogger.info('[Webhook/Supabase] WELCOME_USER triggered', { userId });
    }

    return NextResponse.json({ ok: true, message: 'Profile created event handled' });
  }

  // 3. reviews INSERT → Normalized Critique & Rating Unlock Events
  if (table === 'reviews' && type === 'INSERT') {
    const events = await normalizeReviewInsertEvent(record);
    if (events.length > 0) {
      await NotificationEngine.dispatchBatch(events);
    }
    return NextResponse.json({ ok: true, message: `Processed ${events.length} review events` });
  }

  // 4. badges INSERT → Top Rated Milestone Event
  if (table === 'badges' && type === 'INSERT') {
    const events = await normalizeBadgeInsertEvent(record);
    if (events.length > 0) {
      await NotificationEngine.dispatchBatch(events);
    }
    return NextResponse.json({ ok: true, message: `Processed ${events.length} badge events` });
  }

  // 5. feedback_comments INSERT → Feedback Response Event
  if (table === 'feedback_comments' && type === 'INSERT') {
    const events = await normalizeFeedbackCommentInsertEvent(record);
    if (events.length > 0) {
      await NotificationEngine.dispatchBatch(events);
    }
    return NextResponse.json({ ok: true, message: `Processed ${events.length} feedback comment events` });
  }

  // 6. posts INSERT → First Work Published Milestone
  if (table === 'posts' && type === 'INSERT') {
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { count } = await adminClient
      .from('posts')
      .select('id', { count: 'exact', head: true })
      .eq('avatar_id', record.avatar_id)
      .eq('is_deleted', false);

    if (count === 1) {
      await NotificationEngine.dispatch({
        eventType: 'FIRST_WORK_PUBLISHED',
        recipientProfileId: record.avatar_id,
        targetEntityId: record.id,
        idempotencyKey: `first_work:${record.id}`,
        metadata: { workTitle: record.title },
      });
    }

    return NextResponse.json({ ok: true, message: 'Post event processed' });
  }

  return NextResponse.json({ ok: true, message: 'Event not handled' });
}
