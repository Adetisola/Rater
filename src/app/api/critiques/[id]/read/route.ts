import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/**
 * POST /api/critiques/[id]/read
 * Updates the user's last_read_reply_at timestamp in critique_reply_reads table.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: critiqueId } = await params;
    if (!critiqueId) {
      return NextResponse.json({ ok: false, error: 'Missing critique ID' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { data: authData } = await supabase.auth.getUser(token);
    const user = authData?.user;

    if (!user) {
      return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const adminClient = getAdminClient() || supabase;
    const now = new Date().toISOString();

    const { error } = await adminClient
      .from('critique_reply_reads')
      .upsert(
        {
          user_id: user.id,
          critique_id: critiqueId,
          last_read_reply_at: now,
          updated_at: now,
        },
        { onConflict: 'user_id,critique_id' }
      );

    if (error) {
      console.warn('[API/read] Error updating read state:', error);
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: any) {
    console.error('[API/read] Unexpected error:', err);
    return NextResponse.json({ ok: false, error: err?.message || 'Internal server error' }, { status: 500 });
  }
}
