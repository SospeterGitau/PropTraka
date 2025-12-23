import { NextResponse } from 'next/server';
import { submitOrderRequest } from '@/lib/pesapal';
import { v4 as uuidv4 } from 'uuid';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { amount, description, user, callbackUrl } = body;

        // Basic validation
        if (!amount || !user?.email) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Construct Order Payload
        const orderData = {
            id: uuidv4(),
            currency: 'KES',
            amount: Number(amount),
            description: description || 'PropTraka Subscription',
            callbackUrl: callbackUrl || `${process.env.NEXT_PUBLIC_APP_URL}/settings?tab=subscription`,
            notification_id: process.env.PESAPAL_IPN_ID || '', // This should be pre-registered and stored in ENV
            billing_address: {
                email_address: user.email,
                phone_number: null,
                country_code: 'KE',
                first_name: user.firstName || 'Guest',
                middle_name: null,
                last_name: user.lastName || '',
                line_1: null,
                line_2: null,
                city: null,
                state: null,
                postal_code: null,
                zip_code: null,
            }
        };

        // Call PesaPal
        const result = await submitOrderRequest(orderData);

        // Return tracking ID and Redirect URL
        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Payment Initiation Error:', error);
        return NextResponse.json({ error: error.message || 'Payment initiation failed' }, { status: 500 });
    }
}
