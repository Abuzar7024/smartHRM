import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase.admin';
import { cookies } from 'next/headers';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const session = cookieStore.get('session')?.value;

        if (!session) {
            return NextResponse.json({ error: 'No session' }, { status: 401 });
        }

        // Verify session cookie
        const decodedClaims = await adminAuth.verifySessionCookie(session, true);

        // Optional: fetch user doc from firestore to get exact role if not stored in auth claims
        const userDoc = await adminDb.collection('users').doc(decodedClaims.uid).get();
        const role = userDoc.data()?.role || 'employee'; // fallback

        return NextResponse.json({
            uid: decodedClaims.uid,
            email: decodedClaims.email,
            role: role
        }, { status: 200 });

    } catch (error) {
        console.error("Session verification error:", error);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
}
