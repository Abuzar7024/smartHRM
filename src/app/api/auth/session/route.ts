import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase.admin';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { idToken } = await request.json();

        // Check if token is provided
        if (!idToken) {
            return NextResponse.json({ error: 'No token provided' }, { status: 400 });
        }

        const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 days
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });

        // Set the cookie
        const cookieStore = await cookies();
        cookieStore.set('session', sessionCookie, {
            maxAge: expiresIn,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax',
        });

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error("Session creation error:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        const cookieStore = await cookies();
        cookieStore.delete('session');
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 });
    }
}
