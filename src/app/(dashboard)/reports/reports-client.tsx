
'use client';

import { useState, useEffect, memo, useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subMonths, addMonths, subYears, addYears, isSameMonth, isSameYear, eachMonthOfInterval, startOfYear, endOfYear, differenceInCalendarMonths, startOfMonth, endOfMonth, isAfter } from 'date-fns';
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
import type { Property, Transaction, Expense } from '@/lib/types';
import { useCollection } from 'react-firebase-hooks/firestore';
import { useDataContext } from '@/context/data-context';
import { useUser, useFirestore } from '@/firebase';
import { createUserQuery } from '@/firebase/firestore/query-builder';
import { Query } from 'firebase/firestore';
import { getLocale } from '@/lib/locales';

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
  const { settings } = useDataContext();
  const currency = settings?.currency || 'KES';
  const locale = settings?.locale || 'en-KE';
  const { user } = useUser();
  const firestore = useFirestore();

  const revenueQuery = useMemo(() => user?.uid ? createUserQuery(firestore, 'revenue', user.uid) : null, [firestore, user?.uid]);
  const propertiesQuery = useMemo(() => user?.uid ? createUserQuery(firestore, 'properties', user.uid) : null, [firestore, user?.uid]);
  
  const [revenueSnapshot, isRevenueLoading] = useCollection<Transaction>(revenueQuery as Query<Transaction> | null);
  const [propertiesSnapshot, isPropertiesLoading] = useCollection<Property>(propertiesQuery as Query<Property> | null);

  const revenue = useMemo(() => revenueSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction)) || [], [revenueSnapshot]);
  const properties = useMemo(() => propertiesSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Property)) || [], [propertiesSnapshot]);

  const [viewMode, setViewMode] = useState<ViewMode>('year');
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  };
  const formatCurrencyForAxis = (amount: number) => {
      if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
      if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
      return amount.toString();
  };

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
  
  const handleViewChange = (value: string) => {
    if (value === 'month' || value === 'year') {
      setViewMode(value as ViewMode);
    }
  };

  if (!currentDate || isRevenueLoading || isPropertiesLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-6 p-6">
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
  const periodStart = viewMode === 'month' ? startOfMonth(currentDate) : financialYearStart;
  const periodEnd = viewMode === 'month' ? endOfMonth(currentDate) : financialYearEnd;

  const activeTenancyPropertyIds = new Set(
    revenue
      .filter(t => {
        const tStartDate = new Date(t.tenancyStartDate!);
        const tEndDate = new Date(t.tenancyEndDate!);
        return tStartDate <= periodEnd && tEndDate >= periodStart;
      })
      .map(t => t.propertyId)
  );

  const vacantProperties = properties.filter(p => !activeTenancyPropertyIds.has(p.id));
  
  let vacancyLoss = 0;
  let potentialRentFromVacant = 0;
  const monthsInPeriod = differenceInCalendarMonths(periodEnd, periodStart) + 1;

  if (viewMode === 'year') {
    vacancyLoss = vacantProperties.reduce((total, p) => total + ((p.rentalValue || 0) * monthsInPeriod), 0);
    potentialRentFromVacant = vacancyLoss;
  } else { // month view
    vacancyLoss = vacantProperties.reduce((total, p) => total + (p.rentalValue || 0), 0);
    potentialRentFromVacant = vacancyLoss;
  }

  const filteredTransactions = revenue.filter(t => {
    const transactionDate = new Date(t.date || new Date());
    return transactionDate >= periodStart && transactionDate <= periodEnd;
  });
  
  const creditLoss = filteredTransactions.reduce((acc, t) => acc + ((t.rent || 0) - (t.amountPaid ?? 0)), 0);
  const totalLoss = creditLoss + vacancyLoss;

  const grossPotentialFromTenancies = filteredTransactions.reduce((acc, t) => acc + (t.rent || 0), 0);
  const grossPotentialIncome = grossPotentialFromTenancies + potentialRentFromVacant;
  
  const netRentalIncome = filteredTransactions.reduce((acc, t) => acc + (t.amountPaid ?? 0), 0);
  
  let chartData;
  let dateDisplayFormat;

  if (viewMode === 'year') {
    dateDisplayFormat = `${financialYearStart.getFullYear()}/${financialYearEnd.getFullYear()}`;
    const months = eachMonthOfInterval({ start: financialYearStart, end: financialYearEnd });
    
    chartData = months.map(month => {
      const monthlyTransactions = revenue.filter(t => isSameMonth(new Date(t.date || new Date()), month));
      const activeTenancyIdsThisMonth = new Set(monthlyTransactions.map(t => t.propertyId));
      const vacantPropsThisMonth = properties.filter(p => !activeTenancyIdsThisMonth.has(p.id));
      const vacantRentThisMonth = vacantPropsThisMonth.reduce((total, p) => total + (p.rentalValue || 0), 0);

      const grossPotential = monthlyTransactions.reduce((acc, t) => acc + (t.rent || 0), 0) + vacantRentThisMonth;
      const netIncome = monthlyTransactions.reduce((acc, t) => acc + (t.amountPaid ?? 0), 0);
      return {
        name: format(month, 'MMM'),
        grossPotential,
        netIncome,
      };
    });
  } else { // month view
    dateDisplayFormat = format(currentDate, 'MMMM yyyy');
     chartData = [
      { name: format(currentDate, 'MMMM'), grossPotential: grossPotentialIncome, netIncome: netRentalIncome },
    ];
  }
  
  const isFuture = isAfter(periodStart, new Date());
  const isCurrentPeriod = viewMode === 'month' ? isSameMonth(currentDate, new Date()) : isSameYear(currentDate, new Date());

  const chartHeight = 350; // Keep as number for ChartContainer

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Actual vs. Projected Revenue</CardTitle>
            <CardDescription>Analyse revenue performance including vacancy and credit losses.</CardDescription>
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
              <Button variant="outline" size="icon" onClick={handleNext} disabled={isFuture || isCurrentPeriod}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-3">
          <KpiCard
            icon={TrendingUp}
            title="Gross Potential Income"
            value={grossPotentialIncome}
            description={`Total potential rent including vacant properties`}
          />
          <KpiCard
            icon={CircleAlert}
            title="Vacancy & Credit Losses"
            value={totalLoss}
            description={`Unpaid rent and vacant property loss`}
          />
          <KpiCard
            icon={(props) => <CurrencyIcon {...props} />}
            title="Net Rental Income"
            value={netRentalIncome}
            description={`Effective Gross Income collected`}
          />
        </div>
         <ChartContainer config={{}} className="h-[350px] w-full">
          <ResponsiveContainer>
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
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
                      <span className="text-muted-foreground capitalize">{name === 'grossPotential' ? 'Gross Potential' : 'Net Income'}</span>
                      <span>{formatCurrency(Number(value))}</span>
                    </div>
                  )}
                />}
                cursor={{ fill: 'hsl(var(--accent))', opacity: 0.3 }}
              />
              <Legend />
              <Bar dataKey="grossPotential" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} name="Gross Potential" />
              <Bar dataKey="netIncome" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Net Income" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

function PnlStatementTab() {
  const { settings } = useDataContext();
  const currency = settings?.currency || 'KES';
  const locale = settings?.locale || 'en-KE';
  const residencyStatus = settings?.residencyStatus || '';
  const { user } = useUser();
  const firestore = useFirestore();

  const propertiesQuery = useMemo(() => user?.uid ? createUserQuery(firestore, 'properties', user.uid) : null, [firestore, user?.uid]);
  const revenueQuery = useMemo(() => user?.uid ? createUserQuery(firestore, 'revenue', user.uid) : null, [firestore, user?.uid]);
  const expensesQuery = useMemo(() => user?.uid ? createUserQuery(firestore, 'expenses', user.uid) : null, [firestore, user?.uid]);

  const [propertiesSnapshot, isPropertiesLoading] = useCollection<Property>(propertiesQuery as Query<Property> | null);
  const [revenueSnapshot, isRevenueLoading] = useCollection<Transaction>(revenueQuery as Query<Transaction> | null);
  const [expensesSnapshot, isExpensesLoading] = useCollection<Expense>(expensesQuery as Query<Expense> | null);

  const properties = useMemo(() => propertiesSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Property)) || [], [propertiesSnapshot]);
  const revenue = useMemo(() => revenueSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction)) || [], [revenueSnapshot]);
  const expenses = useMemo(() => expensesSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Expense)) || [], [expensesSnapshot]);

  const [viewMode, setViewMode] = useState<ViewMode>('year');
  const [currentDate, setCurrentDate] = useState<Date | null>(null);
  const [localeData, setLocaleData] = useState<any>(null);

  useEffect(() => {
    const loadLocale = async () => {
      const data = await getLocale(locale);
      setLocaleData(data);
    };
    loadLocale();
  }, [locale]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  };
  const formatCurrencyForAxis = (amount: number) => {
      if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M`;
      if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
      return amount.toString();
  };

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

  const handleViewChange = (value: string) => {
    if (value === 'month' || value === 'year') {
      setViewMode(value as ViewMode);
    }
  };
  
  if (!currentDate || isRevenueLoading || isExpensesLoading || isPropertiesLoading || !localeData) {
    return (
       <div className="space-y-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="p-6">
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
  const periodStart = viewMode === 'month' ? startOfMonth(currentDate) : financialYearStart;

  const filteredRevenue = revenue.filter(t => {
    const tDate = new Date(t.date || new Date());
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
    ? format(currentDate, 'MMMM yyyy', { locale: localeData }) 
    : `${financialYearStart.getFullYear()}/${financialYearEnd.getFullYear()}`;
    
  const totalRevenue = filteredRevenue.reduce((sum, item) => sum + (item.amountPaid ?? 0), 0);
  const totalExpenses = filteredExpenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  const netOperatingIncome = totalRevenue - totalExpenses;
  
  const propertyMap = new Map(properties.map(p => [p.id, p]));
  const grossResidentialRevenue = residencyStatus === 'Resident'
    ? filteredRevenue
        .filter(t => {
          const prop = propertyMap.get(t.propertyId!);
          return prop?.propertyType === 'domestic';
        })
        .reduce((sum, t) => sum + (t.amountPaid ?? 0), 0)
    : 0;
    
  const estimatedTax = grossResidentialRevenue * 0.075;
  const netProfitAfterTax = totalRevenue - totalExpenses - estimatedTax;
  const isProfit = netProfitAfterTax >= 0;
  
  const expenseCategories = filteredExpenses.reduce((acc, expense) => {
    const category = expense.category || 'Uncategorised';
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += (expense.amount || 0);
    return acc;
  }, {} as Record<string, number>);

  const isFuture = isAfter(periodStart, new Date());
  const isCurrentPeriod = viewMode === 'month' ? isSameMonth(currentDate, new Date()) : isSameYear(currentDate, new Date());

  const chartHeight = 350; // Keeping this as a fixed number for now, not a string

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
                    <Button variant="outline" size="icon" onClick={handleNext} disabled={isFuture || isCurrentPeriod}>
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
               </div>
            </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KpiCard
              icon={TrendingUp}
              title="Total Revenue"
              value={totalRevenue}
              description="Sum of all income received"
              />
              <KpiCard
              icon={TrendingDown}
              title="Total Expenses"
              value={totalExpenses}
              description="Sum of all costs incurred"
              />
              <KpiCard
              icon={(props) => <CurrencyIcon {...props} />}
              title="Net Operating Income"
              value={netOperatingIncome}
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
            <CardContent className="text-center p-6">
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
          <CardContent className="p-6">
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
                    <TableCell>{format(new Date(item.date || new Date()), 'PP', { locale: localeData })}</TableCell>
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
          <CardContent className="p-6">
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

const ReportsClient = memo(function ReportsClient() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { settings } = useDataContext();
  const isPnlReportEnabled = settings?.isPnlReportEnabled ?? false;
  const isMarketResearchEnabled = settings?.isMarketResearchEnabled ?? false;

  const revenueQuery = useMemo(() => user?.uid ? createUserQuery(firestore, 'revenue', user.uid) : null, [firestore, user?.uid]);
  const expensesQuery = useMemo(() => user?.uid ? createUserQuery(firestore, 'expenses', user.uid) : null, [firestore, user?.uid]);
  const propertiesQuery = useMemo(() => user?.uid ? createUserQuery(firestore, 'properties', user.uid) : null, [firestore, user?.uid]);

  const [revenueSnapshot, isRevenueLoading] = useCollection<Transaction>(revenueQuery as Query<Transaction> | null);
  const [expensesSnapshot, isExpensesLoading] = useCollection<Expense>(expensesQuery as Query<Expense> | null);
  const [propertiesSnapshot, isPropertiesLoading] = useCollection<Property>(propertiesQuery as Query<Property> | null);

  const revenue = useMemo(() => revenueSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction)) || [], [revenueSnapshot]);
  const expenses = useMemo(() => expensesSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Expense)) || [], [expensesSnapshot]);
  const properties = useMemo(() => propertiesSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Property)) || [], [propertiesSnapshot]);

  if (isRevenueLoading || isExpensesLoading || isPropertiesLoading) {
    return (
      <>
        <PageHeader title="Financial Reports" />
        <Skeleton className="h-10 w-48 mb-4" />
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="space-y-6 p-6">
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
        {isMarketResearchEnabled && properties && <MarketResearchDialog properties={properties} />}
        {isPnlReportEnabled && revenue && expenses && <GenerateReportDialog revenue={revenue} expenses={expenses} />}
      </PageHeader>
       <Tabs defaultValue="revenue-analysis">
        <TabsList>
          <TabsTrigger value="revenue-analysis">Revenue Analysis</TabsTrigger>
          <TabsTrigger value="pnl-statement">P&L Statement</TabsTrigger>
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
});

export default ReportsClient;
