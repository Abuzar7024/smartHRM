import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase.admin';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase.admin';

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session')?.value;

        if (!sessionCookie) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
        const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();

        if (!userDoc.exists || userDoc.data()?.role !== 'employer') {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        await adminDb.collection('announcements').doc(id).delete();

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error("Error deleting announcement:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
