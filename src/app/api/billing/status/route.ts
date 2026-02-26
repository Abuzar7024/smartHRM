import { NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase.admin";
import { cookies } from "next/headers";

export async function GET() {
    try {
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get("session")?.value;

        if (!sessionCookie) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
        const userDoc = await adminDb.collection("users").doc(decodedToken.uid).get();
        const userData = userDoc.data();

        if (!userData) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // For employer: company doc ID = their uid
        // For employee: find the employer via companyName
        let companyId: string | null = null;

        if (userData.role === "employer") {
            companyId = decodedToken.uid;
        } else {
            // Find employer by companyName
            const companyName = userData.companyName;
            if (companyName) {
                const employerSnap = await adminDb
                    .collection("users")
                    .where("companyName", "==", companyName)
                    .where("role", "==", "employer")
                    .limit(1)
                    .get();
                if (!employerSnap.empty) {
                    companyId = employerSnap.docs[0].id;
                }
            }
        }

        if (!companyId) {
            // No company doc yet — treat as free tier active
            return NextResponse.json({
                subscription: {
                    plan: "free",
                    status: "active",
                    employeeLimit: 5,
                    paidSeats: 0,
                    activeUntil: null,
                },
            });
        }

        const companyDoc = await adminDb.collection("companies").doc(companyId).get();

        if (!companyDoc.exists) {
            // Company doc doesn't exist yet — free tier
            return NextResponse.json({
                subscription: {
                    plan: "free",
                    status: "active",
                    employeeLimit: 5,
                    paidSeats: 0,
                    activeUntil: null,
                },
            });
        }

        const companyData = companyDoc.data();
        const sub = companyData?.subscription || {};

        return NextResponse.json({
            subscription: {
                plan: sub.plan || "free",
                status: sub.status || "active",
                employeeLimit: (sub.employeeLimit || 5),
                paidSeats: sub.paidSeats || 0,
                activeUntil: sub.activeUntil ? sub.activeUntil.toDate().toISOString() : null,
                razorpaySubscriptionId: sub.razorpaySubscriptionId || null,
            },
        });
    } catch (error: any) {
        console.error("Billing Status Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
