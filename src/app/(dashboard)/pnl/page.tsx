
'use client';

import { useState, useEffect } from 'react';
import { format, subDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { useDataContext } from '@/context/data-context';
import type { Transaction } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Calendar as CalendarIcon, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';


export default function PnlPage() {
  const { revenue, expenses, formatCurrency, locale } = useDataContext();
  const [date, setDate] = useState<DateRange | undefined>({
    from: subDays(new Date(), 29),
    to: new Date(),
  });
  
  const [filteredRevenue, setFilteredRevenue] = useState<Transaction[]>([]);
  const [filteredExpenses, setFilteredExpenses] = useState<Transaction[]>([]);

  useEffect(() => {
    if (date?.from && date?.to) {
      const fromDate = date.from;
      const toDate = date.to;

      setFilteredRevenue(
        revenue.filter(t => {
          const tDate = new Date(t.date);
          const isWithinRange = tDate >= fromDate && tDate <= toDate;
          const hasBeenPaid = (t.amountPaid ?? 0) > 0;
          return isWithinRange && hasBeenPaid;
        })
      );
      setFilteredExpenses(
        expenses.filter(e => {
          const eDate = new Date(e.date);
          return eDate >= fromDate && eDate <= toDate;
        })
      );
    }
  }, [date, revenue, expenses]);

  const totalRevenue = filteredRevenue.reduce((sum, item) => sum + (item.amountPaid ?? 0), 0);
  const totalExpenses = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
  const netProfit = totalRevenue - totalExpenses;
  
  const expenseCategories = filteredExpenses.reduce((acc, expense) => {
    const category = expense.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += expense.amount;
    return acc;
  }, {} as Record<string, number>);


  return (
    <>
      <PageHeader title="Profit & Loss Statement">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-[300px] justify-start text-left font-normal",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {date?.from ? (
                date.to ? (
                  <>
                    {format(date.from, "LLL dd, y")} -{" "}
                    {format(date.to, "LLL dd, y")}
                  </>
                ) : (
                  format(date.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={date?.from}
              selected={date}
              onSelect={setDate}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </PageHeader>
      
      <div className="space-y-6">
        <Card>
          <CardHeader>
              <CardTitle>Financial Summary</CardTitle>
              <CardDescription>
                Summary for the period {date?.from ? format(date.from, "LLL dd, y") : ''} to {date?.to ? format(date.to, "LLL dd, y") : ''}
              </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <KpiCard
                icon={TrendingUp}
                title="Total Revenue"
                value={formatCurrency(totalRevenue)}
                description="Sum of all income received"
              />
              <KpiCard
                icon={TrendingDown}
                title="Total Expenses"
                value={formatCurrency(totalExpenses)}
                description="Sum of all costs incurred"
              />
              <KpiCard
                icon={DollarSign}
                title="Net Profit / Loss"
                value={formatCurrency(netProfit)}
                description="Revenue minus Expenses"
              />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {filteredRevenue.length > 0 ? filteredRevenue.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{format(new Date(item.date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>{item.tenant}</TableCell>
                      <TableCell>{item.propertyName}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.amountPaid ?? 0)}</TableCell>
                    </TableRow>
                   )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">No revenue in this period.</TableCell>
                    </TableRow>
                   )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Expense Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Total Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                    {Object.keys(expenseCategories).length > 0 ? Object.entries(expenseCategories).map(([category, amount]) => (
                        <TableRow key={category}>
                            <TableCell className="font-medium">{category}</TableCell>
                            <TableCell className="text-right">{formatCurrency(amount)}</TableCell>
                        </TableRow>
                    )) : (
                       <TableRow>
                        <TableCell colSpan={2} className="text-center text-muted-foreground">No expenses in this period.</TableCell>
                      </TableRow>
                    )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
