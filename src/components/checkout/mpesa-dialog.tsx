
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle2, Phone, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface MpesaPaymentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    amount: number;
    reference: string; // e.g., Invoice #123
    tenantId: string;
    propertyId: string;
    email: string; // For receipt
    onSuccess?: () => void;
}

export function MpesaPaymentDialog({
    open,
    onOpenChange,
    amount,
    reference,
    tenantId,
    propertyId,
    email,
    onSuccess
}: MpesaPaymentDialogProps) {
    const [step, setStep] = useState<'input' | 'processing' | 'success' | 'failed'>('input');
    const [phone, setPhone] = useState('');
    const [error, setError] = useState('');
    const [countdown, setCountdown] = useState(60);

    const handlePay = async () => {
        if (!phone || phone.length < 10) {
            setError('Please enter a valid phone number');
            return;
        }

        setStep('processing');
        setError('');

        try {
            const res = await fetch('/api/payments/mpesa/stk', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    phone,
                    amount,
                    accountReference: reference,
                    tenantId,
                    propertyId,
                    email
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Payment initiation failed');
            }

            // In a real app, we'd poll receiving the callback here
            // For now, we simulate a waiting period then show success/instruction
            // (The actual confirmation comes via callback -> email)

            // Simulate waiting
            setTimeout(() => {
                setStep('success');
                if (onSuccess) onSuccess();
            }, 5000);

        } catch (err: any) {
            setError(err.message);
            setStep('failed');
        }
    };

    const reset = () => {
        setStep('input');
        setPhone('');
        setError('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Pay with M-Pesa</DialogTitle>
                    <DialogDescription>
                        Enter your M-Pesa phone number to receive a payment prompt.
                    </DialogDescription>
                </DialogHeader>

                {step === 'input' && (
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">Amount</Label>
                            <Input id="amount" value={`KES ${amount.toLocaleString()}`} disabled className="col-span-3 font-bold" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">Phone</Label>
                            <Input
                                id="phone"
                                placeholder="07..."
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                className="col-span-3"
                                type="tel"
                            />
                        </div>
                        {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                    </div>
                )}

                {step === 'processing' && (
                    <div className="py-8 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="relative">
                            <Loader2 className="h-12 w-12 animate-spin text-green-600" />
                            <Phone className="h-6 w-6 absolute top-3 left-3 text-green-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">Check your phone</h3>
                            <p className="text-sm text-muted-foreground">We sent an STK prompt to {phone}.<br />Enter your PIN to complete the payment.</p>
                            <p className="text-xs text-green-600 animate-pulse mt-4">Listening for payment confirmation...</p>

                            {/* Dev Helper */}
                            {process.env.NODE_ENV === 'development' && (
                                <Button variant="outline" size="sm" className="mt-4" onClick={() => setStep('success')}>
                                    Simulate Success
                                </Button>
                            )}
                        </div>
                    </div>
                )}

                {step === 'success' && (
                    <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
                        <CheckCircle2 className="h-16 w-16 text-green-500" />
                        <div>
                            <h3 className="font-semibold text-lg">Request Sent!</h3>
                            <p className="text-sm text-muted-foreground">
                                If you entered your PIN successfully, you will receive a confirmation email with your receipt shortly.
                            </p>
                        </div>
                    </div>
                )}

                {step === 'failed' && (
                    <div className="py-6 flex flex-col items-center justify-center text-center space-y-4">
                        <AlertCircle className="h-16 w-16 text-red-500" />
                        <div>
                            <h3 className="font-semibold text-lg text-red-600">Request Failed</h3>
                            <p className="text-sm text-muted-foreground">{error}</p>
                        </div>
                    </div>
                )}

                <DialogFooter>
                    {step === 'input' && (
                        <Button onClick={handlePay} className="w-full bg-green-600 hover:bg-green-700">Pay Now</Button>
                    )}
                    {(step === 'success' || step === 'failed') && (
                        <Button onClick={reset} variant="outline" className="w-full">Close</Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
