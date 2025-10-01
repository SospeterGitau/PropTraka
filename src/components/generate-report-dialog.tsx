
'use client';

import { useState, useTransition } from 'react';
import { FileText, Loader2, Calendar as CalendarIcon, AlertTriangle } from 'lucide-react';
import { format, sub, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { DateRange } from 'react-day-picker';
import type { Transaction } from '@/lib/types';
import { getPnlReport } from '@/lib/actions';
import { useDataContext } from '@/context/data-context';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface GenerateReportDialogProps {
  revenue: Transaction[];
  expenses: Transaction[];
}

export function GenerateReportDialog({ revenue, expenses }: GenerateReportDialogProps) {
  const { currency, companyName } = useDataContext();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [report, setReport] = useState<string | null>(null);
  const [error, setError] = useState<{ code: string; hint: string } | null>(null);
  const [date, setDate] = useState<DateRange | undefined>({
    from: sub(new Date(), {days: 29}),
    to: new Date(),
  });

  const handleGenerateReport = () => {
    if (!date || !date.from || !date.to) return;

    startTransition(async () => {
      setReport(null);
      setError(null);
      
      const startDate = format(date.from!, 'yyyy-MM-dd');
      const endDate = format(date.to!, 'yyyy-MM-dd');

      const filteredRevenue = revenue.filter(t => {
        const tDate = new Date(t.date);
        return tDate >= date.from! && tDate <= date.to!;
      });
      const filteredExpenses = expenses.filter(e => {
        const eDate = new Date(e.date);
        return eDate >= date.from! && eDate <= date.to!;
      });

      const result = await getPnlReport({
        startDate,
        endDate,
        revenueTransactions: JSON.stringify(filteredRevenue),
        expenseTransactions: JSON.stringify(filteredExpenses),
        currency: currency,
        companyName: companyName,
      });

      if (result.error) {
        setError({ code: result.error, hint: result.hint || 'An unexpected error occurred.' });
      } else {
        setReport(result.report);
      }
    });
  };
  
  const handleCopyToClipboard = () => {
    if (report) {
      navigator.clipboard.writeText(report);
      // You could add a toast notification here for feedback
    }
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setReport(null); // Reset report when closing
      setError(null);
    }
  };

  const handleGenerateNew = () => {
    setReport(null);
    setError(null);
  };
  
  const handlePresetChange = (value: string) => {
    const now = new Date();
    const currentYear = now.getFullYear();
    switch (value) {
      case 'last-7-days':
        setDate({ from: sub(now, { days: 6 }), to: now });
        break;
      case 'this-month':
        setDate({ from: startOfMonth(now), to: endOfMonth(now) });
        break;
      case 'last-month':
        const lastMonth = sub(now, { months: 1 });
        setDate({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
        break;
      case 'this-year':
        setDate({ from: startOfYear(now), to: endOfYear(now) });
        break;
      case 'last-year':
        const lastYear = sub(now, { years: 1 });
        setDate({ from: startOfYear(lastYear), to: endOfYear(lastYear) });
        break;
      case 'q1':
        setDate({ from: new Date(currentYear, 0, 1), to: new Date(currentYear, 2, 31) });
        break;
      case 'q2':
        setDate({ from: new Date(currentYear, 3, 1), to: new Date(currentYear, 5, 30) });
        break;
      case 'q3':
        setDate({ from: new Date(currentYear, 6, 1), to: new Date(currentYear, 8, 30) });
        break;
      case 'q4':
        setDate({ from: new Date(currentYear, 9, 1), to: new Date(currentYear, 11, 31) });
        break;
      default:
        break;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <Button onClick={() => setIsOpen(true)}>
        <FileText className="mr-2 h-4 w-4" />
        Generate Report
      </Button>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Generate P&L Report</DialogTitle>
          <DialogDescription>
            Select a date range to generate a comprehensive Profit & Loss statement.
          </DialogDescription>
        </DialogHeader>

        {report ? (
          <div className="prose prose-sm max-w-none h-[60vh] overflow-y-auto border rounded-md p-4 bg-muted/50 whitespace-pre-wrap font-sans text-sm">
            {report}
          </div>
        ) : (
          <div className="py-8 flex flex-col items-center justify-center min-h-[300px]">
            {isPending ? (
              <>
                <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Generating your report, please wait...</p>
              </>
            ) : error ? (
                <Alert variant="destructive" className="w-full">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error: {error.code}</AlertTitle>
                  <AlertDescription>
                    {error.hint}
                  </AlertDescription>
                </Alert>
            ) : (
              <div className="flex flex-col items-center gap-4">
                 <p className="text-sm font-medium">Select Date Range:</p>
                 <div className="flex gap-2 items-center">
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
                    <PopoverContent className="w-auto p-0" align="center">
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
                  <Select onValueChange={handlePresetChange}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Select a preset" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="last-7-days">Last 7 Days</SelectItem>
                      <SelectItem value="this-month">This Month</SelectItem>
                      <SelectItem value="last-month">Last Month</SelectItem>
                      <SelectItem value="this-year">This Year</SelectItem>
                      <SelectItem value="last-year">Last Year</SelectItem>
                      <SelectItem value="q1">Q1 {new Date().getFullYear()}</SelectItem>
                      <SelectItem value="q2">Q2 {new Date().getFullYear()}</SelectItem>
                      <SelectItem value="q3">Q3 {new Date().getFullYear()}</SelectItem>
                      <SelectItem value="q4">Q4 {new Date().getFullYear()}</SelectItem>
                    </SelectContent>
                  </Select>
                 </div>
              </div>
            )}
          </div>
        )}
        
        <DialogFooter>
          {report && (
             <Button variant="secondary" onClick={handleCopyToClipboard}>Copy to Clipboard</Button>
          )}
          {report || error ? (
            <Button onClick={handleGenerateNew}>
                <FileText className="mr-2 h-4 w-4" />
                Generate New Report
            </Button>
          ) : (
             <Button onClick={handleGenerateReport} disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Report
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
