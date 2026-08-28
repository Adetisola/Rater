import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

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
 * DELETE /api/critiques/replies/[replyId]
 * Soft-deletes a critique reply by setting deleted_at = NOW() and deleted_by = user.id.
 * Authorized for reply author or admins.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ replyId: string }> }
) {
  try {
    const { replyId } = await params;
    if (!replyId) {
      return jsonError('Missing reply ID', 400);
    }

    // 1. Authenticate user
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonError('Unauthorized: Must be logged in to delete a reply.', 401);
    }

    const token = authHeader.split(' ')[1];
    const { data: authData, error: authErr } = await supabase.auth.getUser(token);
    const user = authData?.user;

    if (authErr || !user) {
      return jsonError('Unauthorized: Invalid or expired token.', 401);
    }

    const adminClient = getAdminClient();
    if (!adminClient) {
      return jsonError('Server configuration error.', 500);
    }

    // 2. Fetch user profile to check admin status
    const { data: profile } = await adminClient
      .from('profiles')
      .select('id, is_admin, is_blocked')
      .eq('id', user.id)
      .single();

    if (profile?.is_blocked) {
      return jsonError('Account is blocked.', 403);
    }

    // 3. Fetch reply
    const { data: reply, error: fetchErr } = await adminClient
      .from('critique_replies')
      .select('id, author_id, deleted_at')
      .eq('id', replyId)
      .single();

    if (fetchErr || !reply) {
      return jsonError('Reply not found.', 404);
    }

    const isAuthor = reply.author_id === user.id;
    const isAdmin = Boolean(profile?.is_admin);

    if (!isAuthor && !isAdmin) {
      return jsonError('Forbidden: You do not have permission to delete this reply.', 403);
    }

    // 4. Soft-delete the reply
    const { error: updateErr } = await adminClient
      .from('critique_replies')
      .update({
        deleted_at: new Date().toISOString(),
        deleted_by: user.id,
      })
      .eq('id', replyId);

    if (updateErr) {
      console.error('[API/replies DELETE] Error soft-deleting reply:', updateErr);
      return jsonError(updateErr.message || 'Failed to delete reply.', 500);
    }

    return NextResponse.json({ ok: true, message: 'Reply deleted.' }, { status: 200 });
  } catch (err: any) {
    console.error('[API/replies DELETE] Unexpected error:', err);
    return jsonError(err?.message || 'Internal server error', 500);
  }
}
