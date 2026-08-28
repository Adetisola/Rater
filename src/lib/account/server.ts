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
            // Can happen in Server Actions where response is already streaming
          }
        },
      },
    }
  );
}

/**
 * Creates an elevated Supabase client with the Service Role key.
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
 * Permanently deletes the authenticated caller's account and associated data.
 */
export async function deleteOwnAccount(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    const supabase = await createRequestSupabase();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { ok: false, error: 'Authentication required to delete account.' };
    }

    const adminSupabase = getAdminSupabase();

    // 1. Delete user's posts, reviews, and profile data from public tables
    await adminSupabase.from('posts').delete().eq('avatar_id', user.id);
    await adminSupabase.from('reviews').delete().eq('reviewer_id', user.id);
    await adminSupabase.from('feedback_requests').delete().eq('author_id', user.id);
    await adminSupabase.from('feedback_comments').delete().eq('author_id', user.id);
    await adminSupabase.from('feedback_votes').delete().eq('user_id', user.id);
    await adminSupabase.from('profiles').delete().eq('id', user.id);

    // 2. Delete Supabase Auth record and revoke all active sessions
    const { error: deleteAuthError } = await adminSupabase.auth.admin.deleteUser(user.id);
    if (deleteAuthError) {
      console.error('Failed to delete auth user record:', deleteAuthError);
      return { ok: false, error: deleteAuthError.message || 'Failed to delete user account.' };
    }

    // 3. Clear session
    await supabase.auth.signOut();

    return { ok: true };
  } catch (err: any) {
    console.error('Error during account deletion:', err);
    return { ok: false, error: err?.message || 'An unexpected error occurred while deleting your account.' };
  }
}
