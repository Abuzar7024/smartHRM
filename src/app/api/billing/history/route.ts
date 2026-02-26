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

        if (!userData || userData.role !== "employer") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const companyId = decodedToken.uid;

        // Get payment logs for this company
        const paymentLogsSnap = await adminDb
            .collection("paymentLogs")
            .where("companyId", "==", companyId)
            .orderBy("createdAt", "desc")
            .limit(50)
            .get();

        const payments = paymentLogsSnap.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                transactionId: data.transactionId || data.subscriptionId || null,
                orderId: data.orderId || null,
                amount: data.amount || 0,
                currency: data.currency || "INR",
                status: data.status || "unknown",
                createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
            };
        });

        return NextResponse.json({ payments });
    } catch (error: any) {
        console.error("Billing History Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
