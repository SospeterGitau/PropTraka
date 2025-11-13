
'use client';

import { useState, useEffect } from 'react';
import type { ArrearEntry } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CreditCard } from 'lucide-react';

interface PaymentRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (details: { amount: number; method: string }) => void;
  arrear: ArrearEntry | null;
  formatCurrency: (amount: number) => string;
}

export function PaymentRequestDialog({
  isOpen,
  onClose,
  onSubmit,
  arrear,
  formatCurrency,
}: PaymentRequestDialogProps) {
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState('Pesapal');

  useEffect(() => {
    if (arrear) {
      setAmount(arrear.amountOwed);
    }
  }, [arrear]);

  const handleSubmit = () => {
    onSubmit({ amount, method });
  };

  if (!isOpen || !arrear) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Request Payment from {arrear.tenant}</DialogTitle>
          <DialogDescription>
            Initiate a payment request via your chosen payment gateway.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount to Request</Label>
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              max={arrear.amountOwed}
            />
            <p className="text-sm text-muted-foreground">
              Maximum amount owed: {formatCurrency(arrear.amountOwed)}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gateway">Payment Gateway</Label>
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
          <Button onClick={handleSubmit}>
            Send Request
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
