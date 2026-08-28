'use server';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

/**
 * Creates an authenticated Supabase server client bound to the current request's cookies.
 */
async function createRequestSupabase() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            // Ignored in Server Actions
          }
        },
      },
    }
  );
}

/**
 * Creates an elevated Supabase client with the Service Role key for secure server-side inserts.
 */
function getAdminSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured.');
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

/**
 * User-facing Server Action: Log a post share event.
 *
 * Security guarantees:
 * - user_id is ALWAYS derived from the authenticated session, never accepted from the client.
 * - Validates caller exists and is not blocked.
 * - Validates post exists and is not soft/hard deleted.
 * - Uses service role to insert into share_events table.
 */
export async function logShareEvent(
  postId: string,
  shareMethod: 'native' | 'copy_link' | string = 'native'
): Promise<{ ok: boolean; error?: string }> {
  try {
    if (!postId) return { ok: false, error: 'Missing postId' };

    const supabase = await createRequestSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      // Unauthenticated users browsing can still share via browser, but we only log events for registered users
      return { ok: false, error: 'Unauthenticated' };
    }

    const adminSupabase = getAdminSupabase();

    // 1. Verify user is not blocked
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('is_blocked')
      .eq('id', user.id)
      .single();

    if (profile?.is_blocked) {
      return { ok: false, error: 'User is blocked' };
    }

    // 2. Verify post exists and is not deleted
    const { data: post } = await adminSupabase
      .from('posts')
      .select('id, is_deleted')
      .eq('id', postId)
      .single();

    if (!post || post.is_deleted) {
      return { ok: false, error: 'Post not found or deleted' };
    }

    // 3. Insert share event
    const { error: insertError } = await adminSupabase
      .from('share_events')
      .insert({
        user_id: user.id,
        post_id: postId,
        share_method: shareMethod,
      });

    if (insertError) {
      console.error('Failed to insert share event:', insertError);
      return { ok: false, error: insertError.message };
    }

    return { ok: true };
  } catch (err: any) {
    console.error('Error logging share event:', err);
    return { ok: false, error: err?.message || 'Internal error' };
  }
}
