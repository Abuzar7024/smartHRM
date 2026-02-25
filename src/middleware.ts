import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const sessionUrl = request.cookies.get('session');
    const { pathname, origin } = request.nextUrl;

    const isDashboardRoute = pathname.startsWith('/dashboard');

    if (!sessionUrl && isDashboardRoute) {
        console.log("No session found. Redirecting to login.");
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (sessionUrl && isDashboardRoute) {
        try {
            // Internal verification check
            const res = await fetch(`${origin}/api/auth/verify`, {
                headers: { Cookie: `session=${sessionUrl.value}` }
            });

            if (!res.ok) throw new Error("Verification failed");

            // We could parse the role here and make decisions internally if needed 
            // e.g: const data = await res.json();
            // if (data.role !== 'employer' && pathname.includes('payroll')) {}

            return NextResponse.next();
        } catch (error) {
            console.error("Middleware Auth Verification Error:", error);
            const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
            redirectResponse.cookies.delete('session');
            return redirectResponse;
        }
    }

    // Public pages like login, etc
    if (sessionUrl && pathname === '/login') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*', '/login'],
};
