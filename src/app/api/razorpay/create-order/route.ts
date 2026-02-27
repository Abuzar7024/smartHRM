import { NextResponse } from "next/server";
import Razorpay from "razorpay";
import { randomUUID } from "crypto";
import { adminAuth, adminDb } from '@/lib/firebase.admin';
import { cookies } from 'next/headers';

export async function POST(req: Request) {
    try {
        const { employeesToAdd } = await req.json();

        // Verify that the current user is an Employer
        const cookieStore = await cookies();
        const sessionCookie = cookieStore.get('session')?.value;

        if (!sessionCookie) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const decodedToken = await adminAuth.verifySessionCookie(sessionCookie);
        const employerDoc = await adminDb.collection('users').doc(decodedToken.uid).get();
        const companyId = decodedToken.uid; // Since employer creates company as doc ID in companies collection

        if (!employeesToAdd || !companyId || employerDoc.data()?.role !== 'employer') {
            return NextResponse.json({ error: "Missing required fields or unauthorized" }, { status: 400 });
        }

        const razorpay = new Razorpay({
            key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
            key_secret: process.env.RAZORPAY_KEY_SECRET!,
        });

        const subtotal = employeesToAdd * 99;
        const platformFee = 15;
        const processingFee = Math.ceil((subtotal + platformFee) * 0.02);
        const finalAmount = subtotal + platformFee + processingFee;

        // Amount in paise
        const amount = finalAmount * 100;
        const receipt = `rcpt_${randomUUID().slice(0, 8)}`;

        const options = {
            amount,
            currency: "INR",
            receipt,
            notes: {
                companyId,
            }
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json({ order }, { status: 200 });

    } catch (error: any) {
        console.error("Order Creation Error", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
