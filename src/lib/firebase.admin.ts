import * as admin from 'firebase-admin';

const getSafeEnv = (name: string) => {
    const val = process.env[name];
    if (!val) return undefined;
    // Remove exactly one set of surrounding quotes if they exist
    return val.trim().replace(/^["']|["']$/g, '');
};

let isInitialized = false;

if (!admin.apps.length) {
    try {
        const projectId = getSafeEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID');
        const clientEmail = getSafeEnv('FIREBASE_CLIENT_EMAIL');
        let privateKey = getSafeEnv('FIREBASE_PRIVATE_KEY');

        if (privateKey) {
            // 1. Remove any surrounding whitespace
            privateKey = privateKey.trim();

            // 2. Remove accidental double quotes if they were pasted into Vercel UI
            if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
                privateKey = privateKey.slice(1, -1);
            }

            // 3. Handle double-escaped newlines common in some CI/CD pipelines
            privateKey = privateKey.replace(/\\n/g, '\n');

            // 4. Ensure headers and footers are present and correctly formatted
            const header = '-----BEGIN PRIVATE KEY-----';
            const footer = '-----END PRIVATE KEY-----';

            if (!privateKey.includes(header)) {
                console.warn("Firebase Admin: Private key missing header, attempting to prepend.");
                privateKey = `${header}\n${privateKey}`;
            }
            if (!privateKey.includes(footer)) {
                console.warn("Firebase Admin: Private key missing footer, attempting to append.");
                privateKey = `${privateKey}\n${footer}`;
            }

            // 5. Fix potential 'joined' line issue (keys shouldn't be one single line without newlines)
            if (!privateKey.slice(header.length, -footer.length).includes('\n')) {
                // If the middle part has no newlines but has spaces, the spaces might be newlines
                privateKey = privateKey.replace(/ /g, '\n');
                // But wait, the header/footer shouldn't have newlines replaced by spaces... 
                // Let's be safer: Only split if it looks like a base64 block
                const middle = privateKey.replace(header, '').replace(footer, '').trim();
                if (!middle.includes('\n')) {
                    // Split middle into 64-char chunks which is standard for PEM
                    const chunks = middle.match(/.{1,64}/g) || [];
                    privateKey = `${header}\n${chunks.join('\n')}\n${footer}`;
                }
            }
        }

        console.log("Firebase Admin Diagnosis:", {
            projectId: projectId || 'MISSING',
            email: clientEmail ? `${clientEmail.substring(0, 8)}...` : 'MISSING',
            keyPresent: !!privateKey,
            keyLength: privateKey?.length,
            validHeader: privateKey?.startsWith('-----BEGIN PRIVATE KEY-----'),
            validFooter: privateKey?.endsWith('-----END PRIVATE KEY-----'),
        });

        if (!projectId || !clientEmail || !privateKey) {
            throw new Error("Critical Configuration Missing: Check Project ID, Client Email, and Private Key.");
        }

        admin.initializeApp({
            credential: admin.credential.cert({
                projectId,
                clientEmail,
                privateKey,
            }),
        });

        isInitialized = true;
        console.log("✅ Firebase Admin Security Context established.");
    } catch (error) {
        const msg = error instanceof Error ? error.message : "Initialization failed";
        console.error('❌ CRITICAL: Firebase Admin failed to initialize:', msg);
    }
} else {
    isInitialized = true;
}

// Proxy-like safety: Instead of returning null and crashing the app, 
// we return a proxy or a check-based object that throws a MORE descriptive error if called.
export const adminAuth = (isInitialized ? admin.auth() : new Proxy({} as admin.auth.Auth, {
    get() {
        throw new Error("FIREBASE_ADMIN_ERROR: Attempted to use adminAuth but initialization failed. Check Vercel logs for diagnostic data.");
    }
}));

export const adminDb = (isInitialized ? admin.firestore() : new Proxy({} as admin.firestore.Firestore, {
    get() {
        throw new Error("FIREBASE_ADMIN_ERROR: Attempted to use adminDb but initialization failed. Check Vercel logs for diagnostic data.");
    }
}));
