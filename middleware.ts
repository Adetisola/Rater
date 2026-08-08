// middleware.ts (project root)
import { type NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Only initialize if env vars are present (prevents crash if user hasn't added them yet)
let ratelimit: Ratelimit | undefined;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  ratelimit = new Ratelimit({
    redis: redis,
    limiter: Ratelimit.slidingWindow(50, '10 s'),
    ephemeralCache: new Map(),
  });
}

export async function middleware(request: NextRequest) {
  // 1. Rate Limiting for API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (ratelimit) {
      // Use IP for rate limiting
      const ip = request.headers.get('x-forwarded-for') ?? 
                 request.headers.get('x-real-ip') ?? 
                 '127.0.0.1';
                 
      const { success, limit, reset, remaining } = await ratelimit.limit(ip);
      
      if (!success) {
        return new NextResponse(JSON.stringify({ error: 'Too many requests' }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': reset.toString(),
          },
        });
      }
    }
  }

  // 2. Block direct navigation to admin routes for non-admin users
  // (Full auth check lives in the layout — middleware acts as first line of defense)
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Redirect to home if no session cookie at all.
    // SECURITY NOTE: This only checks existence of the cookie, not validity or admin status.
    // Full auth/admin check happens server-side in admin/layout.tsx.
    // NOTE: 'sb-ubkimszybusvsydxgank-auth-token' is hardcoded and will break if the Supabase project changes.
    const hasSession = request.cookies.has('sb-ubkimszybusvsydxgank-auth-token');
    if (!hasSession) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/:path*'],
};
