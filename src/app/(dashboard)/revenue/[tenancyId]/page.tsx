

'use client';

import { useState, useEffect, memo, useMemo } from 'react';
import Link from 'next/link';
import { notFound, useParams, useRouter } from 'next/navigation';
import { format, startOfToday, isBefore, isAfter } from 'date-fns';
import type { Transaction, ServiceCharge, Property } from '@/lib/types';
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
import { cn, formatCurrency } from '@/lib/utils';
import { ArrowLeft, FileText, BadgeCheck, CircleDollarSign, CalendarX2, Info, Pencil, Trash2, MoreVertical, HandCoins, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EndTenancyDialog } from '@/components/end-tenancy-dialog';
import { useUser, useFirestore } from '@/firebase';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, doc, updateDoc, serverTimestamp, addDoc, deleteDoc, writeBatch, getDocs, Query } from 'firebase/firestore';
import { useDataContext } from '@/context/data-context';
import { createUserQuery } from '@/firebase/firestore/query-builder';
import { Skeleton } from '@/components/ui/skeleton';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

function PaymentForm({
  isOpen,
  onClose,
  onSubmit,
  transaction,
  locale,
  currency,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transactionId: string, amount: number) => void;
  transaction: Transaction | null;
  locale: string;
  currency: string;
}) {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    const formatDateAsync = async () => {
      if (transaction) {
        const localeData = await getLocale(locale);
        setFormattedDate(format(new Date(transaction.date), 'PPP', { locale: localeData }));
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

  const totalServiceCharges = transaction.serviceCharges?.reduce((sum, sc) => sum + sc.amount, 0) || 0;
  const totalDueForPeriod = transaction.rent + totalServiceCharges + (transaction.deposit || 0);
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
                <div className="flex justify-between"><span>Total Due for Period:</span> <span className="font-medium">{formatCurrency(totalDueForPeriod, locale, currency)}</span></div>
                <div className="flex justify-between"><span>Already Paid:</span> <span className="font-medium">{formatCurrency(alreadyPaid, locale, currency)}</span></div>
                <hr className="my-1 border-border" />
                <div className="flex justify-between font-semibold"><span>Balance Due:</span> <span>{formatCurrency(balanceDue, locale, currency)}</span></div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amountPaid" className="text-right">Amount to Record</Label>
              <Input id="amountPaid" name="amountPaid" type="number" step="0.01" defaultValue={balanceDue > 0 ? balanceDue.toFixed(2) : ''} className="col-span-3" required />
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

function InvoiceForm({
  isOpen,
  onClose,
  onSubmit,
  transaction,
  locale,
  currency,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: Transaction) => void;
  transaction: Transaction | null;
  locale: string;
  currency: string;
}) {
  const [rent, setRent] = useState(0);
  const [serviceCharges, setServiceCharges] = useState<ServiceCharge[]>([]);

  useEffect(() => {
    if (transaction) {
      setRent(transaction.rent || 0);
      setServiceCharges(transaction.serviceCharges || []);
    }
  }, [transaction]);

  const handleAddCharge = () => {
    setServiceCharges([...serviceCharges, { name: '', amount: 0 }]);
  };

  const handleRemoveCharge = (index: number) => {
    setServiceCharges(serviceCharges.filter((_, i) => i !== index));
  };

  const handleChargeChange = (index: number, field: keyof ServiceCharge, value: string | number) => {
    const newCharges = [...serviceCharges];
    if (field === 'name') {
      newCharges[index].name = value as string;
    } else {
      newCharges[index].amount = Number(value);
    }
    setServiceCharges(newCharges);
  };

  const handleSubmit = () => {
    if (!transaction) return;
    const updatedTransaction = {
      ...transaction,
      rent,
      serviceCharges,
    };
    onSubmit(updatedTransaction);
  };

  if (!isOpen || !transaction) return null;

  const totalDue = rent + serviceCharges.reduce((sum, sc) => sum + sc.amount, 0) + (transaction.deposit || 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Invoice for {format(new Date(transaction.date), 'MMMM yyyy')}</DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="rent">Base Rent</Label>
            <Input id="rent" type="number" value={rent} onChange={(e) => setRent(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Service Charges</Label>
            {serviceCharges.map((charge, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder="Charge Name (e.g., Water)"
                  value={charge.name}
                  onChange={(e) => handleChargeChange(index, 'name', e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Amount"
                  value={charge.amount}
                  onChange={(e) => handleChargeChange(index, 'amount', e.target.value)}
                  className="w-32"
                />
                <Button variant="ghost" size="icon" onClick={() => handleRemoveCharge(index)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={handleAddCharge}>
              Add Service Charge
            </Button>
          </div>
           <div className="!mt-6 text-sm space-y-1 bg-muted p-3 rounded-md">
                <div className="flex justify-between"><span>Base Rent:</span> <span className="font-medium">{formatCurrency(rent, locale, currency)}</span></div>
                {serviceCharges.map((sc, i) => (
                    <div key={i} className="flex justify-between"><span>{sc.name}:</span> <span>{formatCurrency(sc.amount, locale, currency)}</span></div>
                ))}
                {transaction.deposit && <div className="flex justify-between"><span>Deposit:</span> <span className="font-medium">{formatCurrency(transaction.deposit, locale, currency)}</span></div>}
                <hr className="my-1 border-border" />
                <div className="flex justify-between font-semibold"><span>Total Due:</span> <span>{formatCurrency(totalDue, locale, currency)}</span></div>
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
  const tenancyId = params.tenancyId as string;
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { settings } = useDataContext();
  const { locale, currency } = settings;

  // Data Fetching
  const revenueQuery = useMemo(() => user ? createUserQuery(firestore, 'revenue', user.uid, where('tenancyId', '==', tenancyId)) : null, [firestore, user, tenancyId]);
  const propertiesQuery = useMemo(() => user ? createUserQuery(firestore, 'properties', user.uid) : null, [firestore, user]);
  
  const [revenueSnapshot, isRevenueLoading] = useCollection(revenueQuery);
  const [propertiesSnapshot, isPropertiesLoading] = useCollection(propertiesQuery);

  const revenue = useMemo(() => revenueSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction)) || [], [revenueSnapshot]);
  const properties = useMemo(() => propertiesSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Property)) || [], [propertiesSnapshot]);


  const [tenancy, setTenancy] = useState<(Transaction & { transactions: Transaction[] }) | null>(null);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [isEndTenancyOpen, setIsEndTenancyOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    if (isRevenueLoading) {
        setInitialLoadComplete(false);
        return;
    }

    if (!isRevenueLoading && revenue.length > 0) {
        const representativeTx = revenue[0];
        setTenancy({
            ...representativeTx,
            transactions: revenue.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
        });
    }
    setInitialLoadComplete(true);
  }, [revenue, isRevenueLoading]);


  const formattedDates = useMemo(() => {
    if (!tenancy) return {};
    
    const localeDataPromise = getLocale(locale);
    const newFormattedDates: { [key: string]: string } = {};

    const formatDates = async () => {
        const localeData = await localeDataPromise;
        for (const item of tenancy.transactions) {
            newFormattedDates[item.id] = format(new Date(item.date), 'PPP', { locale: localeData });
        }
        if (tenancy.tenancyStartDate) {
           newFormattedDates['start'] = format(new Date(tenancy.tenancyStartDate), 'PPP', { locale: localeData });
        }
        if (tenancy.tenancyEndDate) {
            newFormattedDates['end'] = format(new Date(tenancy.tenancyEndDate), 'PPP', { locale: localeData });
        }
    };
    
    formatDates();

    for (const item of tenancy.transactions) {
        if (!newFormattedDates[item.id]) {
           newFormattedDates[item.id] = format(new Date(item.date), 'PP'); 
        }
    }
     if (tenancy.tenancyStartDate && !newFormattedDates['start']) {
       newFormattedDates['start'] = format(new Date(tenancy.tenancyStartDate), 'PP');
    }
    if (tenancy.tenancyEndDate && !newFormattedDates['end']) {
        newFormattedDates['end'] = format(new Date(tenancy.tenancyEndDate), 'PP');
    }

    return newFormattedDates;
  }, [tenancy, locale]);
  
  // Actions
  const addChangeLogEntry = async (log: Omit<any, 'id' | 'date' | 'ownerId'>) => {
    if (!user) return;
    await addDoc(collection(firestore, 'changelog'), {
      ...log,
      ownerId: user.uid,
      date: serverTimestamp(),
    });
  };

  const handleRecordPayment = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsPaymentFormOpen(true);
  };
  
  const handleEditInvoice = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsInvoiceFormOpen(true);
  };

  const handleInvoiceFormSubmit = async (transaction: Transaction) => {
     await updateDoc(doc(firestore, 'revenue', transaction.id), transaction as any);
     addChangeLogEntry({
        type: 'Tenancy',
        action: 'Updated',
        description: `Invoice for ${format(new Date(transaction.date), 'MMMM yyyy')} updated for "${transaction.tenant}".`,
        entityId: transaction.id,
    });
    setIsInvoiceFormOpen(false);
    setSelectedTransaction(null);
  };

  const handlePaymentFormSubmit = async (transactionId: string, amount: number) => {
    if (!revenue) return;
    const transactionToUpdate = revenue.find(tx => tx.id === transactionId);
    if (transactionToUpdate) {
        const newAmountPaid = (transactionToUpdate.amountPaid || 0) + amount;
        await updateDoc(doc(firestore, 'revenue', transactionId), { amountPaid: newAmountPaid });
        addChangeLogEntry({
            type: 'Payment',
            action: 'Created',
            description: `Payment of ${formatCurrency(amount, locale, currency)} recorded for "${transactionToUpdate.tenant}".`,
            entityId: transactionToUpdate.id,
        });
    }
    setIsPaymentFormOpen(false);
    setSelectedTransaction(null);
  };
  
  const handleReturnDeposit = async () => {
    if (!revenue || !tenancy) return;
    const batch = writeBatch(firestore);
    revenue.forEach(tx => {
        const txRef = doc(firestore, 'revenue', tx.id);
        batch.update(txRef, { depositReturned: true });
    });
    await batch.commit();
    addChangeLogEntry({
        type: 'Tenancy',
        action: 'Updated',
        description: `Deposit for tenancy of "${tenancy.tenant}" was marked as returned.`,
        entityId: tenancy.tenancyId!,
    });
  };

  const handleEndTenancy = async (newEndDate: Date) => {
    if (!tenancy || !user) return;
    
    const batch = writeBatch(firestore);
    const newEndDateString = format(newEndDate, 'yyyy-MM-dd');

    // Find transactions to delete (future, unpaid ones)
    tenancy.transactions.forEach(tx => {
      const txDate = new Date(tx.date);
      if (isAfter(txDate, newEndDate) && (tx.amountPaid ?? 0) === 0) {
        const txRef = doc(firestore, 'revenue', tx.id);
        batch.delete(txRef);
      } else {
        // Update remaining transactions with the new end date
        const txRef = doc(firestore, 'revenue', tx.id);
        batch.update(txRef, { tenancyEndDate: newEndDateString });
      }
    });

    await batch.commit();
    addChangeLogEntry({
        type: 'Tenancy',
        action: 'Updated',
        description: `Tenancy for "${tenancy.tenant}" end date changed to ${format(newEndDate, 'PPP')}.`,
        entityId: tenancy.tenancyId!,
    });
    setIsEndTenancyOpen(false);
  };

  if (isRevenueLoading || isPropertiesLoading || !initialLoadComplete) {
    return (
        <>
            <PageHeader title="Tenancy Details">
                <div className="flex items-center gap-2">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-36" />
                    <Skeleton className="h-10 w-24" />
                </div>
            </PageHeader>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-8 w-1/3" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-48 w-full" />
                </CardContent>
            </Card>
        </>
    );
  }

  if (!tenancy && initialLoadComplete) {
    notFound();
  }
  
  if (!tenancy) {
    return null; // Should be caught by notFound, but satisfies TS
  }


  const property = properties.find(p => p.id === tenancy.propertyId);
  const today = startOfToday();
  const dueTransactions = tenancy.transactions.filter(tx => !isBefore(today, new Date(tx.date)));
  const totalDueToDate = dueTransactions.reduce((sum, tx) => sum + tx.rent + (tx.serviceCharges?.reduce((scSum, sc) => scSum + sc.amount, 0) || 0) + (tx.deposit ?? 0), 0);
  const totalPaid = tenancy.transactions.reduce((sum, tx) => sum + (tx.amountPaid ?? 0), 0);
  const currentBalance = totalDueToDate - totalPaid;
  const firstTransaction = tenancy.transactions[0];
  const depositAmount = firstTransaction.deposit || 0;
  const isDepositReturned = firstTransaction.depositReturned || false;
  const isTenancyEnded = tenancy.tenancyEndDate ? isBefore(new Date(tenancy.tenancyEndDate), today) : false;

  return (
    <>
      <PageHeader title="Tenancy Details">
        <div className="flex items-center gap-2">
            {tenancy.contractUrl && (
              <Button asChild variant="outline">
                <Link href={tenancy.contractUrl} target="_blank">
                  <FileText className="mr-2 h-4 w-4" />
                  View Contract
                </Link>
              </Button>
            )}
            <Button variant="outline" onClick={() => setIsEndTenancyOpen(true)}>
                <CalendarX2 className="mr-2 h-4 w-4" />
                End Tenancy
            </Button>
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
        </div>
      </PageHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="bg-card shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
                <div className="mb-4">
                    <h2 className="text-2xl font-bold text-card-foreground mb-1">
                        {tenancy.tenant}
                    </h2>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", isTenancyEnded ? "bg-muted text-muted-foreground" : "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200")}>
                        {isTenancyEnded ? 'Inactive Tenant' : 'Active Tenant'}
                        </span>
                    </div>
                </div>

                <div className="mb-4 pb-4 border-b border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Property Address
                    </p>
                    <p className="text-base font-medium text-foreground">
                        {tenancy.propertyName}
                    </p>
                </div>

                <div className="mb-4 pb-4 border-b border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                        Contact
                    </p>
                    <p className="text-sm text-foreground mb-1 flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground"/>
                        {tenancy.tenantEmail}
                    </p>
                </div>

                <div className="flex justify-between text-sm pt-2">
                    <div className="space-y-1">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Tenancy Period
                        </p>
                        <p className="font-medium text-foreground">
                            {formattedDates['start']} - {formattedDates['end']}
                        </p>
                    </div>
                    <div className="space-y-1 text-right">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                            Property Type
                        </p>
                        <p className="font-medium text-foreground">
                            {property?.propertyType}
                        </p>
                    </div>
                </div>
            </CardContent>
          </Card>

           <Card className="bg-card shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-card-foreground">
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-baseline">
                <span className="text-sm text-muted-foreground">Total Due to Date</span>
                <span className="text-lg font-bold text-destructive">{formatCurrency(totalDueToDate, locale, currency)}</span>
              </div>

              <div className="flex justify-between items-baseline">
                <span className="text-sm text-muted-foreground">Total Paid</span>
                <span className="text-lg font-bold text-green-600 dark:text-green-500">{formatCurrency(totalPaid, locale, currency)}</span>
              </div>

              <div className="border-t border-border pt-3 mt-3">
                <div className={cn("flex justify-between items-baseline")}>
                    <p className="text-sm font-semibold text-foreground uppercase tracking-wide">
                    Current Balance
                    </p>
                    <p className={cn("text-2xl font-bold", currentBalance > 0 ? 'text-destructive' : 'text-foreground')}>
                    {formatCurrency(currentBalance, locale, currency)}
                    </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card shadow-md hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg font-semibold text-card-foreground flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-muted-foreground"/>
                Deposit Status
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center py-8">
              {isDepositReturned ? (
                <div className="text-center">
                   <p className="text-sm font-medium text-muted-foreground mb-2">Deposit Status</p>
                  <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-muted text-muted-foreground">
                     <BadgeCheck className="mr-2 h-5 w-5 text-primary"/>
                    Deposit Returned
                  </div>
                </div>
              ) : isTenancyEnded ? (
                <Button size="lg" onClick={handleReturnDeposit} disabled={isDepositReturned}>
                    <CircleDollarSign className="mr-2 h-5 w-5" />
                    Return Deposit
                </Button>
              ) : (
                <div className="text-center">
                  <p className="text-sm font-medium text-muted-foreground mb-2">Deposit Held</p>
                  <p className="text-4xl font-bold text-green-600 dark:text-green-400 mb-1">
                    {formatCurrency(depositAmount, locale, currency)}
                  </p>
                  <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200">
                    ✓ Secured
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Due Date</TableHead>
                <TableHead>Total Due</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenancy.transactions.map(tx => {
                const dueDate = new Date(tx.date);
                const totalServiceCharges = tx.serviceCharges?.reduce((sum, sc) => sum + sc.amount, 0) || 0;
                const due = tx.rent + totalServiceCharges + (tx.deposit ?? 0);
                const paid = tx.amountPaid ?? 0;
                const balance = due - paid;
                const isOverdue = isBefore(dueDate, today) && balance > 0;
                const daysOverdue = isOverdue 
                  ? Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24))
                  : 0;

                return (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">
                        {formattedDates[tx.id]}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {formatCurrency(due, locale, currency)}
                          <Popover>
                            <PopoverTrigger asChild>
                              <button>
                                <Info className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 text-sm">
                              <div className="space-y-2">
                                <h4 className="font-medium">Invoice Breakdown</h4>
                                <div className="flex justify-between"><span>Rent:</span> <span>{formatCurrency(tx.rent, locale, currency)}</span></div>
                                {tx.serviceCharges?.map((sc, i) => (
                                    <div key={i} className="flex justify-between"><span>{sc.name}:</span> <span>{formatCurrency(sc.amount, locale, currency)}</span></div>
                                ))}
                                {tx.deposit && tx.deposit > 0 && <div className="flex justify-between"><span>Deposit:</span> <span>{formatCurrency(tx.deposit, locale, currency)}</span></div>}
                                {tx.notes && <p className="text-xs text-muted-foreground pt-2 border-t mt-2">{tx.notes}</p>}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(paid, locale, currency)}</TableCell>
                      <TableCell className={cn("font-medium", balance > 0 ? 'text-destructive' : 'text-primary')}>
                        {formatCurrency(balance, locale, currency)}
                      </TableCell>
                      <TableCell>
                        {isOverdue ? (
                          <Badge variant="destructive">{daysOverdue} days overdue</Badge>
                        ) : balance <= 0 && paid > 0 ? (
                          <Badge variant="secondary">Paid</Badge>
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                          <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                      <MoreVertical className="h-4 w-4" />
                                  </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                  <DropdownMenuItem onSelect={() => handleRecordPayment(tx)} disabled={balance <= 0}>
                                      <HandCoins className="mr-2 h-4 w-4" />
                                      Record Payment
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onSelect={() => handleEditInvoice(tx)}>
                                      <Pencil className="mr-2 h-4 w-4" />
                                      Edit Invoice
                                  </DropdownMenuItem>
                              </DropdownMenuContent>
                          </DropdownMenu>
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
        currency={currency}
      />
      
       <InvoiceForm
        isOpen={isInvoiceFormOpen}
        onClose={() => setIsInvoiceFormOpen(false)}
        onSubmit={handleInvoiceFormSubmit}
        transaction={selectedTransaction}
        locale={locale}
        currency={currency}
      />
      
      <EndTenancyDialog
        isOpen={isEndTenancyOpen}
        onClose={() => setIsEndTenancyOpen(false)}
        onConfirm={handleEndTenancy}
        tenancy={tenancy}
      />
    </>
  );
});

export default function TenancyDetailPage() {
    return (
        <TenancyDetailPageContent />
    )
}
