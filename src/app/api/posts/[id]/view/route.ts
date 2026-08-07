import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import crypto from 'crypto';

function hashValue(value: string): string {
    return crypto.createHash('sha256').update(value).digest('hex');
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: postId } = await params;

    if (!postId) {
        return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    try {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return request.cookies.getAll();
                    },
                    setAll(_cookiesToSet) {
                        // View route only reads cookies for auth
                    }
                }
            }
        );
        
        // Try to get authenticated user
        const { data: { user } } = await supabase.auth.getUser();
        let viewerId = user?.id || null;
        
        // Handle guest session identity
        let guestSessionId = request.cookies.get('guest_session_id')?.value;
        let setCookieHeader = null;

        if (!viewerId) {
            if (!guestSessionId) {
                // Generate a new secure guest session ID
                guestSessionId = crypto.randomUUID();
                // We will set this in the response headers later
                setCookieHeader = `guest_session_id=${guestSessionId}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=31536000`; // 1 year
            }
        }

        const guestSessionHash = (!viewerId && guestSessionId) ? hashValue(guestSessionId) : null;
        
        // Get IP and User-Agent for bot heuristics
        // Note: In Next.js App Router, request.ip is available if deployed on Vercel
        const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';
        
        const ipHash = hashValue(ip);
        const userAgentHash = hashValue(userAgent);

        // Call our atomic RPC
        const { data: incremented, error } = await supabase.rpc('record_post_view', {
            p_post_id: postId,
            p_viewer_id: viewerId,
            p_guest_session_hash: guestSessionHash,
            p_ip_hash: ipHash,
            p_user_agent_hash: userAgentHash
        });

        if (error) {
            console.error('Error recording post view:', error);
            return NextResponse.json({ error: 'Failed to record view' }, { status: 500 });
        }

        const response = NextResponse.json({ incremented: !!incremented });
        
        if (setCookieHeader) {
            response.headers.set('Set-Cookie', setCookieHeader);
        }
        
        return response;

    } catch (error) {
        console.error('Unexpected error in view route:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
