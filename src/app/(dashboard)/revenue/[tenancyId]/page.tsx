
'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { format, startOfToday } from 'date-fns';
import { useDataContext } from '@/context/data-context';
import type { Transaction } from '@/lib/types';
import { getLocale } from '@/lib/locales';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { ArrowLeft, FileText } from 'lucide-react';
import { Badge } from '@/components/ui/badge';


function PaymentForm({
  isOpen,
  onClose,
  onSubmit,
  transaction,
  locale,
  formatCurrency,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transactionId: string, amount: number) => void;
  transaction: Transaction | null;
  locale: string;
  formatCurrency: (amount: number) => string;
}) {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    const formatDateAsync = async () => {
      if (transaction) {
        const localeData = await getLocale(locale);
        setFormattedDate(format(new Date(transaction.date), 'MMMM dd, yyyy', { locale: localeData }));
      }
    };
    formatDateAsync();
  }, [transaction, locale]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!transaction) return;
    const formData = new FormData(event.currentTarget);
    const amountPaid = Number(formData.get('amountPaid'));
    onSubmit(transaction.id, amountPaid);
    onClose();
  };

  if (!isOpen || !transaction) return null;

  const totalDueForPeriod = (transaction.amount || 0) + (transaction.deposit || 0);
  const alreadyPaid = transaction.amountPaid || 0;
  const balanceDue = totalDueForPeriod - alreadyPaid;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">
          For {transaction.tenant} at {transaction.propertyName} (Due: {formattedDate})
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
             <div className="text-sm space-y-1 bg-muted p-3 rounded-md">
                <div className="flex justify-between"><span>Total Due for Period:</span> <span className="font-medium">{formatCurrency(totalDueForPeriod)}</span></div>
                <div className="flex justify-between"><span>Already Paid:</span> <span className="font-medium">{formatCurrency(alreadyPaid)}</span></div>
                <hr className="my-1 border-border" />
                <div className="flex justify-between font-semibold"><span>Balance Due:</span> <span>{formatCurrency(balanceDue)}</span></div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amountPaid" className="text-right">Amount to Record</Label>
              <Input id="amountPaid" name="amountPaid" type="number" step="0.01" defaultValue={balanceDue > 0 ? balanceDue : ''} className="col-span-3" required />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save Payment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


export default function TenancyDetailPage({ params }: { params: { tenancyId: string } }) {
  const resolvedParams = use(params);
  const { revenue, setRevenue, formatCurrency, locale } = useDataContext();
  const [tenancy, setTenancy] = useState<(Transaction & { transactions: Transaction[] }) | null>(null);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [formattedDates, setFormattedDates] = useState<{ [key: string]: string }>({});
  
  useEffect(() => {
    const allTransactionsForTenancy = revenue.filter(tx => tx.tenancyId === resolvedParams.tenancyId);
    if (allTransactionsForTenancy.length > 0) {
      const representativeTx = allTransactionsForTenancy[0];
      setTenancy({
        ...representativeTx,
        transactions: allTransactionsForTenancy.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
      });
    }
  }, [revenue, resolvedParams.tenancyId]);

  useEffect(() => {
    const formatAllDates = async () => {
        if (!tenancy) return;
        const localeData = await getLocale(locale);
        const newFormattedDates: { [key: string]: string } = {};
        for (const item of tenancy.transactions) {
            newFormattedDates[item.id] = format(new Date(item.date), 'MMM dd, yyyy', { locale: localeData });
        }
        if (tenancy.tenancyStartDate) {
           newFormattedDates['start'] = format(new Date(tenancy.tenancyStartDate), 'MMMM dd, yyyy', { locale: localeData });
        }
        if (tenancy.tenancyEndDate) {
            newFormattedDates['end'] = format(new Date(tenancy.tenancyEndDate), 'MMMM dd, yyyy', { locale: localeData });
        }
        setFormattedDates(newFormattedDates);
    };
    formatAllDates();
  }, [tenancy, locale]);
  
  const handleRecordPayment = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsPaymentFormOpen(true);
  };
  
  const handlePaymentFormSubmit = (transactionId: string, amount: number) => {
    setRevenue(revenue.map(tx => {
      if (tx.id === transactionId) {
        // Add the new payment to the existing amount paid
        const newAmountPaid = (tx.amountPaid || 0) + amount;
        return { ...tx, amountPaid: newAmountPaid };
      }
      return tx;
    }));
    setIsPaymentFormOpen(false);
    setSelectedTransaction(null);
  };

  if (!tenancy) {
    // You can show a loading state here
    return <div>Loading...</div>;
  }
  
  if (tenancy.transactions.length === 0) {
    return notFound();
  }

  const today = startOfToday();

  // Calculate KPIs based on transactions due up to today
  const dueTransactions = tenancy.transactions.filter(tx => new Date(tx.date) <= today);
  const totalDueToDate = dueTransactions.reduce((sum, tx) => sum + tx.amount + (tx.deposit ?? 0), 0);
  const totalPaid = tenancy.transactions.reduce((sum, tx) => sum + (tx.amountPaid ?? 0), 0);
  const currentBalance = totalDueToDate - totalPaid;


  return (
    <>
      <PageHeader title={`Tenancy Details`}>
        <div className="flex items-center gap-2">
            {tenancy.contractUrl && (
              <Button asChild variant="secondary">
                <Link href={tenancy.contractUrl} target="_blank">
                  <FileText className="mr-2 h-4 w-4" />
                  View Contract
                </Link>
              </Button>
            )}
            <Button asChild variant="outline">
                <Link href="/revenue">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Revenue
                </Link>
            </Button>
        </div>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{tenancy.tenant}</CardTitle>
          <CardDescription>
            {tenancy.propertyName}
            <br />
            Tenancy Period: {formattedDates['start']} - {formattedDates['end']}
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Due to Date</div>
                    <div className="text-2xl font-bold">{formatCurrency(totalDueToDate)}</div>
                </div>
                 <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Total Paid</div>
                    <div className="text-2xl font-bold">{formatCurrency(totalPaid)}</div>
                </div>
                 <div className="p-4 bg-muted rounded-lg">
                    <div className="text-sm text-muted-foreground">Current Balance</div>
                    <div className={cn("text-2xl font-bold", currentBalance > 0 ? 'text-destructive' : 'text-primary')}>
                        {formatCurrency(currentBalance)}
                    </div>
                </div>
            </div>

            <h4 className="font-semibold mb-2 text-lg">Monthly Breakdown</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Rent</TableHead>
                  <TableHead>Deposit</TableHead>
                  <TableHead className="text-right">Amount Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tenancy.transactions.map(tx => {
                  const dueDate = new Date(tx.date);
                  const due = tx.amount + (tx.deposit ?? 0);
                  const paid = tx.amountPaid ?? 0;
                  const balance = due - paid;
                  const isOverdue = dueDate < today && balance > 0;
                  const daysOverdue = isOverdue 
                    ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24))
                    : 0;

                  return (
                      <TableRow key={tx.id}>
                        <TableCell>{formattedDates[tx.id]}</TableCell>
                        <TableCell>{formatCurrency(tx.amount)}</TableCell>
                        <TableCell>{formatCurrency(tx.deposit ?? 0)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(paid)}</TableCell>
                        <TableCell className={cn("text-right font-medium", balance > 0 ? 'text-destructive' : 'text-primary')}>
                          {formatCurrency(balance)}
                        </TableCell>
                        <TableCell>
                          {isOverdue ? (
                            <Badge variant="destructive">{daysOverdue} days overdue</Badge>
                          ) : balance <= 0 ? (
                            <Badge variant="secondary">Paid</Badge>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button size="sm" variant="outline" onClick={() => handleRecordPayment(tx)}>
                            Record Payment
                          </Button>
                        </TableCell>
                      </TableRow>
                  )
                })}
              </TableBody>
            </Table>
        </CardContent>
      </Card>

       <PaymentForm
        isOpen={isPaymentFormOpen}
        onClose={() => setIsPaymentFormOpen(false)}
        onSubmit={handlePaymentFormSubmit}
        transaction={selectedTransaction}
        locale={locale}
        formatCurrency={formatCurrency}
      />
    </>
  );
}
