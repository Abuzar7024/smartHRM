import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase.admin';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { name, email, password, role, department } = await request.json();

        // 1. Verify that the current user is an Employer
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session')?.value;

        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
        const employerDoc = await adminDb.collection('users').doc(decodedToken.uid).get();

        if (!employerDoc.exists || employerDoc.data()?.role !== 'employer') {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        // 2. Create user in Firebase Auth
        const userCredential = await adminAuth.createUser({
            email,
            password,
            displayName: name,
        });

        // 3. Create user profile in 'users' collection with 'pending' status
        await adminDb.collection('users').doc(userCredential.uid).set({
            email,
            role: 'employee',
            status: 'pending', // Key for invitation flow
            createdAt: new Date(),
        });

        // 4. Create employee record in 'employees' collection
        await adminDb.collection('employees').add({
            uid: userCredential.uid,
            name,
            email,
            role: role || 'Staff',
            department: department || 'General',
            status: 'Invited', // Display status
            joinedAt: new Date(),
        });

        return NextResponse.json({ success: true, uid: userCredential.uid }, { status: 200 });

    } catch (error) {
        console.error("Error creating employee account:", error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
