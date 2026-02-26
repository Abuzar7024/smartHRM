import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase.admin';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session')?.value;

        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
        const uid = decodedToken.uid;

        // 1. Update user status in 'users' collection
        await adminDb.collection('users').doc(uid).update({
            status: 'active',
            acceptedAt: new Date(),
        });

        // 2. Update employee status in 'employees' collection
        const employeeQuery = await adminDb.collection('employees').where('uid', '==', uid).limit(1).get();
        if (!employeeQuery.empty) {
            const empDoc = employeeQuery.docs[0];
            await empDoc.ref.update({
                status: 'Active'
            });
        }

        return NextResponse.json({ success: true }, { status: 200 });

    } catch (error) {
        console.error("Invitation acceptance error:", error);
        return NextResponse.json({ error: 'Failed to process invitation' }, { status: 500 });
    }
}
