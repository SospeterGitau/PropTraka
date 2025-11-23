
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
  const { currency, locale, companyName } = settings;
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
        
        // Filter to only include transactions that are due on or before today
        const dueTransactions = tenancy.transactions.filter(tx => !isBefore(today, new Date(tx.date)));
  
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
  
        // Detailed breakdown
        const totalRentDue = dueTransactions.reduce((sum, tx) => sum + tx.rent, 0);
        const totalDepositDue = dueTransactions.reduce((sum, tx) => sum + (tx.deposit || 0), 0);
        const totalServiceChargesDue = dueTransactions.reduce((sum, tx) => sum + (tx.serviceCharges || []).reduce((scSum, sc) => scSum + sc.amount, 0), 0);
        
        const paidTowardsDeposit = Math.min(totalPaid, totalDepositDue);
        const remainingAfterDeposit = totalPaid - paidTowardsDeposit;

        const paidTowardsRent = Math.min(remainingAfterDeposit, totalRentDue);
        const remainingAfterRent = remainingAfterDeposit - paidTowardsRent;

        const depositOwed = totalDepositDue - paidTowardsDeposit;
        const rentOwed = totalRentDue - paidTowardsRent;
        const serviceChargesOwed = totalServiceChargesDue - remainingAfterRent;
        
        let breakdown = `- Rent: ${formatCurrency(rentOwed, locale, currency)}`;
        if (depositOwed > 0) {
            breakdown += `\n- Deposit: ${formatCurrency(depositOwed, locale, currency)}`;
        }
        if (serviceChargesOwed > 0) {
           breakdown += `\n- Service Charges: ${formatCurrency(serviceChargesOwed, locale, currency)}`;
        }


        return {
          tenant: tenancy.tenant!,
          tenantEmail: tenancy.tenantEmail!,
          tenantPhone: tenancy.tenantPhone || 'N/A',
          propertyAddress: tenancy.propertyName,
          amountOwed,
          dueDate: format(dueDate, 'yyyy-MM-dd'),
          rentOwed,
          depositOwed,
          serviceChargesOwed, 
          daysOverdue,
          breakdown,
        };
      })
      .filter((a): a is NonNullable<ArrearEntry> => a !== null);
    
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
                  <TableHead>Tenant</TableHead>
                  <TableHead>Property</TableHead>
                  <TableHead>First Due Date</TableHead>
                  <TableHead>Days Overdue</TableHead>
                  <TableHead>Owed For</TableHead>
                  <TableHead className="text-right">Amount Owed</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {arrears.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                      No tenants are currently in arrears.
                    </TableCell>
                  </TableRow>
                ) : (
                  arrears.map((arrear, index) => {
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{arrear.tenant}</TableCell>
                        <TableCell>{arrear.propertyAddress}</TableCell>
                        <TableCell>
                          <Badge variant="destructive">{formattedDates[arrear.dueDate]}</Badge>
                        </TableCell>
                        <TableCell>{arrear.daysOverdue} days</TableCell>
                        <TableCell>
                            <div className="flex flex-col items-start text-sm">
                                {arrear.rentOwed > 0 && <span>Rent</span>}
                                {arrear.serviceChargesOwed > 0 && <span>Service Charges</span>}
                                {arrear.depositOwed > 0 && <span>Deposit</span>}
                            </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-destructive">
                          {formatCurrency(arrear.amountOwed, locale, currency)}
                        </TableCell>
                        <TableCell className="text-center">
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                               <Button size="sm" variant="outline" onClick={() => handleRequestPayment(arrear)}>
                                    <CreditCard className="mr-2 h-4 w-4"/>
                                    Request Payment
                               </Button>
                               <Button size="sm" onClick={() => handleSendReminder(arrear)}>
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
