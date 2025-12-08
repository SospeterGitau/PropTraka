
'use client';

import { useState, useEffect, memo, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { format, startOfToday, isBefore, differenceInCalendarDays } from 'date-fns';
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
import { Badge } from '@/components/ui/badge';
import { getLocale } from '@/lib/locales';
import { Skeleton } from '@/components/ui/skeleton';
import { PaymentRequestDialog } from '@/components/payment-request-dialog';
import type { ArrearEntry, Transaction, GenerateReminderEmailInput } from '@/lib/types';
import { CreditCard, Mail } from 'lucide-react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useUser, useFirestore } from '@/firebase';
import { createUserQuery } from '@/firebase/firestore/query-builder';
import type { Query } from 'firebase/firestore';
import { useDataContext } from '@/context/data-context';
import { formatCurrency } from '@/lib/utils';
import { ReminderEmailDialog } from '@/components/reminder-email-dialog';
import { generateReminderEmail } from '@/lib/actions';


const ArrearsClient = memo(function ArrearsClient() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { settings } = useDataContext();
  const currency = settings?.currency || 'KES';
  const locale = settings?.locale || 'en-KE';
  const companyName = settings?.companyName || '';
  const [isReminderGenerating, startReminderTransition] = useTransition();

  const revenueQuery = useMemo(() => 
    user?.uid ? createUserQuery(firestore, 'revenue', user.uid) : null
  , [firestore, user?.uid]);
  
  const [revenueSnapshot, isDataLoading, error] = useCollection(revenueQuery as Query<Transaction> | null);
  const revenue = useMemo(() => revenueSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction)) || [], [revenueSnapshot]);

  const arrears = useMemo(() => {
    if (!revenue) return [];
    
    const today = startOfToday();
  
    const tenancies = Object.values(
      revenue.reduce((acc, tx) => {
        if (!tx.tenancyId) return acc;
        if (!acc[tx.tenancyId]) {
          acc[tx.tenancyId] = {
            ...tx,
            transactions: [],
          };
        }
        acc[tx.tenancyId].transactions.push(tx);
        return acc;
      }, {} as Record<string, Transaction & { transactions: Transaction[] }>)
    );
  
    const calculatedArrears = tenancies
      .map(tenancy => {
        
        const dueTransactions = tenancy.transactions
          .filter(tx => !isBefore(today, new Date(tx.date)))
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

        const totalDueToDate = dueTransactions.reduce((sum, tx) => {
          const serviceChargesTotal = (tx.serviceCharges || []).reduce((scSum, sc) => scSum + sc.amount, 0);
          return sum + tx.rent + serviceChargesTotal + (tx.deposit || 0);
        }, 0);
        
        const totalPaid = tenancy.transactions.reduce((sum, tx) => sum + (tx.amountPaid || 0), 0);
        const amountOwed = totalDueToDate - totalPaid;
  
        if (amountOwed <= 0) return null;
  
        const firstUnpaidTx = tenancy.transactions
          .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .find(tx => {
            const txDue = tx.rent + (tx.serviceCharges || []).reduce((scSum, sc) => scSum + sc.amount, 0) + (tx.deposit || 0);
            return (tx.amountPaid || 0) < txDue && isBefore(new Date(tx.date), today);
          });
          
        const dueDate = firstUnpaidTx ? new Date(firstUnpaidTx.date) : new Date(tenancy.transactions[0].date);
        const daysOverdue = differenceInCalendarDays(today, dueDate);
  
        // Detailed breakdown with periods
        let breakdown = '';
        let paidTracker = totalPaid;

        for (const tx of dueTransactions) {
            const periodDue = tx.rent + (tx.serviceCharges || []).reduce((sc, charge) => sc + charge.amount, 0) + (tx.deposit || 0);
            const paidForPeriod = Math.min(paidTracker, periodDue);
            const balanceForPeriod = periodDue - paidForPeriod;
            paidTracker -= paidForPeriod;

            if (balanceForPeriod > 0.01) { // Use a small epsilon for float comparison
                breakdown += `\nFor the period of ${format(new Date(tx.date), 'MMMM yyyy')}:\n`;
                
                const rentDue = tx.rent;
                const paidTowardsRent = Math.min(paidTracker, rentDue);
                const rentOwed = rentDue - paidTowardsRent;
                if (rentOwed > 0) breakdown += `- Rent: ${formatCurrency(rentOwed, locale, currency)}\n`;
                
                (tx.serviceCharges || []).forEach(sc => {
                  const paidTowardsSc = Math.min(paidTracker, sc.amount);
                  const scOwed = sc.amount - paidTowardsSc;
                  if (scOwed > 0) breakdown += `- ${sc.name}: ${formatCurrency(scOwed, locale, currency)}\n`;
                });
            }
        }
        breakdown = breakdown.trim();


        return {
          tenant: tenancy.tenant!,
          tenantEmail: tenancy.tenantEmail!,
          tenantPhone: tenancy.tenantPhone || 'N/A',
          propertyAddress: tenancy.propertyName,
          amountOwed,
          dueDate: format(dueDate, 'yyyy-MM-dd'),
          daysOverdue,
          breakdown,
        };
      })
      .filter((a): a is NonNullable<ArrearEntry> => a !== null && a.amountOwed > 0.01);
    
    return calculatedArrears.sort((a,b) => b.daysOverdue - a.daysOverdue);
  }, [revenue, currency, locale]);
  
  const [formattedDates, setFormattedDates] = useState<{[key: string]: string}>({});
  const [isPaymentRequestOpen, setIsPaymentRequestOpen] = useState(false);
  const [isReminderDialogOpen, setIsReminderDialogOpen] = useState(false);
  const [selectedArrear, setSelectedArrear] = useState<ArrearEntry | null>(null);
  const [generatedReminder, setGeneratedReminder] = useState<{ subject: string, body: string} | null>(null);

  useEffect(() => {
    const formatAllDates = async () => {
      const localeData = await getLocale(locale);
      const newFormattedDates: {[key: string]: string} = {};
      for (const arrear of arrears) {
        if (arrear.dueDate && !newFormattedDates[arrear.dueDate]) {
          newFormattedDates[arrear.dueDate] = format(new Date(arrear.dueDate), 'PP', { locale: localeData });
        }
      }
      setFormattedDates(newFormattedDates);
    };
    
    if (arrears.length > 0) {
      formatAllDates();
    }
  }, [arrears, locale]);
  
  const handleRequestPayment = (arrear: ArrearEntry) => {
    setSelectedArrear(arrear);
    setIsPaymentRequestOpen(true);
  };
  
  const handleSendReminder = (arrear: ArrearEntry) => {
    setSelectedArrear(arrear);
    setGeneratedReminder(null);
    setIsReminderDialogOpen(true);

    startReminderTransition(async () => {
      const input: GenerateReminderEmailInput = {
        tenantName: arrear.tenant,
        propertyAddress: arrear.propertyAddress,
        amountOwed: formatCurrency(arrear.amountOwed, locale, currency),
        daysOverdue: arrear.daysOverdue,
        companyName: companyName || "The Landlord",
        arrearsBreakdown: arrear.breakdown,
      }
      const result = await generateReminderEmail(input);
      setGeneratedReminder(result);
    });
  };

  const handlePaymentRequestSubmit = (details: { amount: number, method: string }) => {
    console.log("Requesting payment:", {
        ...details,
        tenant: selectedArrear?.tenant,
    });
    // Here you would later integrate with Pesapal/InstaSend API
    setIsPaymentRequestOpen(false);
  };


   if (isDataLoading) {
    return (
       <>
        <PageHeader title="Arrears" />
        <Card>
          <CardHeader>
            <CardTitle><Skeleton className="h-6 w-1/2" /></CardTitle>
          </CardHeader>
          <CardContent>
             <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </>
    )
  }


  return (
    <>
      <PageHeader title="Arrears" />
      <Card>
        <CardHeader>
          <CardTitle>Outstanding Payments</CardTitle>
          <CardDescription>A list of all tenants with overdue payments.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[150px]">Tenant</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead className="hidden sm:table-cell">First Due Date</TableHead>
                  <TableHead className="hidden sm:table-cell">Days Overdue</TableHead>
                  <TableHead className="text-right">Amount Owed</TableHead>
                  <TableHead className="text-center w-[180px]">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {arrears.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No tenants are currently in arrears.
                    </TableCell>
                  </TableRow>
                ) : (
                  arrears.map((arrear, index) => {
                    return (
                      <TableRow key={index} className="[&>td]:last-child:text-center">
                        <TableCell>
                          <div className="font-medium">{arrear.tenant}</div>
                          <div className="text-sm text-muted-foreground sm:hidden">
                            {arrear.daysOverdue} days overdue
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{arrear.propertyAddress}</span>
                            <div className="sm:hidden text-sm text-muted-foreground">
                              Due: <Badge variant="destructive" className="ml-1">{formattedDates[arrear.dueDate]}</Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <Badge variant="destructive">{formattedDates[arrear.dueDate]}</Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">{arrear.daysOverdue} days</TableCell>
                        <TableCell className="text-right font-semibold text-destructive">
                          {formatCurrency(arrear.amountOwed, locale, currency)}
                        </TableCell>
                        <TableCell>
                            <div className="flex flex-col items-center justify-center gap-2">
                               <Button size="sm" variant="outline" onClick={() => handleRequestPayment(arrear)} className="w-full">
                                    <CreditCard className="mr-2 h-4 w-4"/>
                                    Request Payment
                               </Button>
                               <Button size="sm" onClick={() => handleSendReminder(arrear)} className="w-full">
                                  <Mail className="mr-2 h-4 w-4" />
                                  Send Reminder
                                </Button>
                            </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
        </CardContent>
      </Card>
      
      <PaymentRequestDialog
        isOpen={isPaymentRequestOpen}
        onClose={() => setIsPaymentRequestOpen(false)}
        onSubmit={handlePaymentRequestSubmit}
        arrear={selectedArrear}
        formatCurrency={(amount) => formatCurrency(amount, locale, currency)}
      />

      <ReminderEmailDialog
        isOpen={isReminderDialogOpen}
        onClose={() => setIsReminderDialogOpen(false)}
        isLoading={isReminderGenerating}
        reminder={generatedReminder}
        tenantEmail={selectedArrear?.tenantEmail}
      />
    </>
  );
});

export default ArrearsClient;
