
'use client';

import { useState, useEffect } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subMonths, addMonths, subYears, addYears, isSameMonth, isSameYear, eachMonthOfInterval, startOfYear, endOfYear } from 'date-fns';
import { useDataContext } from '@/context/data-context';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { TrendingUp, TrendingDown, DollarSign, ChevronLeft, ChevronRight } from 'lucide-react';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { ReportSummary } from '@/components/report-summary';
import { Skeleton } from '@/components/ui/skeleton';

type ViewMode = 'month' | 'year';

export default function ReportsPage() {
  const { revenue, formatCurrency } = useDataContext();
  const [viewMode, setViewMode] = useState<ViewMode>('year');
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);


  const handlePrev = () => {
    if (currentDate) {
      setCurrentDate(viewMode === 'month' ? subMonths(currentDate, 1) : subYears(currentDate, 1));
    }
  };

  const handleNext = () => {
     if (currentDate) {
      setCurrentDate(viewMode === 'month' ? addMonths(currentDate, 1) : addYears(currentDate, 1));
    }
  };
  
  const handleViewChange = (value: ViewMode | null) => {
    if (value) {
      setViewMode(value);
    }
  };

  if (!currentDate) {
    return (
       <>
        <PageHeader title="Revenue Reports" />
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
            <Skeleton className="h-[350px] w-full" />
          </CardContent>
        </Card>
      </>
    );
  }

  const filteredTransactions = revenue.filter(t => {
    const transactionDate = new Date(t.date);
    if (viewMode === 'month') {
      return isSameMonth(transactionDate, currentDate);
    } else {
      return isSameYear(transactionDate, currentDate);
    }
  });

  const projectedRevenue = filteredTransactions.reduce((acc, t) => acc + t.amount + (t.deposit ?? 0), 0);
  const actualRevenue = filteredTransactions.reduce((acc, t) => acc + (t.amountPaid ?? 0), 0);
  const totalArrears = projectedRevenue - actualRevenue;
  
  let chartData;
  const dateDisplayFormat = viewMode === 'month' ? 'MMMM yyyy' : 'yyyy';

  if (viewMode === 'year') {
    const yearStart = startOfYear(currentDate);
    const yearEnd = endOfYear(currentDate);
    const months = eachMonthOfInterval({ start: yearStart, end: yearEnd });
    
    chartData = months.map(month => {
      const monthlyTransactions = revenue.filter(t => isSameMonth(new Date(t.date), month));
      const projected = monthlyTransactions.reduce((acc, t) => acc + t.amount + (t.deposit ?? 0), 0);
      const actual = monthlyTransactions.reduce((acc, t) => acc + (t.amountPaid ?? 0), 0);
      return {
        name: format(month, 'MMM'),
        projected,
        actual,
      };
    });
  } else {
     chartData = [
      { name: format(currentDate, 'MMMM'), projected: projectedRevenue, actual: actualRevenue },
    ];
  }

  const reportSummaryData = {
    viewMode,
    period: format(currentDate, dateDisplayFormat),
    projectedRevenue,
    actualRevenue,
    totalArrears,
    chartData,
  };


  return (
    <>
      <PageHeader title="Revenue Reports" />
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Actual vs. Projected Revenue</CardTitle>
              <CardDescription>Analyze revenue performance and the impact of arrears.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
               <ToggleGroup type="single" value={viewMode} onValueChange={handleViewChange} defaultValue="year">
                <ToggleGroupItem value="month" aria-label="Toggle month">
                  Month
                </ToggleGroupItem>
                <ToggleGroupItem value="year" aria-label="Toggle year">
                  Year
                </ToggleGroupItem>
              </ToggleGroup>
              <Button variant="outline" size="icon" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold text-center w-32">{format(currentDate, dateDisplayFormat)}</span>
              <Button variant="outline" size="icon" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <KpiCard
              icon={TrendingUp}
              title="Projected Revenue"
              value={formatCurrency(projectedRevenue)}
              description={`Due in ${format(currentDate, dateDisplayFormat)}`}
            />
            <KpiCard
              icon={DollarSign}
              title="Actual Revenue"
              value={formatCurrency(actualRevenue)}
              description={`Paid in ${format(currentDate, dateDisplayFormat)}`}
            />
            <KpiCard
              icon={TrendingDown}
              title="Arrears (Unpaid)"
              value={formatCurrency(totalArrears)}
              description={`Outstanding for ${format(currentDate, dateDisplayFormat)}`}
            />
          </div>
           <ChartContainer config={{}} className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(value) => `$${Number(value) / 1000}k`} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltipContent />} cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }} />
                <Legend />
                <Bar dataKey="projected" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Projected" />
                <Bar dataKey="actual" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Actual" />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>
      <ReportSummary data={reportSummaryData} />
    </>
  );
}
