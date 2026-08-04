import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

// Simple in-memory rate limiter for guest reviews.
// Prevents a single IP from spamming guest reviews via device_id rotation.
// SECURITY NOTE: This in-memory store resets on server restart and is not shared across edge nodes.
// For production at scale, you MUST use a persistent store like Upstash Redis to prevent rate limit bypasses.
// The client-side rate limit in PostDetailContent is just UX sugar and cannot be relied on for security.
const rateLimitMap = new Map<string, { count: number, resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 3; // Max 3 reviews per minute per IP

function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // 1. Resolve User (Authenticated or Guest)
    const authHeader = req.headers.get('authorization');
    let user = null;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
      const { data } = await supabase.auth.getUser(token);
      user = data?.user;
    }

    // 2. IP Rate Limiting (Crucial for guest reviews)
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const now = Date.now();
    const limitData = rateLimitMap.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    
    if (now > limitData.resetAt) {
      limitData.count = 1;
      limitData.resetAt = now + RATE_LIMIT_WINDOW_MS;
    } else {
      limitData.count++;
    }
    rateLimitMap.set(ip, limitData);

    if (limitData.count > MAX_REQUESTS_PER_WINDOW) {
      return jsonError('Too many reviews submitted. Please wait a moment before trying again.', 429);
    }

    if (!user && !payload.device_id) {
      return jsonError('Must provide either a logged-in user or a device_id for guest reviews.', 400);
    }

    // 3. Build the DB Payload
    const dbPayload: any = {
      post_id: payload.post_id,
      comment: payload.comment || null,
      updated_at: new Date().toISOString()
    };

    if (user) {
      dbPayload.reviewer_id = user.id;
    } else {
      dbPayload.device_id = payload.device_id;
      dbPayload.reviewer_name = payload.reviewer_name || 'Anonymous';
    }

    const allowedRatings = ['aesthetics', 'clarity', 'purpose', 'usability', 'recognition', 'impact', 'engagement', 'composition', 'detail'];
    if (payload.ratings) {
      allowedRatings.forEach((key: string) => {
        if (payload.ratings[key] !== undefined) {
          dbPayload[key] = payload.ratings[key];
        }
      });
    }

    const onConflict = user ? 'post_id,reviewer_id' : 'post_id,device_id';

    // 4. Insert/Update the Review using a Scoped Client
    // If authenticated, we use the user's token so RLS accepts the operation on their behalf.
    // If guest, we use the anon client.
    let scopedClient = supabase;
    if (token) {
      scopedClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: { headers: { Authorization: `Bearer ${token}` } }
        }
      );
    }

    const { data, error } = await scopedClient
      .from('reviews')
      .upsert(dbPayload, { onConflict })
      .select()
      .single();

    if (error) {
      console.error('Error submitting review via API:', error);
      return jsonError(error.message || 'Database error', 500);
    }

    return NextResponse.json({ ok: true, review: data }, { status: 200 });
  } catch (error: any) {
    console.error('API /reviews POST error:', error);
    return jsonError('Internal server error', 500);
  }
}
