
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ArrearEntry {
  tenant: string;
  propertyAddress: string;
  amountOwed: number;
  dueDate: string;
  rentOwed: number;
  depositOwed: number;
}

export default function ArrearsPage() {
  const { revenue, formatCurrency } = useDataContext();
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
      .map(transaction => {
        const rentDue = transaction.amount;
        const depositDue = transaction.deposit ?? 0;
        const amountPaid = transaction.amountPaid ?? 0;

        // Logic to determine how the paid amount is allocated
        const paidTowardsDeposit = Math.min(amountPaid, depositDue);
        const remainingPaid = amountPaid - paidTowardsDeposit;
        const paidTowardsRent = Math.min(remainingPaid, rentDue);
        
        const depositOwed = depositDue - paidTowardsDeposit;
        const rentOwed = rentDue - paidTowardsRent;
        const amountOwed = depositOwed + rentOwed;

        return {
          tenant: transaction.tenant!,
          propertyAddress: transaction.propertyName,
          amountOwed,
          dueDate: transaction.date,
          rentOwed,
          depositOwed,
        };
      });
    
    setArrears(calculatedArrears.filter(a => a.amountOwed > 0));
  }, [revenue]);

  const formatDate = (dateString: string) => format(new Date(dateString), 'MMMM dd, yyyy');

  return (
    <>
      <PageHeader title="Arrears" />
      <Card>
        <CardHeader>
          <CardTitle>Tenants in Arrears</CardTitle>
        </CardHeader>
        <CardContent>
          <TooltipProvider>
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
                      <TableCell className="text-right font-semibold text-destructive">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span>{formatCurrency(arrear.amountOwed)}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-sm">
                              {arrear.rentOwed > 0 && <div>Rent: {formatCurrency(arrear.rentOwed)}</div>}
                              {arrear.depositOwed > 0 && <div>Deposit: {formatCurrency(arrear.depositOwed)}</div>}
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button size="sm">Send Reminder</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TooltipProvider>
        </CardContent>
      </Card>
    </>
  );
}
