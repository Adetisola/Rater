import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function createRouteSupabase() {
  const cookieStore = await cookies();
  return createServerClient(
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
            // Handled when response is already streaming
          }
        },
      },
    }
  );
}

async function getAuthenticatedUser(req: NextRequest, supabase: Awaited<ReturnType<typeof createRouteSupabase>>) {
  // Check Authorization Bearer header first if present as fallback
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.split(' ')[1] : undefined;

  if (token) {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (!error && user) return user;
  }

  // Primary: Read authenticated session from cookies
  const { data: { user }, error } = await supabase.auth.getUser();
  if (!error && user) return user;

  return null;
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createRouteSupabase();
    const user = await getAuthenticatedUser(req, supabase);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint, p256dh, auth, userAgent, expiresAt } = body;

    if (!endpoint || !p256dh || !auth) {
      return NextResponse.json({ error: 'Missing required push subscription fields' }, { status: 400 });
    }

    // Bind strictly to the authenticated user ID — client-supplied profileId is ignored completely
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          profile_id: user.id,
          endpoint,
          p256dh,
          auth,
          user_agent: userAgent || null,
          // Optional metadata: browser-reported expiration. May be null.
          // Not used for pruning — reactive 410/404 detection is authoritative.
          expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' }
      );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createRouteSupabase();
    const user = await getAuthenticatedUser(req, supabase);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { endpoint } = body;

    if (!endpoint) {
      return NextResponse.json({ error: 'Missing endpoint' }, { status: 400 });
    }

    // Only allow deleting subscriptions belonging to the authenticated user
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('profile_id', user.id)
      .eq('endpoint', endpoint);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Server error' }, { status: 500 });
  }
}
