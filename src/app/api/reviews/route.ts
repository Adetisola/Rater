import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';

function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // 1. Resolve User (Strictly Authenticated Only)
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return jsonError('Unauthorized: Must be logged in to review.', 401);
    }
    
    const token = authHeader.split(' ')[1];
    const { data } = await supabase.auth.getUser(token);
    const user = data?.user;

    if (!user) {
      return jsonError('Unauthorized: Invalid or expired token.', 401);
    }

    if (!payload.post_id) {
      return jsonError('Bad Request: Missing post_id.', 400);
    }

    // 3. Build the DB Payload
    // Notice how we COMPLETELY IGNORE payload.reviewer_id and payload.device_id.
    // Ownership is derived entirely from the verified token.
    const dbPayload: any = {
      post_id: payload.post_id,
      reviewer_id: user.id,
      comment: payload.comment || null,
      updated_at: new Date().toISOString()
    };

    const allowedRatings = ['aesthetics', 'clarity', 'purpose', 'usability', 'recognition', 'impact', 'engagement', 'composition', 'detail'];
    if (payload.ratings) {
      allowedRatings.forEach((key: string) => {
        if (payload.ratings[key] !== undefined) {
          dbPayload[key] = payload.ratings[key];
        }
      });
    }

    const onConflict = 'post_id,reviewer_id';

    // 4. Insert/Update the Review using a Scoped Client
    const scopedClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${token}` } }
      }
    );

    const { data: reviewData, error } = await scopedClient
      .from('reviews')
      .upsert(dbPayload, { onConflict })
      .select()
      .single();

    if (error) {
      console.error('Error submitting review via API:', error);
      return jsonError(error.message || 'Database error', 500);
    }

    return NextResponse.json({ ok: true, review: reviewData }, { status: 200 });
  } catch (error: any) {
    console.error('API /reviews POST error:', error);
    return jsonError('Internal server error', 500);
  }
}
