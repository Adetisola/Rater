// middleware.ts (project root)
import { type NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Block direct navigation to admin routes for non-admin users
  // (Full auth check lives in the layout — middleware acts as first line of defense)
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // Redirect to home if no session cookie at all
    const hasSession = request.cookies.has('sb-ubkimszybusvsydxgank-auth-token');
    if (!hasSession) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
