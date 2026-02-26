import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import crypto from "crypto";
import { adminDb } from "@/lib/firebase.admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
    try {
        const body = await req.text();
        const signature = req.headers.get("x-razorpay-signature");

        if (!signature) {
            return NextResponse.json({ error: "No signature provided" }, { status: 400 });
        }

        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET || "")
            .update(body)
            .digest("hex");

        if (expectedSignature !== signature) {
            return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
        }

        const event = JSON.parse(body);

        let companyId;
        const companyRef = (id: string) => adminDb.collection("companies").doc(id);

        if (event.event === "subscription.charged") {
            const subscription = event.payload.subscription.entity;
            companyId = subscription.notes?.companyId;

            if (companyId) {
                // Log the payment
                await adminDb.collection("paymentLogs").add({
                    subscriptionId: subscription.id,
                    amount: event.payload.payment.entity.amount,
                    currency: event.payload.payment.entity.currency,
                    status: "captured", // Since it is charged
                    companyId: companyId,
                    createdAt: Timestamp.now(),
                });

                await companyRef(companyId).update({
                    "subscription.status": "active",
                    "subscription.razorpaySubscriptionId": subscription.id,
                    "subscription.paidSeats": subscription.quantity,
                    "subscription.activeUntil": Timestamp.fromDate(new Date(subscription.current_end * 1000)),
                });
            }
        } else if (event.event === "subscription.halted") {
            const subscription = event.payload.subscription.entity;
            companyId = subscription.notes?.companyId;

            if (companyId) {
                await companyRef(companyId).update({
                    "subscription.status": "halted",
                });
            }
        } else if (event.event === "subscription.cancelled") {
            const subscription = event.payload.subscription.entity;
            companyId = subscription.notes?.companyId;

            if (companyId) {
                await companyRef(companyId).update({
                    "subscription.status": "cancelled",
                    "subscription.paidSeats": 0,
                });
            }
        }

        return NextResponse.json({ status: "ok" });
    } catch (error: any) {
        console.error("Webhook Error", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
