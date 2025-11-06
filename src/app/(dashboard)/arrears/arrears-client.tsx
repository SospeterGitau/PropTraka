
'use client';

import { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { useDataContext } from '@/context/data-context';
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

interface ArrearEntry {
  tenant: string;
  tenantEmail: string;
  propertyAddress: string;
  amountOwed: number;
  dueDate: string;
  rentOwed: number;
  depositOwed: number;
  daysOverdue: number;
}

function ArrearsClient() {
  const { revenue, formatCurrency, locale, companyName, isDataLoading } = useDataContext();
  const [arrears, setArrears] = useState<ArrearEntry[]>([]);
  const [formattedDates, setFormattedDates] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (!revenue) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

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

        // This logic correctly allocates payment first to deposit, then to rent.
        const paidTowardsDeposit = Math.min(amountPaid, depositDue);
        const remainingPaidAfterDeposit = amountPaid - paidTowardsDeposit;
        const paidTowardsRent = Math.min(remainingPaidAfterDeposit, rentDue);
        
        const depositOwed = depositDue - paidTowardsDeposit;
        const rentOwed = rentDue - paidTowardsRent;
        const amountOwed = depositOwed + rentOwed + serviceChargesTotal;
        
        const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 3600 * 24));

        return {
          tenant: transaction.tenant!,
          tenantEmail: transaction.tenantEmail!,
          propertyAddress: transaction.propertyName,
          amountOwed,
          dueDate: transaction.date,
          rentOwed,
          depositOwed,
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
                          {arrear.rentOwed > 0 && arrear.depositOwed > 0 ? (
                            <div className="flex flex-col items-start">
                              <Badge variant="outline">Rent</Badge>
                              <Badge variant="outline" className="mt-1">Deposit</Badge>
                            </div>
                          ) : arrear.rentOwed > 0 ? (
                            <Badge variant="outline">Rent</Badge>
                          ) : (
                            <Badge variant="outline">Deposit</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-destructive">
                          {formatCurrency(arrear.amountOwed)}
                        </TableCell>
                        <TableCell className="text-center">
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
    </>
  );
}

export default memo(ArrearsClient);
