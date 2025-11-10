

'use client';

import { useState, useEffect, memo, useMemo } from 'react';
import Link from 'next/link';
import { format, startOfToday } from 'date-fns';
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
import { useUser } from '@/firebase';
import { useFirestore } from '@/firebase/provider';
import { collection, query, where, onSnapshot, DocumentData } from 'firebase/firestore';


const ArrearsClient = memo(function ArrearsClient() {
  const { user } = useUser();
  const firestore = useFirestore();

  const [revenue, setRevenue] = useState<Transaction[] | null>(null);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const revenueQuery = useMemo(() => user?.uid ? query(collection(firestore, 'revenue'), where('ownerId', '==', user.uid)) : null, [firestore, user?.uid]);

  useEffect(() => {
    if (revenueQuery) {
      const unsubscribe = onSnapshot(revenueQuery, (snapshot) => {
        const revenueData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Transaction[];
        setRevenue(revenueData);
        setIsDataLoading(false);
      }, (error) => {
        console.error("Error fetching revenue data: ", error);
        setIsDataLoading(false);
      });
      return () => unsubscribe();
    } else {
      setIsDataLoading(false);
    }
  }, [revenueQuery]);


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
    if (!revenue) return;
    const today = startOfToday();

    const calculatedArrears = revenue
      .filter(transaction => {
        const serviceChargesTotal = (transaction.serviceCharges || []).reduce((sum, sc) => sum + sc.amount, 0);
        const amountDue = transaction.rent + serviceChargesTotal + (transaction.deposit ?? 0);
        const amountPaid = transaction.amountPaid ?? 0;
        const dueDate = new Date(transaction.date);
        return amountPaid < amountDue && dueDate < today;
      })
      .map(transaction => {
        const rentDue = transaction.rent;
        const serviceChargesTotal = (transaction.serviceCharges || []).reduce((sum, sc) => sum + sc.amount, 0);
        const depositDue = transaction.deposit ?? 0;
        const amountPaid = transaction.amountPaid ?? 0;
        const dueDate = new Date(transaction.date);

        const paidTowardsDeposit = Math.min(amountPaid, depositDue);
        const remainingPaidAfterDeposit = amountPaid - paidTowardsDeposit;
        const paidTowardsRentAndCharges = Math.min(remainingPaidAfterDeposit, rentDue + serviceChargesTotal);
        
        const depositOwed = depositDue - paidTowardsDeposit;
        const rentAndChargesOwed = (rentDue + serviceChargesTotal) - paidTowardsRentAndCharges;
        
        const amountOwed = depositOwed + rentAndChargesOwed;
        
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));

        return {
          tenant: transaction.tenant!,
          tenantEmail: transaction.tenantEmail!,
          tenantPhone: transaction.tenantPhone,
          propertyAddress: transaction.propertyName,
          amountOwed,
          dueDate: transaction.date,
          rentOwed: rentAndChargesOwed, 
          depositOwed,
          serviceChargesOwed: 0, // Simplified for this view, logic is now rent+charges
          daysOverdue,
        };
      });
    
    setArrears(calculatedArrears.filter(a => a.amountOwed > 0).sort((a,b) => b.daysOverdue - a.daysOverdue));
  }, [revenue]);
  
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
                  <TableHead>Due Date</TableHead>
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
                      `Our records show that a payment of ${formatCurrency(arrear.amountOwed)} was due on ${formattedDates[arrear.dueDate]} and is now overdue.`,
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
