require('dotenv').config({ path: '.env.local' });

const admin = require('./node_modules/firebase-admin');

const serviceAccount = {
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const auth = admin.auth();
const db = admin.firestore();

async function createDemoUsers() {
    try {
        // Create employer
        const employerUser = await auth.createUser({
            email: 'employer@gmail.com',
            password: '12345678',
            emailVerified: true,
        });

        await db.collection('users').doc(employerUser.uid).set({
            email: 'employer@gmail.com',
            role: 'employer',
            companyName: 'Demo Company',
            status: 'active',
            createdAt: new Date(),
            emailVerified: true,
            regNo: 'DEMO123456',
            website: 'https://demo.com',
            address: 'Demo Address',
            verificationStatus: 'verified'
        });

        console.log('Employer created:', employerUser.uid);

        // Create employee
        const employeeUser = await auth.createUser({
            email: 'employee@gmail.com',
            password: '12345678',
            emailVerified: true,
        });

        await db.collection('users').doc(employeeUser.uid).set({
            email: 'employee@gmail.com',
            role: 'employee',
            companyName: 'Demo Company',
            status: 'active',
            createdAt: new Date(),
            emailVerified: true,
        });

        console.log('Employee created:', employeeUser.uid);

        console.log('Demo users created successfully!');
    } catch (error) {
        console.error('Error creating demo users:', error);
    }
}

createDemoUsers();