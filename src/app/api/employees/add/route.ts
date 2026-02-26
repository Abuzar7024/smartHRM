import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase.admin';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
    try {
        const { name, email, password, role, department, position } = await request.json();

        // 1. Verify that the current user is an Employer
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session')?.value;

        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
        const employerDoc = await adminDb.collection('users').doc(decodedToken.uid).get();

        const employerData = employerDoc.data();
        if (!employerDoc.exists || employerData?.role !== 'employer') {
            return NextResponse.json({ error: 'Permission denied' }, { status: 403 });
        }

        const companyName = employerData?.companyName;

        // Verify Subscription Limit
        const employeesSnap = await adminDb.collection('employees').where('companyName', '==', companyName).get();
        const currentEmployeeCount = employeesSnap.size;

        const companyDoc = await adminDb.collection('companies').doc(decodedToken.uid).get();
        const companyData = companyDoc.exists ? companyDoc.data() : null;

        const paidSeats = companyData?.subscription?.paidSeats || 0;
        const maxEmployees = 5 + paidSeats;
        const status = companyData?.subscription?.status;
        const activeUntilDate = companyData?.subscription?.activeUntil ? companyData.subscription.activeUntil.toDate() : null;

        if (paidSeats > 0) {
            if (status !== 'active') {
                return NextResponse.json({ error: 'Subscription is not active. Please renew your plan.' }, { status: 403 });
            }
            if (activeUntilDate && activeUntilDate < new Date()) {
                return NextResponse.json({ error: 'Subscription expired. Please renew your plan.' }, { status: 403 });
            }
        }

        if (currentEmployeeCount >= maxEmployees) {
            return NextResponse.json({ error: 'Subscription limits exceeded. Please upgrade your plan (₹99/month per extra employee).' }, { status: 403 });
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
            companyName: companyName,
            status: 'pending', // Key for invitation flow
            createdAt: new Date(),
        });

        // 4. Create employee record in 'employees' collection
        await adminDb.collection('employees').add({
            uid: userCredential.uid,
            name,
            email,
            role: role || 'Staff',
            position: position || 'Staff',
            department: department || 'General',
            companyName: companyName,
            status: 'Invited', // Display status
            joinedAt: new Date(),
            leaveBalance: 12,
            permissions: []
        });

        return NextResponse.json({ success: true, uid: userCredential.uid }, { status: 200 });

    } catch (error) {
        console.error("Error creating employee account:", error);
        const message = error instanceof Error ? error.message : 'Internal server error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
