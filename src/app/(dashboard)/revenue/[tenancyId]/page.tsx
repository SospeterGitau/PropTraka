
'use client';

import { useState, useEffect, memo, useMemo } from 'react';
import Link from 'next/link';
import { notFound, useParams, useRouter } from 'next/navigation';
import { format, startOfToday, isBefore, isAfter } from 'date-fns';
import type { Transaction, ServiceCharge, Property, Tenancy, Tenant } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn, formatCurrency } from '@/lib/utils';
import { ArrowLeft, FileText, BadgeCheck, CircleDollarSign, CalendarX2, Info, Pencil, Trash2, MoreVertical, HandCoins, ListChecks, FileInput, Edit, ChevronDown, Landmark, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EndTenancyDialog } from '@/components/end-tenancy-dialog';
import { useUser, useFirestore } from '@/firebase';
import { useCollection, useDocument } from 'react-firebase-hooks/firestore';
import { collection, query, where, doc, updateDoc, serverTimestamp, addDoc, writeBatch, orderBy } from 'firebase/firestore'; // Added orderBy
import { useDataContext } from '@/context/data-context';
import { createUserQuery } from '@/firebase/firestore/query-builder';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';

function PaymentForm({ isOpen, onClose, onSubmit, transaction }: {
  isOpen: boolean; onClose: () => void; onSubmit: (transactionId: string, amount: number) => void; transaction: Transaction | null;
}) {
  const { settings } = useDataContext();
  const getCurrencySymbol = (currencyCode: string) => {
    try {
      const parts = new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode, currencyDisplay: 'narrowSymbol' }).formatToParts(1);
      return parts.find((part) => part.type === 'currency')?.value || '$';
    } catch (e) { return '$'; }
  };
  const currencySymbol = getCurrencySymbol(settings?.currency || 'USD');

  const [amount, setAmount] = useState<number | ''>('');
  const [balanceDue, setBalanceDue] = useState(0);

  useEffect(() => {
    if (transaction) {
      const totalServiceCharges = transaction.serviceCharges?.reduce((sum, sc) => sum + sc.amount, 0) || 0;
      const totalDue = (transaction.rent || 0) + totalServiceCharges + (transaction.deposit || 0);
      const paid = transaction.amountPaid || 0;
      const newBalance = totalDue - paid;
      setBalanceDue(newBalance);
      setAmount(newBalance > 0 ? newBalance : '');
    }
  }, [transaction]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!transaction || !transaction.id || typeof amount !== 'number') return;
    onSubmit(transaction.id, amount);
    onClose();
  };

  if (!isOpen || !transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent aria-describedby="payment-description">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
          <DialogDescription id="payment-description">For {transaction.tenant} at {transaction.propertyName}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="text-sm space-y-1 bg-muted p-3 rounded-md">
              <div className="flex justify-between font-semibold"><span>Balance Due:</span> <span>{formatCurrency(balanceDue, settings?.locale || 'en-KE', settings?.currency || 'KES')}</span></div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amountPaid">Amount to Record *</Label>
              <div className="flex h-10 w-full items-center rounded-md border border-input bg-background pl-3 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
                <span className="text-muted-foreground whitespace-nowrap">{currencySymbol}</span>
                <input id="amountPaid" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')} required className="flex-1 bg-transparent px-3 py-2 placeholder:text-muted-foreground focus:outline-none" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Payment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function InvoiceForm({ isOpen, onClose, onSubmit, transaction }: {
  isOpen: boolean; onClose: () => void; onSubmit: (transaction: Transaction) => void; transaction: Transaction | null;
}) {
  const { settings } = useDataContext();
  const getCurrencySymbol = (currencyCode: string) => {
    try {
      const parts = new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode, currencyDisplay: 'narrowSymbol' }).formatToParts(1);
      return parts.find((part) => part.type === 'currency')?.value || '$';
    } catch (e) { return '$'; }
  };
  const currencySymbol = getCurrencySymbol(settings?.currency || 'USD');

  const [rent, setRent] = useState<number | ''>('');
  const [serviceCharges, setServiceCharges] = useState<ServiceCharge[]>([]);

  useEffect(() => {
    if (transaction) {
      setRent(transaction.rent || '');
      setServiceCharges(transaction.serviceCharges || []);
    }
  }, [transaction]);

  const handleAddCharge = () => setServiceCharges([...serviceCharges, { name: '', amount: 0 }]);
  const handleRemoveCharge = (index: number) => setServiceCharges(serviceCharges.filter((_, i) => i !== index));
  const handleChargeChange = (index: number, field: keyof ServiceCharge, value: string | number) => {
    const newCharges = [...serviceCharges];
    newCharges[index][field] = value as never;
    setServiceCharges(newCharges);
  };

  const handleSubmit = () => {
    if (!transaction) return;
    onSubmit({ ...transaction, rent: Number(rent), serviceCharges });
  };

  if (!isOpen || !transaction) return null;

  const totalDue = Number(rent) + serviceCharges.reduce((sum, sc) => sum + sc.amount, 0) + (transaction.deposit || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg" aria-describedby="invoice-description">
        <DialogHeader>
          <DialogTitle>Edit Invoice for {transaction.date ? format(new Date(transaction.date), 'MMMM yyyy') : 'Invoice'}</DialogTitle>
          <DialogDescription id="invoice-description">Edit the rent and service charges for this billing period.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="rent">Base Rent *</Label>
            <div className="flex h-10 w-full items-center rounded-md border border-input bg-background pl-3 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
              <span className="text-muted-foreground whitespace-nowrap">{currencySymbol}</span>
              <input id="rent" type="number" value={rent} onChange={(e) => setRent(e.target.value ? Number(e.target.value) : '')} required className="flex-1 bg-transparent px-3 py-2" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Service Charges</Label>
            {serviceCharges.map((charge, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input placeholder="Charge Name (e.g., Water)" value={charge.name} onChange={(e) => handleChargeChange(index, 'name', e.target.value)} className="flex-1" />
                <div className="flex h-10 w-40 items-center rounded-md border border-input bg-background pl-3 text-sm">
                  <span className="text-muted-foreground">{currencySymbol}</span>
                  <input type="number" placeholder="Amount" value={charge.amount} onChange={(e) => handleChargeChange(index, 'amount', e.target.value)} className="w-full bg-transparent px-3 py-2" />
                </div>
                <Button variant="ghost" size="icon" onClick={() => handleRemoveCharge(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={handleAddCharge}>Add Service Charge</Button>
          </div>
          <div className="!mt-6 text-sm space-y-1 bg-muted p-3 rounded-md">
            <div className="flex justify-between font-semibold"><span>Total Due:</span> <span>{formatCurrency(totalDue, settings?.locale || 'en-KE', settings?.currency || 'KES')}</span></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit}>Save Invoice</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const TenancyDetailPageContent = memo(function TenancyDetailPageContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { settings } = useDataContext();
  const tenancyId = typeof params.tenancyId === 'string' ? params.tenancyId : '';

  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Queries
  const [tenancySnapshot, isTenancyLoading] = useDocument(
    tenancyId ? doc(firestore, 'tenancies', tenancyId) : null
  );
  const tenancy = tenancySnapshot?.exists() ? { id: tenancySnapshot.id, ...tenancySnapshot.data() } as Tenancy : null;

  const [propertySnapshot] = useDocument(
    tenancy?.propertyId ? doc(firestore, 'properties', tenancy.propertyId) : null
  );
  const property = propertySnapshot?.exists() ? { id: propertySnapshot.id, ...propertySnapshot.data() } as Property : null;

  const [tenantSnapshot] = useDocument(
    tenancy?.tenantId ? doc(firestore, 'tenants', tenancy.tenantId) : null
  );
  const tenant = tenantSnapshot?.exists() ? { id: tenantSnapshot.id, ...tenantSnapshot.data() } as Tenant : null;

  const transactionsQuery = useMemo(() =>
    tenancyId ? query(collection(firestore, 'revenue'), where('tenancyId', '==', tenancyId), orderBy('date', 'desc')) : null
    , [firestore, tenancyId]);

  const [transactionsSnapshot, isTransactionsLoading] = useCollection(transactionsQuery);
  const transactions = useMemo(() => transactionsSnapshot?.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      date: data.date?.toDate ? data.date.toDate() : new Date(data.date)
    } as Transaction;
  }) || [], [transactionsSnapshot]);

  const isLoading = isTenancyLoading || isTransactionsLoading;

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  if (!tenancy) {
    return <div className="p-8 text-center text-muted-foreground">Tenancy not found.</div>;
  }

  // Handlers
  const handleRecordPayment = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsPaymentOpen(true);
  };

  const submitPayment = async (transactionId: string, amount: number) => {
    if (!user) return;
    try {
      const txRef = doc(firestore, 'revenue', transactionId);
      const tx = transactions.find(t => t.id === transactionId);
      if (!tx) return;

      const existingPaid = tx.amountPaid || 0;
      const newTotalPaid = existingPaid + amount;

      // Calculate total due
      const totalServiceCharges = tx.serviceCharges?.reduce((sum, sc) => sum + sc.amount, 0) || 0;
      const totalDue = (tx.rent || 0) + totalServiceCharges + (tx.deposit || 0);

      let newStatus = tx.status;
      const now = new Date();
      if (newTotalPaid >= totalDue) {
        newStatus = 'Paid';
      } else if (now > new Date(tx.date) && newTotalPaid < totalDue) {
        newStatus = 'Overdue'; // Or 'Partially Paid' if you add that status
      }

      await updateDoc(txRef, {
        amountPaid: newTotalPaid,
        status: newStatus,
        updatedAt: serverTimestamp()
      });
      // You might want to log this payment in a separate collection too
    } catch (error) {
      console.error("Error recording payment:", error);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Tenancy Details">
        <Button variant="outline" asChild>
          <Link href="/revenue">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to List
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Tenant</span>
              <span className="font-medium">{tenant ? `${tenant.firstName} ${tenant.lastName}` : 'Unknown'}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Property</span>
              <span className="font-medium">{property ? `${property.address.street}` : 'Unknown'}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={tenancy.status === 'Active' ? 'success' : 'secondary'}>{tenancy.status}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Period</span>
              <span className="text-sm">
                {tenancy.startDate ? format(new Date(tenancy.startDate.seconds * 1000), 'dd MMM yyyy') : '-'} — {tenancy.endDate ? format(new Date(tenancy.endDate.seconds * 1000), 'dd MMM yyyy') : '-'}
              </span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Financial Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Monthly Rent</span>
              <span className="text-xl font-bold">{formatCurrency(tenancy.rentAmount, settings?.locale, settings?.currency)}</span>
            </div>
            {tenancy.depositAmount && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Deposit</span>
                <span>{formatCurrency(tenancy.depositAmount, settings?.locale, settings?.currency)}</span>
              </div>
            )}
            {tenancy.serviceChargeAmount && (
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Service Charges</span>
                <span>{formatCurrency(tenancy.serviceChargeAmount, settings?.locale, settings?.currency)}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Breakdown of rent, deposits, and service charges.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Paid</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8">No transactions found.</TableCell></TableRow>
              ) : (
                transactions.map(tx => (
                  <TableRow key={tx.id}>
                    <TableCell>{format(tx.date, 'dd MMM yyyy')}</TableCell>
                    <TableCell>
                      <div className="font-medium">{tx.invoiceNumber}</div>
                      {tx.notes && <div className="text-xs text-muted-foreground">{tx.notes}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{tx.type}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={tx.status === 'Paid' ? 'success' : tx.status === 'Overdue' ? 'destructive' : 'secondary'}>
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(tx.amount, settings?.locale, settings?.currency)}
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {formatCurrency(tx.amountPaid || 0, settings?.locale, settings?.currency)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {tx.status !== 'Paid' && (
                            <DropdownMenuItem onClick={() => handleRecordPayment(tx)}>
                              <BadgeCheck className="mr-2 h-4 w-4" /> Record Payment
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem><FileText className="mr-2 h-4 w-4" /> View Invoice</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <PaymentForm
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onSubmit={submitPayment}
        transaction={selectedTransaction}
      />
    </div>
  );
});

export default function TenancyDetailPage() {
  return <TenancyDetailPageContent />
}
