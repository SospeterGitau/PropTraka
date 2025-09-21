'use client';

import { useState, useEffect } from 'react';
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

export default function ArrearsClient() {
  const { revenue, formatCurrency, locale } = useDataContext();
  const [arrears, setArrears] = useState<ArrearEntry[]>([]);
  const [formattedDates, setFormattedDates] = useState<{[key: string]: string}>({});

  useEffect(() => {
    if (!revenue) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

    const calculatedArrears = revenue
      .filter(transaction => {
        const amountDue = transaction.amount + (transaction.deposit ?? 0);
        const amountPaid = transaction.amountPaid ?? 0;
        const dueDate = new Date(transaction.date);
        return amountPaid < amountDue && dueDate < today;
      })
      .map(transaction => {
        const rentDue = transaction.amount;
        const depositDue = transaction.deposit ?? 0;
        const amountPaid = transaction.amountPaid ?? 0;
        const dueDate = new Date(transaction.date);

        // Logic to determine how the paid amount is allocated
        const paidTowardsDeposit = Math.min(amountPaid, depositDue);
        const remainingPaid = amountPaid - paidTowardsDeposit;
        const paidTowardsRent = Math.min(remainingPaid, rentDue);
        
        const depositOwed = depositDue - paidTowardsDeposit;
        const rentOwed = rentDue - paidTowardsRent;
        const amountOwed = depositOwed + rentOwed;
        
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
    
    setArrears(calculatedArrears.filter(a => a.amountOwed > 0));
  }, [revenue]);
  
  useEffect(() => {
    const formatAllDates = async () => {
      const localeData = await getLocale(locale);
      const newFormattedDates: {[key: string]: string} = {};
      for (const arrear of arrears) {
        newFormattedDates[arrear.dueDate] = format(new Date(arrear.dueDate), 'MMMM dd, yyyy', { locale: localeData });
      }
      setFormattedDates(newFormattedDates);
    };
    
    if (arrears.length > 0) {
      formatAllDates();
    }
  }, [arrears, locale]);


  return (
    <>
      <PageHeader title="Arrears" />
      <Card>
        <CardHeader>
          <CardTitle>Tenants in Arrears</CardTitle>
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
                  arrears.map((arrear, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{arrear.tenant}</TableCell>
                      <TableCell>{arrear.propertyAddress}</TableCell>
                      <TableCell>
                        <Badge variant="destructive">{formattedDates[arrear.dueDate]}</Badge>
                      </TableCell>
                      <TableCell>{arrear.daysOverdue} days</TableCell>
                      <TableCell>
                        {arrear.rentOwed > 0 && arrear.depositOwed > 0 ? (
                          <Badge variant="outline">Rent & Deposit</Badge>
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
                          <Link href={`mailto:${arrear.tenantEmail}?subject=Rent Arrears Reminder&body=Dear ${arrear.tenant},%0D%0A%0D%0AThis is a reminder that your payment of ${formatCurrency(arrear.amountOwed)} for the property at ${arrear.propertyAddress} is overdue since ${formattedDates[arrear.dueDate]}.%0D%0A%0D%0APlease make the payment as soon as possible.%0D%0A%0D%0AThank you,%0D%0A[Your Name/Company Name]`}>
                            Send Reminder
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
        </CardContent>
      </Card>
    </>
  );
}
