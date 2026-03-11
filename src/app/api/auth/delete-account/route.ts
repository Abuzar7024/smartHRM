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

        const authPurgeList = new Set<string>();
        authPurgeList.add(uid); // Ensure employer is in the list

        for (const col of collections) {
            const snapshot = await adminDb.collection(col).where('companyName', '==', companyName).get();
            const batch = adminDb.batch();

            for (const doc of snapshot.docs) {
                if (col === 'users') {
                    authPurgeList.add(doc.id);
                }
                batch.delete(doc.ref);
            }

            await batch.commit();
            console.log(`Deleted ${snapshot.size} records from ${col}`);
        }

        // 2. Clear Auth Accounts (Staff + Employer)
        console.log(`Purging ${authPurgeList.size} Auth Accounts...`);
        for (const targetUid of authPurgeList) {
            try {
                await adminAuth.deleteUser(targetUid);
                console.log(`Purged Auth Account: ${targetUid}`);
            } catch (e) {
                console.warn(`Auth Account ${targetUid} already purged or missing.`);
            }
        }

        // Special case: Delete the company record (Registry)
        const companyRefs = await adminDb.collection('companies').where('name', '==', companyName).get();
        const registryBatch = adminDb.batch();
        companyRefs.docs.forEach(doc => registryBatch.delete(doc.ref));

        // Also explicitly delete by UID if owner document exists
        const ownerCompanyDoc = adminDb.collection('companies').doc(uid);
        registryBatch.delete(ownerCompanyDoc);

        await registryBatch.commit();
        console.log(`Deleted organization registry entries for: ${companyName}`);

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
