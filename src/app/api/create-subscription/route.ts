import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { adminAuth, adminDb } from '@/lib/firebase.admin';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const { paidSeats } = await req.json();

        // Verify that the current user is an Employer
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session')?.value;

        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
        const employerDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
        const companyId = decodedToken.uid; // Since employer creates company as doc ID in companies collection

        if (!paidSeats || !companyId || employerDoc.data()?.role !== 'employer') {
            return NextResponse.json({ error: "Missing required fields or unauthorized" }, { status: 400 });
        }

        const razorpay = new Razorpay({
            key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        const planId = process.env.RAZORPAY_PLAN_ID || "plan_SKknCuGU5HpnLO";

        const subscription = await razorpay.subscriptions.create({
            plan_id: planId,
            customer_notify: 1,
            total_count: 999,
            quantity: paidSeats,
            notes: {
                companyId
            }
        });

        return NextResponse.json({ subscriptionId: subscription.id }, { status: 200 });

    } catch (error: any) {
        console.error("Subscription Creation Error", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
