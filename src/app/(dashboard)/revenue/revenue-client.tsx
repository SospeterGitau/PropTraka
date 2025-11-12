
'use client';

import { useState, useEffect, memo, useMemo } from 'react';
import Link from 'next/link';
import { MoreHorizontal, PlusCircle, Users } from 'lucide-react';
import { format, startOfToday, isBefore } from 'date-fns';
import type { Property, Transaction } from '@/lib/types';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, addDoc, doc, serverTimestamp, writeBatch, getDocs } from 'firebase/firestore';
import { useDataContext } from '@/context/data-context';


const RevenueClient = memo(function RevenueClient() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { settings } = useDataContext();
  const { locale, currency } = settings;

  // Data Fetching
  const revenueQuery = useMemo(() => user ? query(collection(firestore, 'revenue'), where('ownerId', '==', user.uid)) : null, [firestore, user]);
  const { data: revenue, loading: isRevenueLoading } = useCollection<Transaction>(revenueQuery);
  const isDataLoading = isRevenueLoading;

  // State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [formattedDates, setFormattedDates] = useState<{ [key: string]: string }>({});

  // Formatters
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  };

  useEffect(() => {
    if (!revenue) return;
    const formatAllDates = async () => {
      const localeData = await getLocale(locale);
      const newFormattedDates: { [key: string]: string } = {};
      for (const item of revenue) {
        if(item.tenancyId && item.tenancyStartDate && !newFormattedDates[`${item.tenancyId}-start`]) {
          newFormattedDates[`${item.tenancyId}-start`] = format(new Date(item.tenancyStartDate), 'MMM dd, yyyy', { locale: localeData });
        }
        if(item.tenancyId && item.tenancyEndDate && !newFormattedDates[`${item.tenancyId}-end`]) {
          newFormattedDates[`${item.tenancyId}-end`] = format(new Date(item.tenancyEndDate), 'MMM dd, yyyy', { locale: localeData });
        }
        if(item.tenancyId && item.nextDueDate && !newFormattedDates[`${item.tenancyId}-nextDue`]) {
            newFormattedDates[`${item.tenancyId}-nextDue`] = format(new Date(item.nextDueDate), 'MMM dd, yyyy', { locale: localeData });
        }
      }
      setFormattedDates(newFormattedDates);
    };
    formatAllDates();
  }, [revenue, locale]);

  const addChangeLogEntry = async (log: Omit<any, 'id' | 'date' | 'ownerId'>) => {
    if (!user) return;
    await addDoc(collection(firestore, 'changelog'), {
      ...log,
      ownerId: user.uid,
      date: serverTimestamp(),
    });
  };
  
  const handleDeleteTenancy = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedTransaction?.tenancyId && user) {
      const batch = writeBatch(firestore);
      const q = query(collection(firestore, 'revenue'), where('tenancyId', '==', selectedTransaction.tenancyId), where('ownerId', '==', user.uid));
      const snapshot = await getDocs(q);
      snapshot.forEach(doc => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      addChangeLogEntry({
        type: 'Tenancy',
        action: 'Deleted',
        description: `Tenancy for "${selectedTransaction.tenant}" at "${selectedTransaction.propertyName}" was deleted.`,
        entityId: selectedTransaction.tenancyId,
      });
      setIsDeleteDialogOpen(false);
      setSelectedTransaction(null);
    }
  };

  
  if (isDataLoading) {
    return (
        <>
            <PageHeader title="Revenue">
                <Button disabled>Add Tenancy</Button>
            </PageHeader>
            <Card>
                <CardHeader>
                    <CardTitle><Skeleton className="h-6 w-1/2" /></CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <Skeleton className="h-48 w-full" />
                </CardContent>
            </Card>
        </>
    );
  }

  const tenancies = Object.values(
    (revenue || []).reduce((acc, tx) => {
      const tenancyId = tx.tenancyId || `no-id-${tx.id}`;
      if (!acc[tenancyId]) {
        acc[tenancyId] = {
          ...tx,
          transactions: [],
        };
      }
      acc[tenancyId].transactions.push(tx);
      return acc;
    }, {} as Record<string, Transaction & { transactions: Transaction[] }>)
  ).map(tenancy => {
      const today = startOfToday();
      const sortedTransactions = tenancy.transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const unpaidTransactions = sortedTransactions.filter(tx => {
        const totalServiceCharges = (tx.serviceCharges || []).reduce((sum, sc) => sum + sc.amount, 0);
        const due = tx.rent + totalServiceCharges + (tx.deposit ?? 0);
        const paid = tx.amountPaid ?? 0;
        return paid < due;
      });

      const earliestOverdue = unpaidTransactions.find(tx => isBefore(new Date(tx.date), today));
      const nextUpcoming = unpaidTransactions.find(tx => !isBefore(new Date(tx.date), today));

      const nextDueTransaction = earliestOverdue || nextUpcoming;
      
      return {
          ...tenancy,
          nextDueDate: nextDueTransaction?.date,
      };
  });

  return (
    <>
      <PageHeader title="Revenue">
        <Button asChild>
            <Link href="/revenue/add">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Tenancy
            </Link>
        </Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Revenue Transactions by Tenancy</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
           {tenancies.length > 0 ? (
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Tenant &amp; Property</TableHead>
                    <TableHead>Tenancy Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Total Due</TableHead>
                    <TableHead className="text-right">Total Paid</TableHead>
                    <TableHead className="text-right">Total Balance</TableHead>
                    <TableHead className="w-[100px] text-center">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                        {tenancies.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tenancy) => {
                            const totalDue = tenancy.transactions.reduce((sum, tx) => sum + tx.rent + ((tx.serviceCharges || []).reduce((scSum, s) => scSum + s.amount, 0)) + (tx.deposit ?? 0), 0);
                            const totalPaid = tenancy.transactions.reduce((sum, tx) => sum + (tx.amountPaid ?? 0), 0);
                            const totalBalance = totalDue - totalPaid;
                            
                            const today = startOfToday();
                            const isTenancyActive = tenancy.tenancyStartDate && tenancy.tenancyEndDate && new Date(tenancy.tenancyStartDate) <= today && new Date(tenancy.tenancyEndDate) >= today;

                            let statusBadge;
                            const hasOverdue = tenancy.nextDueDate && isBefore(new Date(tenancy.nextDueDate), today);
                            
                            if (hasOverdue) {
                                statusBadge = <Badge variant="destructive">Overdue {formattedDates[`${tenancy.tenancyId}-nextDue`]}</Badge>
                            } else if (tenancy.nextDueDate && !hasOverdue) {
                                 statusBadge = <Badge variant="outline">Upcoming {formattedDates[`${tenancy.tenancyId}-nextDue`]}</Badge>
                            } else if (!isTenancyActive && totalBalance <= 0) {
                                statusBadge = <Badge variant="secondary">Completed</Badge>;
                            } else if (isTenancyActive && totalBalance <= 0) {
                                statusBadge = <Badge variant="secondary">Paid Up</Badge>;
                            } else {
                                statusBadge = <Badge variant="outline">N/A</Badge>;
                            }

                            return (
                                <TableRow key={tenancy.tenancyId}>
                                  <TableCell>
                                    <Link href={`/revenue/${tenancy.tenancyId}`} className="font-medium text-primary underline">
                                        {tenancy.tenant}
                                    </Link>
                                    <div className="text-sm text-muted-foreground">{tenancy.propertyName}</div>
                                  </TableCell>
                                  <TableCell>{formattedDates[`${tenancy.tenancyId}-start`]} - {formattedDates[`${tenancy.tenancyId}-end`]}</TableCell>
                                  <TableCell>
                                     {statusBadge}
                                  </TableCell>
                                  <TableCell className="text-right">{formatCurrency(totalDue)}</TableCell>
                                  <TableCell className="text-right">{formatCurrency(totalPaid)}</TableCell>
                                  <TableCell className={cn("text-right", totalBalance > 0 && 'text-destructive')}>
                                    {formatCurrency(totalBalance)}
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button aria-haspopup="true" size="icon" variant="ghost">
                                          <MoreHorizontal className="h-4 w-4" />
                                          <span className="sr-only">Toggle menu</span>
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Tenancy Actions</DropdownMenuLabel>
                                        <DropdownMenuItem asChild>
                                          <Link href={`/revenue/${tenancy.tenancyId}`}>View Details</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild>
                                            <Link href={`/revenue/edit/${tenancy.tenancyId}`}>Edit Tenancy</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onSelect={() => handleDeleteTenancy(tenancy)}>Delete Tenancy</DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </TableCell>
                                </TableRow>
                            );
                        })}
                </TableBody>
              </Table>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Users className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold">No Tenancies Found</h3>
                    <p className="text-muted-foreground mb-4">Track revenue by creating your first tenancy.</p>
                    <Button asChild>
                        <Link href="/revenue/add">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Tenancy
                        </Link>
                    </Button>
                </div>
            )}
        </CardContent>
      </Card>
      
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        itemName={`tenancy for ${selectedTransaction?.tenant} at ${selectedTransaction?.propertyName}`}
      />
    </>
  );
});

export default RevenueClient;
