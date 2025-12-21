import { NextResponse } from 'next/server';
import { getPesaPalToken } from '@/lib/pesapal';
import { firestore } from '@/firebase'; // NOTE: This might need Admin SDK for server-side
// import { adminAuth, adminDb } from '@/lib/firebase-admin'; // Assuming we have admin SDK set up, otherwise use standard if allowed
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
            // We expect OrderMerchantReference to be the invoice ID or Tenancy ID for now.
            // Ideally we'd have a 'transactions' doc with status 'initiated' to look up.

            // Search for the tenancy/transaction by reference (assuming OrderMerchantReference is unique or we can find it)
            // Implementation note: This part relies on having a way to link the order back to a user/property.
            // For now, we'll assume OrderMerchantReference = Tenancy ID (as a simplified flow) or we'd need a separate 'pending_orders' collection.

            /* 
               REAL IMPLEMENTATION TODO:
               1. Look up the pending order in `pending_payments` collection using orderTrackingId.
               2. Get userId and tenancyId from that pending order.
               3. Fetch user settings for automation preferences.
               4. Create the revenue transaction.
            */

            console.log('Payment Completed for:', orderMerchantReference);

            // Mock logic for the "Foundation" as requested, ensuring the structure is ready.
            // We would import adminDb here to write to Firestore.

            // const userSettingsRef = adminDb.collection('user_settings').doc(userId);
            // const userSettingsSnap = await userSettingsRef.get();
            // const settings = userSettingsSnap.data();

            // const status = settings?.automation?.autoVerifyPayments ? 'paid' : 'pending';
            // await adminDb.collection('revenue').add({ ...transactionData, status });
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
