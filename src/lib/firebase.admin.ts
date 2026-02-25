import * as admin from 'firebase-admin';

const getSafeEnv = (name: string) => {
    const val = process.env[name];
    if (!val) return undefined;
    // Remove surrounding quotes if present
    return val.replace(/^["'](.+)["']$/, '$1');
};

if (!admin.apps.length) {
    try {
        const projectId = getSafeEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
        const clientEmail = getSafeEnv('FIREBASE_CLIENT_EMAIL');
        let privateKey = getSafeEnv('FIREBASE_PRIVATE_KEY');

        if (privateKey) {
            privateKey = privateKey.replace(/\\n/g, '\n');
        }

        console.log("Firebase Admin Debug:", {
            projectId,
            clientEmail: clientEmail ? `${clientEmail.substring(0, 5)}...` : 'MISSING',
            hasPrivateKey: !!privateKey,
            privateKeyStart: privateKey ? privateKey.substring(0, 30) : 'N/A'
        });

        if (!projectId || !clientEmail || !privateKey) {
            throw new Error("Missing required Firebase Admin credentials");
        }

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });
        console.log("Firebase Admin Initialized successfully.");
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Initialization failed";
        console.error('CRITICAL: Firebase Admin initialization failed:', msg);
    }
}

// Export with safety
export const adminAuth = (admin.apps.length > 0 ? admin.auth() : null) as admin.auth.Auth;
export const adminDb = (admin.apps.length > 0 ? admin.firestore() : null) as admin.firestore.Firestore;
