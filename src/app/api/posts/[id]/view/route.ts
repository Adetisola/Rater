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
        // 1. Auth Client to securely resolve identity from cookies/headers
        const authClient = createServerClient(
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
        
        // 2. Admin Client to securely execute the RPC and perform server-side validation
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
        if (!serviceRoleKey) {
            console.error("Missing Service Role Key configuration");
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }

        const adminClient = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            {
                cookies: {
                    getAll() { return []; },
                    setAll() {}
                }
            }
        );
        
        // Try to get authenticated user
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.split(' ')[1];
        
        let viewerId = null;
        if (token) {
            const { data: { user } } = await authClient.auth.getUser(token);
            viewerId = user?.id || null;
        } else {
            const { data: { user } } = await authClient.auth.getUser();
            viewerId = user?.id || null;
        }
        
        // Server-Side Validation: Ensure post exists and is not deleted
        const { data: post, error: postError } = await adminClient
            .from('posts')
            .select('avatar_id, is_deleted, deleted_at')
            .eq('id', postId)
            .single();
            
        if (postError || !post) {
            return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }
        
        // Example check if soft deleted or blocked (adapt to your exact schema rules)
        if (post.deleted_at !== null || post.is_deleted) {
            return NextResponse.json({ error: 'Post is unavailable' }, { status: 403 });
        }

        // Exclude creator views server-side
        if (viewerId && post.avatar_id === viewerId) {
            return NextResponse.json({ incremented: false, reason: 'creator' });
        }
        
        // Handle guest session identity
        let guestSessionId = request.cookies.get('guest_session_id')?.value;
        let setCookieHeader = null;

        if (!viewerId) {
            if (!guestSessionId) {
                // Generate a new secure guest session ID server-side
                guestSessionId = crypto.randomUUID();
                // We will set this in the response headers later
                setCookieHeader = `guest_session_id=${guestSessionId}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=31536000`; // 1 year
            }
        }

        const guestSessionHash = (!viewerId && guestSessionId) ? hashValue(guestSessionId) : null;
        
        // Get IP and User-Agent for bot heuristics and abuse protection
        const ip = request.headers.get('x-forwarded-for') || 'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';
        
        const ipHash = hashValue(ip);
        const userAgentHash = hashValue(userAgent);

        // Call our atomic RPC using the highly-privileged adminClient
        // The RPC enforces 24-hour deduplication and IP abuse limits
        const { data: incremented, error: rpcError } = await adminClient.rpc('record_post_view', {
            p_post_id: postId,
            p_viewer_id: viewerId,
            p_guest_session_hash: guestSessionHash,
            p_ip_hash: ipHash,
            p_user_agent_hash: userAgentHash,
            p_ip_threshold: 10 // Configurable IP abuse threshold
        });

        if (rpcError) {
            console.error('Error recording post view via RPC:', rpcError);
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
