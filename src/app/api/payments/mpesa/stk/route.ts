import { NextResponse } from 'next/server';
import { initiateSTKPush } from '@/lib/mpesa';
import { adminDb } from '@/firebase/admin-config';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { phone, amount, accountReference, tenantId, propertyId, email } = body;

        if (!phone || !amount || !accountReference) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Get Credentials from Environment
        const credentials = {
            key: process.env.MPESA_CONSUMER_KEY || '',
            secret: process.env.MPESA_CONSUMER_SECRET || '',
            passKey: process.env.MPESA_PASSKEY || '',
            shortCode: process.env.MPESA_SHORTCODE || '',
        };

        if (!credentials.key || !credentials.shortCode) {
            return NextResponse.json({ error: 'Server misconfiguration: Missing M-Pesa credentials' }, { status: 500 });
        }

        // 2. Create Transaction Record (Pending)
        const transactionId = uuidv4();
        const secret = process.env.MPESA_CALLBACK_SECRET || 'default-secret-key';
        const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/mpesa/callback?tid=${transactionId}&secret=${secret}`;

        // 3. Initiate STK Push
        const mpesaResponse = await initiateSTKPush(
            phone,
            amount,
            accountReference,
            credentials,
            callbackUrl
        );

        if (mpesaResponse.ResponseCode !== '0') {
            throw new Error(mpesaResponse.CustomerMessage || 'Failed to initiate M-Pesa request');
        }

        // 4. Save to Firestore (Transactions Collection)
        await adminDb.collection('transactions').doc(transactionId).set({
            id: transactionId,
            tenantId: tenantId || null,
            propertyId: propertyId || null,
            email: email || null,
            amount: Number(amount),
            status: 'pending',
            reference: accountReference,
            checkoutRequestId: mpesaResponse.CheckoutRequestID || null,
            provider: 'M-Pesa',
            createdAt: new Date(),
            updatedAt: new Date(),
            type: 'revenue'
        });

        return NextResponse.json({
            success: true,
            message: 'STK Push initiated',
            checkoutRequestId: mpesaResponse.CheckoutRequestID,
            transactionId
        });

    } catch (error: any) {
        console.error('STK Push API Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
