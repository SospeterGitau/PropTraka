
'use client';

import { useState, useEffect, memo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, Label } from 'recharts';
import { format, subMonths, addMonths, subYears, addYears, isSameMonth, isSameYear, eachMonthOfInterval, startOfYear, endOfYear } from 'date-fns';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { TrendingUp, TrendingDown, ChevronLeft, ChevronRight, CircleAlert } from 'lucide-react';
import { ChartContainer, ChartTooltipContent } from '@/components/ui/chart';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CurrencyIcon } from '@/components/currency-icon';
import { GenerateReportDialog } from '@/components/generate-report-dialog';
import { MarketResearchDialog } from '@/components/market-research-dialog';
import { cn } from '@/lib/utils';
import type { Property } from '@/lib/types';


type ViewMode = 'month' | 'year';

// Helper to get the start and end of the financial year for a given date
function getFinancialYear(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth(); // 0-11
  // Financial year runs from July to June
  const startYear = month >= 6 ? year : year - 1;
  const financialYearStart = new Date(startYear, 6, 1);
  const financialYearEnd = new Date(startYear + 1, 5, 30);
  return { financialYearStart, financialYearEnd };
}

function RevenueAnalysisTab() {
  const { revenue, formatCurrency, formatCurrencyForAxis, currency } = useDataContext();
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

  if (!currentDate || !revenue) {
    return (
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
    );
  }
  
  const { financialYearStart, financialYearEnd } = getFinancialYear(currentDate);

  const filteredTransactions = revenue.filter(t => {
    const transactionDate = new Date(t.date);
    if (viewMode === 'month') {
      return isSameMonth(transactionDate, currentDate);
    } else { // year view
      return transactionDate >= financialYearStart && transactionDate <= financialYearEnd;
    }
  });

  const projectedRevenue = filteredTransactions.reduce((acc, t) => acc + t.amount + (t.deposit ?? 0), 0);
  const actualRevenue = filteredTransactions.reduce((acc, t) => acc + (t.amountPaid ?? 0), 0);
  const totalArrears = projectedRevenue - actualRevenue;
  
  let chartData;
  let dateDisplayFormat;

  if (viewMode === 'year') {
    dateDisplayFormat = `${financialYearStart.getFullYear()}/${financialYearEnd.getFullYear()}`;
    const months = eachMonthOfInterval({ start: financialYearStart, end: financialYearEnd });
    
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
    dateDisplayFormat = format(currentDate, 'MMMM yyyy');
     chartData = [
      { name: format(currentDate, 'MMMM'), projected: projectedRevenue, actual: actualRevenue },
    ];
  }
  
  const chartHeight = '350px';

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Actual vs. Projected Revenue</CardTitle>
            <CardDescription>Analyze revenue performance and the impact of arrears.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
             <ToggleGroup type="single" value={viewMode} onValueChange={handleViewChange} defaultValue="year" className="w-full sm:w-auto">
              <ToggleGroupItem value="month" aria-label="Toggle month" className="flex-1">Month</ToggleGroupItem>
              <ToggleGroupItem value="year" aria-label="Toggle year" className="flex-1">Year</ToggleGroupItem>
            </ToggleGroup>
            <div className="flex items-center justify-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrev}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold text-center w-32 shrink-0">{dateDisplayFormat}</span>
              <Button variant="outline" size="icon" onClick={handleNext}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <KpiCard
            icon={TrendingUp}
            title="Gross Potential Income"
            value={formatCurrency(projectedRevenue)}
            description={`Total rent due for the period`}
          />
           <KpiCard
            icon={CircleAlert}
            title="Vacancy & Credit Losses"
            value={formatCurrency(totalArrears)}
            description={`Unpaid rent for the period`}
          />
          <KpiCard
            icon={CurrencyIcon}
            title="Net Rental Income"
            value={formatCurrency(actualRevenue)}
            description={`Effective Gross Income collected`}
          />
        </div>
         <ChartContainer config={{}} style={{ height: chartHeight }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis
                tickFormatter={(value) => formatCurrencyForAxis(Number(value))}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={<ChartTooltipContent
                  formatter={(value, name) => (
                    <div className="flex flex-col">
                      <span className="text-muted-foreground capitalize">{name}</span>
                      <span>{formatCurrency(Number(value))}</span>
                    </div>
                  )}
                />}
                cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }}
              />
              <Legend />
              <Bar dataKey="projected" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} name="Projected" />
              <Bar dataKey="actual" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Actual" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}


function PnlStatementTab() {
  const { properties, revenue, expenses, formatCurrency, formatCurrencyForAxis, residencyStatus } = useDataContext();
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
  
  if (!currentDate || !revenue || !expenses || !properties) {
    // Show skeleton loader while waiting for client-side mount
    return (
       <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
              <Skeleton className="h-24" />
            </div>
          </CardContent>
        </Card>
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
            <Card><CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader><CardContent><Skeleton className="h-48 w-full" /></CardContent></Card>
         </div>
      </div>
    );
  }
  
  const { financialYearStart, financialYearEnd } = getFinancialYear(currentDate);

  const filteredRevenue = revenue.filter(t => {
    const tDate = new Date(t.date);
    const hasBeenPaid = (t.amountPaid ?? 0) > 0;
    if (viewMode === 'month') {
      return isSameMonth(tDate, currentDate) && hasBeenPaid;
    }
    return tDate >= financialYearStart && tDate <= financialYearEnd && hasBeenPaid;
  });

  const filteredExpenses = expenses.filter(e => {
    const eDate = new Date(e.date);
    if (viewMode === 'month') {
      return isSameMonth(eDate, currentDate);
    }
    return eDate >= financialYearStart && eDate <= financialYearEnd;
  });
  
  const dateDisplayFormat = viewMode === 'month' 
    ? format(currentDate, 'MMMM yyyy') 
    : `${financialYearStart.getFullYear()}/${financialYearEnd.getFullYear()}`;
    
  const totalRevenue = filteredRevenue.reduce((sum, item) => sum + (item.amountPaid ?? 0), 0);
  const totalExpenses = filteredExpenses.reduce((sum, item) => sum + item.amount, 0);
  const netOperatingIncome = totalRevenue - totalExpenses;
  
  // Calculate estimated tax and net profit after tax
  const propertyMap = new Map(properties.map(p => [p.id, p]));
  const grossResidentialRevenue = residencyStatus === 'resident'
    ? filteredRevenue
        .filter(t => {
          const prop = propertyMap.get(t.propertyId!);
          return prop?.propertyType === 'Domestic';
        })
        .reduce((sum, t) => sum + (t.amountPaid ?? 0), 0)
    : 0;
    
  const estimatedTax = grossResidentialRevenue * 0.075;
  const netProfitAfterTax = totalRevenue - totalExpenses - estimatedTax;
  const isProfit = netProfitAfterTax >= 0;
  
  const expenseCategories = filteredExpenses.reduce((acc, expense) => {
    const category = expense.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += expense.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
           <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle>Financial Summary</CardTitle>
                <CardDescription>
                  Summary for {dateDisplayFormat}
                </CardDescription>
              </div>
               <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <ToggleGroup type="single" value={viewMode} onValueChange={handleViewChange} defaultValue="year" className="w-full sm:w-auto">
                    <ToggleGroupItem value="month" aria-label="Toggle month" className="flex-1">Month</ToggleGroupItem>
                    <ToggleGroupItem value="year" aria-label="Toggle year" className="flex-1">Year</ToggleGroupItem>
                  </ToggleGroup>
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="icon" onClick={handlePrev}>
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="font-semibold text-center w-32 shrink-0">{dateDisplayFormat}</span>
                    <Button variant="outline" size="icon" onClick={handleNext}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
               </div>
            </div>
        </CardHeader>
        <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                icon={CurrencyIcon}
                title="Net Operating Income"
                value={formatCurrency(netOperatingIncome)}
                description="Profit before tax"
                />
            </div>
        </CardContent>
      </Card>
      
       <Card className={cn("w-full", isProfit ? "bg-green-100/50 dark:bg-green-900/20" : "bg-red-100/50 dark:bg-red-900/20")}>
            <CardHeader className="flex flex-col items-center pb-2">
                <CardTitle className="text-sm font-medium">
                {isProfit ? 'Net Profit' : 'Net Loss'} (After Tax)
                </CardTitle>
                <CurrencyIcon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="text-center">
                <div className={cn("text-2xl font-bold", isProfit ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-500')}>
                {formatCurrency(netProfitAfterTax)}
                </div>
                <p className="text-xs text-muted-foreground">After 7.5% estimated tax on gross residential revenue</p>
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
  );
}


function ReportsPage() {
  const { revenue, expenses, properties } = useDataContext();

  if (!revenue || !expenses || !properties) {
    // Render a loading state or skeleton
    return (
      <>
        <PageHeader title="Financial Reports" />
        <Skeleton className="h-10 w-48 mb-4" />
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/s4" />
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
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Financial Reports">
        <MarketResearchDialog properties={properties} />
        <GenerateReportDialog revenue={revenue} expenses={expenses} />
      </PageHeader>
       <Tabs defaultValue="revenue-analysis">
        <TabsList>
          <TabsTrigger value="revenue-analysis">Revenue Analysis</TabsTrigger>
          <TabsTrigger value="pnl-statement">P&amp;L Statement</TabsTrigger>
        </TabsList>
        <TabsContent value="revenue-analysis" className="pt-4">
          <RevenueAnalysisTab />
        </TabsContent>
        <TabsContent value="pnl-statement" className="pt-4">
          <PnlStatementTab />
        </TabsContent>
      </Tabs>
    </>
  );
}

export default memo(ReportsPage);

    