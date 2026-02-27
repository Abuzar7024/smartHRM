import { NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase.admin';
import { cookies } from 'next/headers';

export async function DELETE() {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session')?.value;

        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
        const uid = decodedToken.uid;

        // Fetch user data to find companyName
        const userDoc = await adminDb.collection('users').doc(uid).get();
        if (!userDoc.exists) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const userData = userDoc.data();
        const { companyName, role } = userData || {};

        if (role !== 'employer') {
            return NextResponse.json({ error: 'Only employers can delete their organization' }, { status: 403 });
        }

        if (!companyName) {
            return NextResponse.json({ error: 'No company associated with this account' }, { status: 400 });
        }

        // List of collections to clean up based on companyName
        const collections = [
            'users',
            'employees',
            'announcements',
            'leaves',
            'payroll',
            'attendance',
            'notifications',
            'chat_messages',
            'leave_balances',
            'tasks',
            'teams',
            'payslip_requests',
            'documents',
            'doc_templates',
            'profile_updates',
            'jobs'
        ];

        console.log(`Starting full deletion for company: ${companyName}`);

        for (const col of collections) {
            const snapshot = await adminDb.collection(col).where('companyName', '==', companyName).get();
            const batch = adminDb.batch();

            // For 'users' collection, we also need to delete their Auth accounts
            if (col === 'users') {
                for (const doc of snapshot.docs) {
                    try {
                        await adminAuth.deleteUser(doc.id);
                        console.log(`Deleted Auth Account: ${doc.id}`);
                    } catch (e) {
                        console.warn(`Could not delete Auth Account ${doc.id}:`, e);
                    }
                    batch.delete(doc.ref);
                }
            } else {
                snapshot.docs.forEach(doc => batch.delete(doc.ref));
            }

            await batch.commit();
            console.log(`Deleted ${snapshot.size} records from ${col}`);
        }

        // Special case: Delete the company record from the search registry
        const companyRefs = await adminDb.collection('companies').where('name', '==', companyName).get();
        const companyBatch = adminDb.batch();
        companyRefs.docs.forEach(doc => companyBatch.delete(doc.ref));
        await companyBatch.commit();
        console.log(`Deleted ${companyRefs.size} organization registry entries for: ${companyName}`);

        // Finally delete the employer themselves if they weren't in the lists above (unlikely as they should be in 'users')
        // But the loop above already handles it if they are in 'users' with companyName.

        // Clear session cookie
        cookieStore.delete('session');

        return NextResponse.json({ success: true, message: 'Organization deleted successfully' });

    } catch (error) {
        console.error("Account deletion error:", error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
