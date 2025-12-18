import { NextResponse } from 'next/server';
import { getPesaPalToken } from '@/lib/pesapal';
import { firestore } from '@/firebase'; // NOTE: This might need Admin SDK for server-side
import { adminAuth, adminDb } from '@/lib/firebase-admin'; // Assuming we have admin SDK set up, otherwise use standard if allowed
import { Timestamp } from 'firebase-admin/firestore';

// NOTE: PesaPal sends IPN as GET/POST with query params usually
// OrderNotificationType=CHANGE&OrderTrackingId=...&OrderMerchantReference=...

export async function GET(req: Request) {
    // PesaPal often uses GET for the callback/IPN handshake
    const { searchParams } = new URL(req.url);
    const orderTrackingId = searchParams.get('OrderTrackingId');
    const orderNotificationType = searchParams.get('OrderNotificationType');
    const orderMerchantReference = searchParams.get('OrderMerchantReference');

    if (!orderTrackingId || !orderMerchantReference) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    try {
        const token = await getPesaPalToken();

        // Verify Status
        const response = await fetch(`https://cybqa.pesapal.com/pesapalv3/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        // data contains status code, payment_status_description, etc.

        if (data.payment_status_description === 'Completed') {
            // Update Firestore
            // We need to find the user by some reference. 
            // Ideally orderMerchantReference WAS the userID or we stored a mapping.
            // If we used a random UUID for OrderID, we need to have stored that OrderID -> UserID mapping in a 'transactions' collection first.

            // For this implementation, let's assume we store the pending transaction in a 'payments' collection
            // fetch payment doc by id (OrderMerchantReference)

            // ... Update Logic Here ...
            console.log('Payment Completed for:', orderMerchantReference);
        }

        return NextResponse.json({
            orderNotificationType: orderNotificationType,
            orderTrackingId: orderTrackingId,
            orderMerchantReference: orderMerchantReference,
            status: 200
        });

    } catch (error) {
        console.error('IPN Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    // Handle POST IPN if PesaPal sends it this way
    return GET(req);
}
