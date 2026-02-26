import { NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebase.admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase.admin';

export async function POST(req: Request) {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, employeesToAdd } = await req.json();

        // Verify that the current user is an Employer
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session')?.value;

        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
        const companyId = decodedToken.uid; // Employer uid is the company ID

        const body = razorpay_order_id + "|" + razorpay_payment_id;

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
            .update(body.toString())
            .digest("hex");

        const isAuthentic = expectedSignature === razorpay_signature;

        if (isAuthentic) {
            // Log the payment
            await adminDb.collection("paymentLogs").add({
                transactionId: razorpay_payment_id,
                orderId: razorpay_order_id,
                status: "captured", // assumed success based on authentic signature
                companyId: companyId,
                createdAt: Timestamp.now(),
            });

            const companyRef = adminDb.collection("companies").doc(companyId);
            const companySnap = await companyRef.get();

            const currentMax = companySnap.exists
                ? (companySnap.data()?.subscription?.employeeLimit || 5)
                : 5;
            const currentPaidSeats = companySnap.exists
                ? (companySnap.data()?.subscription?.paidSeats || 0)
                : 0;

            const activeUntilDate = new Date();
            activeUntilDate.setMonth(activeUntilDate.getMonth() + 1);

            await companyRef.set({
                subscription: {
                    plan: "paid",
                    status: "active",
                    employeeLimit: currentMax + employeesToAdd,
                    paidSeats: currentPaidSeats + employeesToAdd,
                    activeUntil: Timestamp.fromDate(activeUntilDate),
                }
            }, { merge: true });

            return NextResponse.json({ message: "payment verified successfully" }, { status: 200 });

        } else {
            return NextResponse.json({ message: "invalid signature" }, { status: 400 });
        }
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
