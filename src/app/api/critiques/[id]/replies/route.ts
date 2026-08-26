import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import type { CritiqueReply, CritiqueRepliesResponse } from '@/types';

function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * GET /api/critiques/[id]/replies
 * Cursor-based pagination for critique replies.
 * Query params:
 * - limit: number of replies to fetch (default: 3, max: 50)
 * - cursor: ISO created_at string of the last item in previous page
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: critiqueId } = await params;
    if (!critiqueId) {
      return jsonError('Missing critique ID', 400);
    }

    const { searchParams } = new URL(req.url);
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '3', 10), 1), 50);
    const cursor = searchParams.get('cursor');
    const targetReplyId = searchParams.get('targetReplyId');

    const adminClient = getAdminClient() || supabase;

    // 1. Fetch total active replies count for this critique
    const { count: totalCount, error: countErr } = await adminClient
      .from('critique_replies')
      .select('id', { count: 'exact', head: true })
      .eq('critique_id', critiqueId)
      .is('deleted_at', null);

    if (countErr) {
      console.error('[API/replies] Error counting replies:', countErr);
    }

    // 1b. Target-aware window resolution: If targetReplyId is specified on initial page
    let effectiveLimit = limit;
    if (targetReplyId && !cursor) {
      const { data: targetRow } = await adminClient
        .from('critique_replies')
        .select('created_at')
        .eq('id', targetReplyId)
        .eq('critique_id', critiqueId)
        .maybeSingle();

      if (targetRow?.created_at) {
        const { count: targetRank } = await adminClient
          .from('critique_replies')
          .select('id', { count: 'exact', head: true })
          .eq('critique_id', critiqueId)
          .lte('created_at', targetRow.created_at);

        if (targetRank && targetRank > limit) {
          effectiveLimit = Math.min(targetRank, 50);
        }
      }
    }

    // 2. Query replies ordered chronologically (created_at ASC)
    let query = adminClient
      .from('critique_replies')
      .select(`
        id,
        critique_id,
        author_id,
        parent_reply_id,
        content,
        created_at,
        updated_at,
        deleted_at,
        deleted_by,
        author:profiles!critique_replies_author_id_fkey(id, username, name, avatar_url, bg_color)
      `)
      .eq('critique_id', critiqueId)
      .order('created_at', { ascending: true })
      .limit(effectiveLimit + 1);

    if (cursor) {
      query = query.gt('created_at', cursor);
    }

    const { data: rows, error: fetchErr } = await query;

    if (fetchErr) {
      console.error('[API/replies] Error fetching replies:', fetchErr);
      return jsonError('Failed to fetch replies', 500);
    }

    const rawReplies = rows || [];
    const hasMore = rawReplies.length > effectiveLimit;
    const pagedRows = hasMore ? rawReplies.slice(0, effectiveLimit) : rawReplies;
    const nextCursor = hasMore ? pagedRows[pagedRows.length - 1].created_at : null;

    // 3. Find parent replies and children relationships to resolve "Replying to @username" and tombstones
    const parentReplyIds = pagedRows.map((r: any) => r.parent_reply_id).filter(Boolean);
    let parentAuthorMap: Record<string, { username?: string; name?: string }> = {};

    if (parentReplyIds.length > 0) {
      const { data: parentRows } = await adminClient
        .from('critique_replies')
        .select('id, author:profiles!critique_replies_author_id_fkey(username, name)')
        .in('id', parentReplyIds);

      (parentRows || []).forEach((pr: any) => {
        parentAuthorMap[pr.id] = {
          username: pr.author?.username,
          name: pr.author?.name,
        };
      });
    }

    // Check which replies in this critique have child replies
    const allReplyIdsInPage = pagedRows.map((r: any) => r.id);
    let repliesWithChildrenSet = new Set<string>();

    if (allReplyIdsInPage.length > 0) {
      const { data: childRows } = await adminClient
        .from('critique_replies')
        .select('parent_reply_id')
        .in('parent_reply_id', allReplyIdsInPage)
        .is('deleted_at', null);

      (childRows || []).forEach((c: any) => {
        if (c.parent_reply_id) repliesWithChildrenSet.add(c.parent_reply_id);
      });
    }

    // 4. Map replies with tombstone logic:
    // If a reply is deleted but has active children -> tombstone ("This reply was deleted.")
    // If a reply is deleted and has NO children -> omit
    const formattedReplies: CritiqueReply[] = [];

    for (const row of pagedRows) {
      const isDeleted = Boolean(row.deleted_at);
      const hasChildren = repliesWithChildrenSet.has(row.id);

      if (isDeleted && !hasChildren) {
        continue;
      }

      const parentInfo = row.parent_reply_id ? parentAuthorMap[row.parent_reply_id] : undefined;

      formattedReplies.push({
        id: row.id,
        critique_id: row.critique_id,
        author_id: isDeleted ? '' : row.author_id,
        parent_reply_id: row.parent_reply_id || null,
        parent_reply_author_username: parentInfo?.username || null,
        parent_reply_author_name: parentInfo?.name || null,
        content: isDeleted ? 'This reply was deleted.' : row.content,
        created_at: row.created_at,
        updated_at: row.updated_at,
        deleted_at: row.deleted_at || null,
        deleted_by: row.deleted_by || null,
        author: isDeleted ? undefined : (row.author as any),
        has_children: hasChildren,
        is_tombstone: isDeleted,
      });
    }

    const responseData: CritiqueRepliesResponse = {
      replies: formattedReplies,
      nextCursor,
      totalCount: totalCount ?? formattedReplies.length,
    };

    return NextResponse.json({ ok: true, data: responseData }, { status: 200 });
  } catch (err: any) {
    console.error('[API/replies GET] Unexpected error:', err);
    return jsonError(err?.message || 'Internal server error', 500);
  }
}

/**
 * POST /api/critiques/[id]/replies
 * Creates a new threaded reply to a critique or to another reply.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: critiqueId } = await params;
    if (!critiqueId) {
      return jsonError('Missing critique ID', 400);
    }

    // 1. Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonError('Unauthorized: Must be logged in to reply.', 401);
    }

    const token = authHeader.split(' ')[1];
    const { data: authData, error: authErr } = await supabase.auth.getUser(token);
    const user = authData?.user;

    if (authErr || !user) {
      return jsonError('Unauthorized: Invalid or expired token.', 401);
    }

    const payload = await req.json().catch(() => ({}));
    const rawContent = typeof payload.content === 'string' ? payload.content.trim() : '';
    const parentReplyId = payload.parent_reply_id || null;

    if (!rawContent) {
      return jsonError('Reply content cannot be empty.', 400);
    }

    if (rawContent.length > 1000) {
      return jsonError('Reply content exceeds 1000 characters.', 400);
    }

    const adminClient = getAdminClient();
    if (!adminClient) {
      return jsonError('Server configuration error.', 500);
    }

    // 2. Verify critique exists, post is active, and fetch post + critique details
    const { data: critique, error: critiqueErr } = await adminClient
      .from('reviews')
      .select('id, post_id, reviewer_id, posts!reviews_post_id_fkey(id, title, is_deleted, avatar_id)')
      .eq('id', critiqueId)
      .single();

    if (critiqueErr || !critique) {
      return jsonError('Critique not found.', 404);
    }

    const post = (critique as any).posts;
    if (!post || post.is_deleted) {
      return jsonError('Cannot reply to a deleted post or critique.', 400);
    }

    // 3. If parent_reply_id was provided, verify parent reply exists and belongs to this critique
    let parentReplyAuthorId: string | null = null;
    let parentReplyAuthorUsername: string | null = null;
    let parentReplyAuthorName: string | null = null;

    if (parentReplyId) {
      const { data: parentReply } = await adminClient
        .from('critique_replies')
        .select('id, author_id, critique_id, author:profiles!critique_replies_author_id_fkey(username, name)')
        .eq('id', parentReplyId)
        .eq('critique_id', critiqueId)
        .single();

      if (parentReply) {
        parentReplyAuthorId = parentReply.author_id;
        parentReplyAuthorUsername = (parentReply as any).author?.username || null;
        parentReplyAuthorName = (parentReply as any).author?.name || null;
      }
    }

    // 4. Insert the new reply
    const { data: insertedReply, error: insertErr } = await adminClient
      .from('critique_replies')
      .insert({
        critique_id: critiqueId,
        author_id: user.id,
        parent_reply_id: parentReplyId,
        content: rawContent,
      })
      .select('*, author:profiles!critique_replies_author_id_fkey(id, username, name, avatar_url, bg_color)')
      .single();

    if (insertErr || !insertedReply) {
      console.error('[API/replies POST] Error inserting reply:', insertErr);
      return jsonError(insertErr?.message || 'Failed to submit reply.', 500);
    }

    // 5. Update read state for the replying user (so they never see unread badge for their own action)
    try {
      await adminClient
        .from('critique_reply_reads')
        .upsert(
          {
            user_id: user.id,
            critique_id: critiqueId,
            last_read_reply_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,critique_id' }
        );
    } catch (e) {
      console.warn('[API/replies] Failed to update read state:', e);
    }

    // 6. Resolve Mentions and Dispatch Priority-Deduplicated Notifications (Non-blocking)
    (async () => {
      try {
        const { NotificationEngine } = await import('@/lib/notifications/engine');

        // Regex boundary matching for @username (3-20 chars alphanumeric, underscore, dot)
        const mentionRegex = /(?:^|\s)@([a-z0-9_.]{3,20})(?=$|[^\w.])/gi;
        const matchedUsernames = new Set<string>();
        let match: RegExpExecArray | null;

        while ((match = mentionRegex.exec(rawContent)) !== null) {
          const u = match[1].toLowerCase();
          if (u) matchedUsernames.add(u);
          if (matchedUsernames.size >= 5) break; // Maximum 5 mentions
        }

        // Resolve profile IDs for mentioned usernames
        let mentionedProfilesMap = new Map<string, string>(); // username -> profile_id
        if (matchedUsernames.size > 0) {
          const { data: matchedProfiles } = await adminClient
            .from('profiles')
            .select('id, username, is_blocked')
            .in('username', Array.from(matchedUsernames))
            .neq('is_blocked', true);

          (matchedProfiles || []).forEach((p) => {
            if (p.id !== user.id) {
              mentionedProfilesMap.set(p.username.toLowerCase(), p.id);
            }
          });
        }

        const mentionedProfileIds = Array.from(mentionedProfilesMap.values());

        // Target candidate resolution with priority deduplication:
        // Priority 1: Mention (REPLY_MENTION_RECEIVED)
        // Priority 2: Reply to Reply (REPLY_TO_REPLY_RECEIVED)
        // Priority 3: Reply to Critique (CRITIQUE_REPLY_RECEIVED)

        const notifiedRecipients = new Set<string>();

        // A. Mention Notifications
        for (const mentionedId of mentionedProfileIds) {
          if (mentionedId && mentionedId !== user.id && !notifiedRecipients.has(mentionedId)) {
            notifiedRecipients.add(mentionedId);
            await NotificationEngine.dispatch({
              eventType: 'REPLY_MENTION_RECEIVED',
              recipientProfileId: mentionedId,
              actorProfileId: user.id,
              targetEntityId: post.id,
              idempotencyKey: `reply_mention:${insertedReply.id}:${mentionedId}`,
              groupKey: `reply_thread:${critiqueId}`,
              metadata: {
                workTitle: post.title,
                critiqueId,
                replyId: insertedReply.id,
                postId: post.id,
              },
            });
          }
        }

        // B. Reply to Reply Notification
        if (
          parentReplyAuthorId &&
          parentReplyAuthorId !== user.id &&
          !notifiedRecipients.has(parentReplyAuthorId)
        ) {
          notifiedRecipients.add(parentReplyAuthorId);
          await NotificationEngine.dispatch({
            eventType: 'REPLY_TO_REPLY_RECEIVED',
            recipientProfileId: parentReplyAuthorId,
            actorProfileId: user.id,
            targetEntityId: post.id,
            idempotencyKey: `reply_to_reply:${insertedReply.id}:${parentReplyAuthorId}`,
            groupKey: `reply_thread:${critiqueId}`,
            metadata: {
              workTitle: post.title,
              critiqueId,
              replyId: insertedReply.id,
              postId: post.id,
              parentReplyId,
            },
          });
        }

        // C. Reply to Critique Author Notification
        if (
          critique.reviewer_id &&
          critique.reviewer_id !== user.id &&
          !notifiedRecipients.has(critique.reviewer_id)
        ) {
          notifiedRecipients.add(critique.reviewer_id);
          await NotificationEngine.dispatch({
            eventType: 'CRITIQUE_REPLY_RECEIVED',
            recipientProfileId: critique.reviewer_id,
            actorProfileId: user.id,
            targetEntityId: post.id,
            idempotencyKey: `critique_reply:${insertedReply.id}:${critique.reviewer_id}`,
            groupKey: `reply_thread:${critiqueId}`,
            metadata: {
              workTitle: post.title,
              critiqueId,
              replyId: insertedReply.id,
              postId: post.id,
            },
          });
        }
      } catch (notifErr) {
        console.warn('[API/replies POST] Notification dispatch failed (non-blocking):', notifErr);
      }
    })();

    const formattedResponse: CritiqueReply = {
      id: insertedReply.id,
      critique_id: insertedReply.critique_id,
      author_id: insertedReply.author_id,
      parent_reply_id: insertedReply.parent_reply_id || null,
      parent_reply_author_username: parentReplyAuthorUsername,
      parent_reply_author_name: parentReplyAuthorName,
      content: insertedReply.content,
      created_at: insertedReply.created_at,
      updated_at: insertedReply.updated_at,
      deleted_at: insertedReply.deleted_at || null,
      deleted_by: insertedReply.deleted_by || null,
      author: insertedReply.author as any,
      has_children: false,
      is_tombstone: false,
    };

    return NextResponse.json({ ok: true, data: formattedResponse }, { status: 201 });
  } catch (err: any) {
    console.error('[API/replies POST] Unexpected error:', err);
    return jsonError(err?.message || 'Internal server error', 500);
  }
}
