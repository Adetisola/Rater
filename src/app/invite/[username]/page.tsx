import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '@/types/supabase';

interface InvitePageProps {
  params: Promise<{
    username: string;
  }>;
}

/**
 * Referral link resolution route: /invite/@username or /invite/username
 *
 * Resolves the given username to the user's UUID and redirects to /browse?referrer=<uuid>.
 * The client useReferralCapture hook then stores the referrer UUID in sessionStorage.
 * If the username is invalid or not found, silently redirects to /browse.
 */
export default async function InvitePage({ params }: InvitePageProps) {
  const { username: rawUsername } = await params;

  if (!rawUsername) {
    redirect('/browse');
  }

  // Strip optional '@' or URL encoding from handle
  const cleanHandle = decodeURIComponent(rawUsername).replace(/^@+/, '').trim().toLowerCase();

  if (!cleanHandle) {
    redirect('/browse');
  }

  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
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
            // Ignored in Server Component
          }
        },
      },
    }
  );

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, is_blocked')
    .eq('username', cleanHandle)
    .single();

  if (!profile?.id || profile.is_blocked) {
    // Referrer not found or blocked: redirect to browse without referral param
    redirect('/browse');
  }

  // Redirect to browse with the resolved referrer UUID
  redirect(`/browse?referrer=${encodeURIComponent(profile.id)}`);
}
