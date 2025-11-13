

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
import { cn } from '@/lib/utils';
import { ArrowLeft, FileText, BadgeCheck, CircleDollarSign, CalendarX2, Info, Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { EndTenancyDialog } from '@/components/end-tenancy-dialog';
import { useUser, useFirestore } from '@/firebase';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, doc, updateDoc, serverTimestamp, addDoc, deleteDoc, writeBatch, getDocs, Query } from 'firebase/firestore';
import { useDataContext } from '@/context/data-context';
import { createUserQuery } from '@/firebase/firestore/query-builder';

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
                <div className="flex justify-between"><span>Total Due for Period:</span> <span className="font-medium">{formatCurrency(totalDueForPeriod)}</span></div>
                <div className="flex justify-between"><span>Already Paid:</span> <span className="font-medium">{formatCurrency(alreadyPaid)}</span></div>
                <hr className="my-1 border-border" />
                <div className="flex justify-between font-semibold"><span>Balance Due:</span> <span>{formatCurrency(balanceDue)}</span></div>
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
  formatCurrency,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: Transaction) => void;
  transaction: Transaction | null;
  formatCurrency: (amount: number) => string;
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
                <div className="flex justify-between"><span>Base Rent:</span> <span className="font-medium">{formatCurrency(rent)}</span></div>
                {serviceCharges.map((sc, i) => (
                    <div key={i} className="flex justify-between"><span>{sc.name}:</span> <span>{formatCurrency(sc.amount)}</span></div>
                ))}
                {transaction.deposit && <div className="flex justify-between"><span>Deposit:</span> <span className="font-medium">{formatCurrency(transaction.deposit)}</span></div>}
                <hr className="my-1 border-border" />
                <div className="flex justify-between font-semibold"><span>Total Due:</span> <span>{formatCurrency(totalDue)}</span></div>
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

  const revenue = useMemo(() => revenueSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)) || [], [revenueSnapshot]);
  const properties = useMemo(() => propertiesSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property)) || [], [propertiesSnapshot]);


  const [tenancy, setTenancy] = useState<(Transaction & { transactions: Transaction[] }) | null>(null);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [isInvoiceFormOpen, setIsInvoiceFormOpen] = useState(false);
  const [isEndTenancyOpen, setIsEndTenancyOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [formattedDates, setFormattedDates] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (isRevenueLoading) return;
    if (!revenue || revenue.length === 0) {
      if (!isRevenueLoading) notFound();
      return;
    };
    
    const representativeTx = revenue[0];
    setTenancy({
      ...representativeTx,
      transactions: revenue.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    });
  }, [revenue, isRevenueLoading]);

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
  
  // Formatters
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  };
  
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
            description: `Payment of ${formatCurrency(amount)} recorded for "${transactionToUpdate.tenant}".`,
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
        description: `Tenancy for "${tenancy.tenant}" end date changed to ${format(newEndDate, 'MMMM dd, yyyy')}.`,
        entityId: tenancy.tenancyId!,
    });
    setIsEndTenancyOpen(false);
  };

  if (isRevenueLoading || isPropertiesLoading) {
    return <div>Loading...</div>;
  }
  
  if (!tenancy) {
      if (!isRevenueLoading) {
          // If loading is done and still no tenancy, then it's a 404
          notFound();
      }
      return <div>Loading...</div>;
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
      <PageHeader title={`Tenancy Details`}>
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
            <Button asChild onClick={() => router.back()}>
                <Link href="#">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back
                </Link>
            </Button>
        </div>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{tenancy.tenant}</CardTitle>
          <CardDescription>
            {tenancy.propertyName}
            {property && (
              <div className="text-muted-foreground text-sm">{property.propertyType} &middot; {property.buildingType}</div>
            )}
            <br />
            {tenancy.tenantEmail} {tenancy.tenantPhone && `· ${tenancy.tenantPhone}`}
            <br />
            Tenancy Period: {formattedDates['start']} - {formattedDates['end']}
          </CardDescription>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 text-center">
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
                <div className="p-4 bg-muted rounded-lg flex flex-col items-center justify-center">
                    <div className="text-sm text-muted-foreground">Deposit Status</div>
                    <div className="text-lg font-bold h-[32px] flex items-center justify-center">
                        {isDepositReturned ? (
                           <Badge variant="secondary" className="text-base">
                                <BadgeCheck className="mr-2 h-4 w-4 text-green-500"/>
                                Returned
                            </Badge>
                        ) : isTenancyEnded ? (
                            <Button size="sm" onClick={handleReturnDeposit} disabled={isDepositReturned}>
                                <CircleDollarSign className="mr-2 h-4 w-4" />
                                Return Deposit
                            </Button>
                        ) : (
                             <div className="text-center">
                                {depositAmount > 0 ? (
                                    <span className="font-bold text-lg">Held <span className="text-base font-medium text-muted-foreground">({formatCurrency(depositAmount)})</span></span>
                                ) : (
                                    <span className="font-bold text-lg">None</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <h4 className="font-semibold mb-2 text-lg">Monthly Breakdown</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Total Due</TableHead>
                  <TableHead className="text-right">Amount Paid</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Action</TableHead>
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
                        <TableCell>
                          {formattedDates[tx.id]}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                             {formatCurrency(due)}
                            <Popover>
                              <PopoverTrigger asChild>
                                <button>
                                  <Info className="h-4 w-4 text-muted-foreground hover:text-foreground" />
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80 text-sm">
                                <div className="space-y-2">
                                  <h4 className="font-medium">Invoice Breakdown</h4>
                                  <div className="flex justify-between"><span>Rent:</span> <span>{formatCurrency(tx.rent)}</span></div>
                                  {tx.serviceCharges?.map((sc, i) => (
                                     <div key={i} className="flex justify-between"><span>{sc.name}:</span> <span>{formatCurrency(sc.amount)}</span></div>
                                  ))}
                                  {tx.deposit && tx.deposit > 0 && <div className="flex justify-between"><span>Deposit:</span> <span>{formatCurrency(tx.deposit)}</span></div>}
                                  {tx.notes && <p className="text-xs text-muted-foreground pt-2 border-t mt-2">{tx.notes}</p>}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(paid)}</TableCell>
                        <TableCell className={cn("text-right font-medium", balance > 0 ? 'text-destructive' : 'text-accent')}>
                          {formatCurrency(balance)}
                        </TableCell>
                        <TableCell>
                          {isOverdue ? (
                            <Badge variant="destructive">{daysOverdue} days overdue</Badge>
                          ) : balance <= 0 ? (
                            <Badge variant="secondary">Paid</Badge>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-center space-x-2">
                           <Button size="sm" variant="outline" onClick={() => handleEditInvoice(tx)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleRecordPayment(tx)} disabled={balance <= 0}>
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
      
       <InvoiceForm
        isOpen={isInvoiceFormOpen}
        onClose={() => setIsInvoiceFormOpen(false)}
        onSubmit={handleInvoiceFormSubmit}
        transaction={selectedTransaction}
        formatCurrency={formatCurrency}
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
