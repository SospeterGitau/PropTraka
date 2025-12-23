import { NextResponse } from 'next/server';

const DARAJA_BASE_URL = process.env.NODE_ENV === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

interface MpesaAuthResponse {
    access_token: string;
    expires_in: string;
}

/**
 * Generate M-Pesa Access Token
 */
export async function getMpesaToken(consumerKey: string, consumerSecret: string): Promise<string> {
    const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');

    try {
        const response = await fetch(`${DARAJA_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
            method: 'GET',
            headers: {
                Authorization: `Basic ${auth}`,
            },
            cache: 'no-store',
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('M-Pesa Auth Error:', errorText);
            throw new Error('Failed to authenticate with M-Pesa');
        }

        const data: MpesaAuthResponse = await response.json();
        return data.access_token;
    } catch (error) {
        console.error('M-Pesa Token Error:', error);
        throw error;
    }
}

/**
 * Initiate STK Push
 */
export async function initiateSTKPush(
    phone: string,
    amount: number,
    reference: string,
    credentials: { key: string; secret: string; passKey: string; shortCode: string },
    callbackUrl: string
) {
    try {
        const token = await getMpesaToken(credentials.key, credentials.secret);

        const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
        const password = Buffer.from(
            `${credentials.shortCode}${credentials.passKey}${timestamp}`
        ).toString('base64');

        // Format phone: 07xx -> 2547xx
        let formattedPhone = phone.replace(/^0/, '254').replace(/^\+254/, '254');

        // Payload for Safaricom
        const payload = {
            BusinessShortCode: credentials.shortCode,
            Password: password,
            Timestamp: timestamp,
            TransactionType: 'CustomerPayBillOnline', // Or CustomerBuyGoodsOnline
            Amount: Math.ceil(amount), // Must be integer
            PartyA: formattedPhone,
            PartyB: credentials.shortCode, // Paybill/Till number
            PhoneNumber: formattedPhone,
            CallBackURL: callbackUrl,
            AccountReference: reference,
            TransactionDesc: `Payment for ${reference}`,
        };

        const response = await fetch(`${DARAJA_BASE_URL}/mpesa/stkpush/v1/processrequest`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
        });

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("STK Push Error:", error);
        throw error;
    }
}
