import { v4 as uuidv4 } from 'uuid';

const PESAPAL_ENV = process.env.NEXT_PUBLIC_PESAPAL_ENV || 'sandbox'; // 'sandbox' or 'live'
const CONSUMER_KEY = process.env.PESAPAL_CONSUMER_KEY || 'PLACEHOLDER_KEY';
const CONSUMER_SECRET = process.env.PESAPAL_CONSUMER_SECRET || 'PLACEHOLDER_SECRET';

const BASE_URL = PESAPAL_ENV === 'live'
    ? 'https://pay.pesapal.com/v3'
    : 'https://cybqa.pesapal.com/pesapalv3';

interface PesaPalAuthResponse {
    token: string;
    expiryDate: string;
    error: any;
    status: string;
}

export async function getPesaPalToken(): Promise<string> {
    try {
        const response = await fetch(`${BASE_URL}/api/Auth/RequestToken`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({
                consumer_key: CONSUMER_KEY,
                consumer_secret: CONSUMER_SECRET,
            }),
        });

        const data: PesaPalAuthResponse = await response.json();

        if (data.error) {
            console.error('PesaPal Auth Error:', data.error);
            throw new Error('Failed to authenticate with PesaPal');
        }

        return data.token;
    } catch (error) {
        console.error('PesaPal Token Error:', error);
        throw error;
    }
}

interface OrderRequest {
    id: string; // Internal Transaction ID
    currency: string;
    amount: number;
    description: string;
    callbackUrl: string; // The URL PesaPal redirects to after payment
    notification_id: string; // IPN ID
    billing_address: {
        email_address: string;
        phone_number: string | null;
        country_code: string;
        first_name: string;
        middle_name: string | null;
        last_name: string | null;
        line_1: string | null;
        line_2: string | null;
        city: string | null;
        state: string | null;
        postal_code: string | null;
        zip_code: string | null;
    }
}

export async function submitOrderRequest(orderData: OrderRequest) {
    const token = await getPesaPalToken();

    // Ensure unique ID for PesaPal if not provided
    const payload = {
        id: orderData.id,
        currency: orderData.currency,
        amount: orderData.amount,
        description: orderData.description,
        callback_url: orderData.callbackUrl,
        notification_id: orderData.notification_id,
        billing_address: orderData.billing_address
    };

    const response = await fetch(`${BASE_URL}/api/Transactions/SubmitOrderRequest`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
    });

    const data = await response.json();
    return data; // Contains order_tracking_id and redirect_url
}

export async function registerIPN(url: string) {
    const token = await getPesaPalToken();

    const response = await fetch(`${BASE_URL}/api/URLSetup/RegisterIPN`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            url: url,
            ipn_notification_type: 'POST'
        })
    });

    return await response.json();
}
