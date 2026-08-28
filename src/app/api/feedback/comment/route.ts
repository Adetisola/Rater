import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // 1. Resolve User
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonError('Unauthorized: Must be logged in to comment.', 401);
    }

    const token = authHeader.split(' ')[1];
    const { data: authData } = await supabase.auth.getUser(token);
    const user = authData?.user;

    if (!user) {
      return jsonError('Unauthorized: Invalid or expired token.', 401);
    }

    const requestId = payload.requestId;
    const content = (payload.content || '').trim().slice(0, 1000);

    if (!requestId || !content) {
      return jsonError('Bad Request: Missing requestId or comment content.', 400);
    }

    // 2. Scoped Client for RLS check
    const scopedClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );

    // 3. Verify Feedback Request is not locked
    const { data: feedbackReq, error: reqErr } = await scopedClient
      .from('feedback_requests')
      .select('id, title, slug, author_id, is_locked')
      .eq('id', requestId)
      .single();

    if (reqErr || !feedbackReq) {
      return jsonError('Feedback request not found.', 404);
    }

    if (feedbackReq.is_locked) {
      return jsonError('Discussion is closed for this feedback request.', 403);
    }

    // 4. Insert Comment
    const { data: commentData, error: commentErr } = await scopedClient
      .from('feedback_comments')
      .insert({
        request_id: requestId,
        author_id: user.id,
        content,
      })
      .select('*, author:profiles!feedback_comments_author_id_fkey(name, username, avatar_url, bg_color)')
      .single();

    if (commentErr || !commentData) {
      console.error('[API/feedback/comment] Error inserting comment:', commentErr);
      return jsonError(commentErr?.message || 'Failed to post comment.', 500);
    }

    // 5. Dispatch Notifications to Author & Followers (Non-blocking)
    try {
      const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

      if (adminUrl && adminKey) {
        const adminSupabase = createClient(adminUrl, adminKey);

        const { data: followRows } = await adminSupabase
          .from('feedback_follows')
          .select('user_id')
          .eq('request_id', requestId);

        const followerIds = (followRows || []).map((f) => f.user_id);
        const recipientIds = Array.from(
          new Set([feedbackReq.author_id, ...followerIds])
        ).filter((id) => id && id !== user.id);

        if (recipientIds.length > 0) {
          const { NotificationEngine } = await import('@/lib/notifications/engine');

          for (const recipientId of recipientIds) {
            await NotificationEngine.dispatch({
              eventType: 'FEEDBACK_COMMENT_RECEIVED',
              recipientProfileId: recipientId,
              actorProfileId: user.id,
              feedbackRequestId: requestId,
              idempotencyKey: `feedback_comment_${commentData.id}_${recipientId}`,
              metadata: {
                feedbackTitle: feedbackReq.title,
                feedbackSlug: feedbackReq.slug,
                commentId: commentData.id,
              },
            }).catch((err) =>
              console.warn('[API/feedback/comment] Notification dispatch error:', err)
            );
          }
        }
      }
    } catch (notifErr) {
      console.warn('[API/feedback/comment] Failed to dispatch notifications (non-blocking):', notifErr);
    }

    return NextResponse.json({ ok: true, data: commentData }, { status: 200 });
  } catch (error: any) {
    console.error('API /feedback/comment POST error:', error);
    return jsonError('Internal server error', 500);
  }
}
