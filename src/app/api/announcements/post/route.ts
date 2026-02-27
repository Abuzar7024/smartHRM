import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase.admin';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase.admin';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, message, type, authorName, startTime, endTime } = body;

        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session')?.value;

        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
        const userDoc = await adminDb.collection('users').doc(decodedToken.uid).get();

        if (!userDoc.exists || userDoc.data()?.role !== 'employer') {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        const companyName = userDoc.data()?.companyName || "";

        const announcementData = {
            title,
            message,
            type,
            authorName,
            startTime: startTime || null,
            endTime: endTime || null,
            createdAt: new Date().toISOString(),
            companyName
        };

        const docRef = await adminDb.collection('announcements').add(announcementData);

        return NextResponse.json({ success: true, id: docRef.id }, { status: 200 });

    } catch (error) {
        console.error("Error posting announcement:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
