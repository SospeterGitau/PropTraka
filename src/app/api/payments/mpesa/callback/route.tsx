
import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { renderToBuffer } from '@react-pdf/renderer';
import { PaymentReceiptEmail } from '@/emails/receipt';
import { ReceiptPDF } from '@/components/pdf/receipt-pdf';
import { adminDb } from '@/firebase/admin-config';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { Body: { stkCallback } } = body;
        const { searchParams } = new URL(req.url);
        const transactionId = searchParams.get('tid');
        const secret = searchParams.get('secret');

        console.log('M-Pesa Callback Received:', JSON.stringify(body));

        // 0. Security Check
        const expectedSecret = process.env.MPESA_CALLBACK_SECRET || 'default-secret-key';
        if (secret !== expectedSecret) {
            console.error('Callback security check failed: Invalid secret');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!transactionId) {
            console.error('Callback missing transaction ID');
            return NextResponse.json({ error: 'Missing tid' }, { status: 400 });
        }

        if (stkCallback.ResultCode !== 0) {
            // Payment Failed/Cancelled
            console.warn('Payment failed/cancelled:', stkCallback.ResultDesc);
            await adminDb.collection('transactions').doc(transactionId).update({
                status: 'failed',
                failureReason: stkCallback.ResultDesc,
                updatedAt: new Date()
            });
            return NextResponse.json({ status: 'ok' });
        }

        // Payment Successful
        const metadata = stkCallback.CallbackMetadata.Item;
        const amount = metadata.find((i: any) => i.Name === 'Amount')?.Value;
        const receiptNo = metadata.find((i: any) => i.Name === 'MpesaReceiptNumber')?.Value;
        const phone = metadata.find((i: any) => i.Name === 'PhoneNumber')?.Value;
        const dateStr = metadata.find((i: any) => i.Name === 'TransactionDate')?.Value; // YYYYMMDDHHmmss

        // 1. Update Database (Mark as Paid)
        await adminDb.collection('transactions').doc(transactionId).update({
            status: 'success',
            receiptNo,
            mpesaPhone: phone,
            paidAt: new Date(),
            updatedAt: new Date()
        });

        // 2. Fetch Transaction Details (to get Email and Tenant Name)
        const txDoc = await adminDb.collection('transactions').doc(transactionId).get();
        const txData = txDoc.data();

        if (!txData) {
            console.error('Transaction not found during receipt generation');
            return NextResponse.json({ status: 'ok' }); // Fail silently to M-Pesa but log
        }

        // 3. Generate PDF Receipt
        const pdfBuffer = await renderToBuffer(
            <ReceiptPDF
                receiptNumber={receiptNo}
                date={new Date()}
                tenantName={txData.email || 'Valued Tenant'} // Fallback if no specific name stored yet
                propertyName={txData.propertyId || 'Property'} // Ideally fetch property name
                amount={Number(amount)}
                paymentMethod="M-Pesa"
            />
        );

        // 4. Send Email with Attachment
        if (txData.email && process.env.RESEND_API_KEY) {
            await resend.emails.send({
                from: 'PropTraka <payments@proptraka.com>',
                to: txData.email,
                subject: `Payment Receipt - ${receiptNo}`,
                react: <PaymentReceiptEmail
                    tenantName={txData.email}
                    propertyName={"Property"}
                    amount={Number(amount)}
                    receiptNumber={receiptNo}
                />,
                attachments: [
                    {
                        filename: `Receipt-${receiptNo}.pdf`,
                        content: pdfBuffer,
                    },
                ],
            });
            console.log('Receipt email sent to:', txData.email);
        }

        return NextResponse.json({ status: 'ok' });

    } catch (error) {
        console.error('Callback Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
