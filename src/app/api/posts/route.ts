/**
 * Posts API Route — /api/posts
 *
 * Handles authenticated post creation on the server and dispatches
 * multi-channel notifications (NEW_WORK_PUBLISHED, FIRST_WORK_PUBLISHED)
 * through NotificationEngine.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { dispatchNewWorkPublished } from '@/lib/notifications/resolvers';
import { NotificationEngine } from '@/lib/notifications/engine';
import { globalLogger } from '@/lib/logger';

function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // 1. Resolve User (Strictly Authenticated Only)
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonError('Unauthorized: Must be logged in to publish work.', 401);
    }

    const token = authHeader.split(' ')[1];
    const { data: authData } = await supabase.auth.getUser(token);
    const user = authData?.user;

    if (!user) {
      return jsonError('Unauthorized: Invalid or expired session.', 401);
    }

    // 2. Validate Required Post Payload
    const title = (payload.title || '').trim();
    const category = payload.category;
    const imageUrl = payload.image_url || (Array.isArray(payload.media) ? payload.media[0]?.url : '');

    if (!title) {
      return jsonError('Bad Request: Work title is required.', 400);
    }
    if (!category) {
      return jsonError('Bad Request: Category is required.', 400);
    }
    if (!imageUrl) {
      return jsonError('Bad Request: At least one media asset or image URL is required.', 400);
    }

    // 3. Scoped Client with caller token (Enforces RLS)
    const scopedClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );

    const newPostRecord = {
      avatar_id: user.id,
      title,
      description: payload.description || null,
      category,
      image_url: imageUrl,
      media: Array.isArray(payload.media) ? payload.media : [],
      uses_ai: Boolean(payload.uses_ai),
      ai_tool: payload.uses_ai ? (payload.ai_tool || null) : null,
      ai_prompt: payload.uses_ai ? (payload.ai_prompt || null) : null,
      is_deleted: false,
    };

    const { data: postData, error: insertError } = await scopedClient
      .from('posts')
      .insert([newPostRecord])
      .select('*, profiles(id, username, name, avatar_url)')
      .single();

    if (insertError || !postData) {
      globalLogger.error('[API/posts] Failed to create post:', {
        userId: user.id,
        error: insertError?.message,
      });
      return jsonError(insertError?.message || 'Failed to create post.', 500);
    }

    const { profiles, ...post } = postData as any;
    const formattedPost = { ...post, author: profiles };

    // 4. Non-blocking Server-side Notifications Dispatch
    (async () => {
      try {
        // A. Community Discovery: NEW_WORK_PUBLISHED
        await dispatchNewWorkPublished(postData);

        // B. Author Milestone: FIRST_WORK_PUBLISHED (If first published work)
        const adminUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        if (adminUrl && adminKey) {
          const adminClient = createClient(adminUrl, adminKey);
          const { count } = await adminClient
            .from('posts')
            .select('id', { count: 'exact', head: true })
            .eq('avatar_id', user.id)
            .eq('is_deleted', false);

          if (count === 1) {
            await NotificationEngine.dispatch({
              eventType: 'FIRST_WORK_PUBLISHED',
              recipientProfileId: user.id,
              targetEntityId: postData.id,
              idempotencyKey: `first_work:${postData.id}`,
              metadata: { workTitle: postData.title },
            });
          }
        }
      } catch (notifErr) {
        globalLogger.warn('[API/posts] Non-blocking notification dispatch failed:', {
          postId: postData.id,
          error: notifErr instanceof Error ? notifErr.message : String(notifErr),
        });
      }
    })();

    return NextResponse.json({ ok: true, post: formattedPost });
  } catch (err: any) {
    globalLogger.error('[API/posts] Unexpected server error:', {
      error: err?.message || String(err),
    });
    return jsonError(err?.message || 'Internal server error.', 500);
  }
}
