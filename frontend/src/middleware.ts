// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Public endpoints avoided for refresh token
    const publicPaths = [
        '/api/me',
        '/api/login',
        '/api/register',
        '/api/admin/settings',
    ];

    if (publicPaths.some(p => pathname.startsWith(p))) {
        return NextResponse.next();
    }

    const accessToken = request.cookies.get('access_token');
    const refreshToken = request.cookies.get('refresh_token');


    // If access token is missing but refresh exists, trigger refresh
    if (!accessToken && refreshToken) {
        const refreshRes = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Cookie': `refresh_token=${refreshToken.value}` },
        });

        if (refreshRes.ok) {
            const response = NextResponse.next();
            const setCookieHeaders = refreshRes.headers.getSetCookie();

            setCookieHeaders.forEach((cookie) => {
                response.headers.append('Set-Cookie', cookie);
            });

            return response;
        } else {
            // If refresh fails (401), don't try to parse .json()
            // Just redirect them to login
            console.error("Refresh failed with status:", refreshRes.status);
            if (pathname.startsWith('/home') || pathname.startsWith('/admin')) {
                return NextResponse.redirect(new URL('/login', request.url));
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/home/:path*', '/admin/:path*'], // Routes to protect
};