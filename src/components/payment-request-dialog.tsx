
'use client';

import { useState, useEffect } from 'react';
import type { ArrearEntryCalculated } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CreditCard } from 'lucide-react';
import { useDataContext } from '@/context/data-context';

interface PaymentRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: { amount: number; method: string }) => void;
  arrear: ArrearEntryCalculated | null;
}

export function PaymentRequestDialog({
  isOpen,
  onClose,
  onSubmit,
  arrear,
}: PaymentRequestDialogProps) {
  const { settings } = useDataContext();
  const getCurrencySymbol = (currencyCode: string) => {
    try {
      const parts = new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode, currencyDisplay: 'narrowSymbol' }).formatToParts(1);
      return parts.find((part) => part.type === 'currency')?.value || '$';
    } catch (e) { return '$'; }
  };
  const currencySymbol = getCurrencySymbol(settings?.currency || 'USD');

  const [amount, setAmount] = useState<number | ''>('');
  const [method, setMethod] = useState('Pesapal');

  useEffect(() => {
    if (arrear) {
      setAmount(arrear.amountOwed);
    }
  }, [arrear]);

  const handleSubmit = () => {
    if (typeof amount === 'number') {
      onSubmit({ amount, method });
    }
  };

  if (!isOpen || !arrear) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent aria-describedby="payment-description">
        <DialogHeader>
          <DialogTitle>Request Payment from {arrear.tenant}</DialogTitle>
          <DialogDescription id="payment-description">
            Initiate a payment request via your chosen payment gateway.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount to Request *</Label>
            <Input
              id="amount"
              type="number"
              max={arrear.amountOwed}
              value={amount}
              onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
              required
              prefixText={currencySymbol}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gateway">Payment Gateway *</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger id="gateway">
                <SelectValue placeholder="Select a payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Pesapal">Pesapal</SelectItem>
                <SelectItem value="InstaSend">InstaSend</SelectItem>
                <SelectItem value="M-Pesa">M-Pesa STK Push</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Alert>
            <CreditCard className="h-4 w-4" />
            <AlertTitle>How this works</AlertTitle>
            <AlertDescription>
              This action will eventually trigger an API call to the selected gateway to initiate the payment process. For now, it will simulate the request.
            </AlertDescription>
          </Alert>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!amount}>
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
