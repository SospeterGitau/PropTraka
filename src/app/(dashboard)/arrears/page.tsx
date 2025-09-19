'use client';

import { useState, useEffect } from 'react';
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

interface ArrearEntry {
  tenant: string;
  propertyAddress: string;
  amountOwed: number;
  dueDate: string;
}

export default function ArrearsPage() {
  const { revenue } = useDataContext();
  const [arrears, setArrears] = useState<ArrearEntry[]>([]);

  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison

    const calculatedArrears = revenue
      .filter(transaction => {
        const amountDue = transaction.amount + (transaction.deposit ?? 0);
        const amountPaid = transaction.amountPaid ?? 0;
        const dueDate = new Date(transaction.date);
        return amountPaid < amountDue && dueDate < today;
      })
      .map(transaction => ({
        tenant: transaction.tenant!,
        propertyAddress: transaction.propertyName,
        amountOwed: (transaction.amount + (transaction.deposit ?? 0)) - (transaction.amountPaid ?? 0),
        dueDate: transaction.date,
      }));
    
    setArrears(calculatedArrears);
  }, [revenue]);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const formatDate = (dateString: string) => format(new Date(dateString), 'MMMM dd, yyyy');

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
                <TableHead className="text-right">Amount Owed</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {arrears.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No tenants are currently in arrears.
                  </TableCell>
                </TableRow>
              ) : (
                arrears.map((arrear, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{arrear.tenant}</TableCell>
                    <TableCell>{arrear.propertyAddress}</TableCell>
                    <TableCell>
                      <Badge variant="destructive">{formatDate(arrear.dueDate)}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-destructive">{formatCurrency(arrear.amountOwed)}</TableCell>
                    <TableCell className="text-center">
                      <Button size="sm">Send Reminder</Button>
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
