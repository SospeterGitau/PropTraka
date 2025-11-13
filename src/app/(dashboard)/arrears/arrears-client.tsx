
'use client';

import { useState, useEffect, memo, useMemo } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getLocale } from '@/lib/locales';
import { Skeleton } from '@/components/ui/skeleton';
import { PaymentRequestDialog } from '@/components/payment-request-dialog';
import type { ArrearEntry, Transaction } from '@/lib/types';
import { CreditCard } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, DocumentData, Query } from 'firebase/firestore';


const ArrearsClient = memo(function ArrearsClient() {
  const { user } = useUser();
  const firestore = useFirestore();

  const revenueQuery = useMemo(() => user?.uid ? query(collection(firestore, 'revenue'), where('ownerId', '==', user.uid)) : null, [firestore, user?.uid]);
  const [revenueSnapshot, isDataLoading, error] = useCollection(revenueQuery as Query<Transaction> | null);


  const [arrears, setArrears] = useState<ArrearEntry[]>([]);
  const [formattedDates, setFormattedDates] = useState<{[key: string]: string}>({});
  const [isPaymentRequestOpen, setIsPaymentRequestOpen] = useState(false);
  const [selectedArrear, setSelectedArrear] = useState<ArrearEntry | null>(null);

  const locale = 'en-GB';
  const currency = 'KES';
  const companyName = 'LeaseLync';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  useEffect(() => {
    if (!revenueSnapshot) return;
    const today = startOfToday();

    const revenue = revenueSnapshot.docs.map(doc => doc.data() as Transaction);

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
        const dueTransactions = tenancy.transactions.filter(tx => !isBefore(today, new Date(tx.date)));
        if (dueTransactions.length === 0) return null;

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

        // This simplified breakdown isn't perfect but gives a general idea.
        const totalDepositDue = tenancy.transactions.reduce((sum, tx) => sum + (tx.deposit || 0), 0);
        const totalRentAndChargesDue = totalDueToDate - totalDepositDue;

        const paidTowardsDeposit = Math.min(totalPaid, totalDepositDue);
        const remainingAfterDeposit = totalPaid - paidTowardsDeposit;
        
        const depositOwed = totalDepositDue - paidTowardsDeposit;
        const rentAndChargesOwed = totalRentAndChargesDue - remainingAfterDeposit;

        return {
          tenant: tenancy.tenant!,
          tenantEmail: tenancy.tenantEmail!,
          tenantPhone: tenancy.tenantPhone,
          propertyAddress: tenancy.propertyName,
          amountOwed,
          dueDate: format(dueDate, 'yyyy-MM-dd'),
          rentOwed: rentAndChargesOwed > 0 ? rentAndChargesOwed : 0,
          depositOwed: depositOwed > 0 ? depositOwed : 0,
          serviceChargesOwed: 0, 
          daysOverdue,
        };
      })
      .filter((a): a is ArrearEntry => a !== null);
    
    setArrears(calculatedArrears.sort((a,b) => b.daysOverdue - a.daysOverdue));
  }, [revenueSnapshot]);
  
  useEffect(() => {
    const formatAllDates = async () => {
      const localeData = await getLocale(locale);
      const newFormattedDates: {[key: string]: string} = {};
      for (const arrear of arrears) {
        if (arrear.dueDate && !newFormattedDates[arrear.dueDate]) {
          newFormattedDates[arrear.dueDate] = format(new Date(arrear.dueDate), 'MMMM dd, yyyy', { locale: localeData });
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
          <CardTitle>Arrears List</CardTitle>
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
                    const subject = `Overdue Rent Reminder`;
                    const body = [
                      `Dear ${arrear.tenant},`,
                      `This is a friendly reminder regarding the outstanding balance for your tenancy at ${arrear.propertyAddress}.`,
                      `Our records show that a payment of ${formatCurrency(arrear.amountOwed)} is outstanding and overdue.`,
                      `Could you please arrange to make this payment at your earliest convenience? If you have already made the payment, please disregard this notice.`,
                      `If you have any questions or wish to discuss this, please do not hesitate to reply to this email.`,
                      `Thank you for your prompt attention to this matter.`,
                      `Best regards,`,
                      `${companyName}`
                    ].join('%0D%0A%0D%0A'); // %0D%0A is a URL-encoded double line break

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
                                {arrear.rentOwed > 0 && <span>Rent/Service Charges</span>}
                                {arrear.depositOwed > 0 && <span>Deposit</span>}
                            </div>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-destructive">
                          {formatCurrency(arrear.amountOwed)}
                        </TableCell>
                        <TableCell className="text-center space-x-2">
                           <Button size="sm" variant="outline" onClick={() => handleRequestPayment(arrear)}>
                                <CreditCard className="mr-2 h-4 w-4"/>
                                Request Payment
                           </Button>
                           <Button size="sm" asChild>
                            <Link href={`mailto:${arrear.tenantEmail}?subject=${encodeURIComponent(subject)}&body=${body}`}>
                              Send Reminder
                            </Link>
                          </Button>
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
        formatCurrency={formatCurrency}
      />
    </>
  );
});

export default ArrearsClient;
