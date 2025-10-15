'use client';

import { Building, TrendingUp, TrendingDown, CircleAlert, Banknote } from 'lucide-react';
import dynamic from 'next/dynamic';
import { memo } from 'react';
import { useDataContext } from '@/context/data-context';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { PageHeader } from '@/components/page-header';
import { CurrencyIcon } from '@/components/currency-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// Dynamically import charts to prevent server-side rendering issues
const AreaChartComponent = dynamic(() => import('@/components/dashboard/area-chart').then(mod => mod.AreaChartComponent), { ssr: false });
const BarChartComponent = dynamic(() => import('@/components/dashboard/bar-chart').then(mod => mod.BarChartComponent), { ssr: false });

function DashboardPage() {
  const { properties, revenue, expenses, formatCurrency, isDataLoading } = useDataContext();

  // Data might not be available on the first render, so we add a loading state.
  if (isDataLoading) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-1/2 mb-2" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="grid gap-4 mt-4 grid-cols-1">
            <Skeleton className="h-[380px]" />
            <Skeleton className="h-[380px]" />
        </div>
      </>
    )
  }
  
  if (!properties || !revenue || !expenses) {
    return (
        <>
            <PageHeader title="Dashboard" />
            <div className="text-center py-12">
                <h2 className="text-2xl font-semibold mb-2">Welcome to RentVision</h2>
                <p className="text-muted-foreground">Get started by adding your first property.</p>
            </div>
        </>
    )
  }

  const totalPropertyValue = properties.reduce((acc, p) => acc + p.currentValue, 0);
  const totalMortgage = properties.reduce((acc, p) => acc + p.mortgage, 0);
  const totalEquity = totalPropertyValue - totalMortgage;
  
  const totalRevenue = revenue
    .filter(r => new Date(r.date).getMonth() === new Date().getMonth())
    .reduce((acc, r) => acc + (r.amountPaid ?? 0), 0);
  const totalExpenses = expenses
    .filter(e => new Date(e.date).getMonth() === new Date().getMonth())
    .reduce((acc, e) => acc + e.amount, 0);
  
  const totalArrears = revenue
    .filter(r => {
      const amountDue = r.amount + (r.deposit ?? 0);
      const amountPaid = r.amountPaid ?? 0;
      return amountPaid < amountDue && new Date(r.date) < new Date();
    })
    .reduce((acc, r) => {
      const amountDue = r.amount + (r.deposit ?? 0);
      const amountPaid = r.amountPaid ?? 0;
      return acc + (amountDue - amountPaid);
    }, 0);

  const netOperatingIncome = totalRevenue - totalExpenses;

  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          icon={Building}
          title="Total Property Value"
          value={formatCurrency(totalPropertyValue)}
          description="Current market value of all assets"
        />
        <KpiCard
          icon={Banknote}
          title="Total Portfolio Equity"
          value={formatCurrency(totalEquity)}
          description="Property value minus outstanding mortgage"
        />
        <KpiCard
          icon={TrendingUp}
          title="Revenue"
          value={formatCurrency(totalRevenue)}
          description="This month"
        />
        <KpiCard
          icon={TrendingDown}
          title="Expenses"
          value={formatCurrency(totalExpenses)}
          description="This month"
        />
        <KpiCard
          icon={CurrencyIcon}
          title="Net Operating Income"
          value={formatCurrency(netOperatingIncome)}
          description="This month (before tax)"
        />
        <KpiCard
          icon={CircleAlert}
          title="Arrears"
          value={formatCurrency(totalArrears)}
          description="Total outstanding payments"
        />
      </div>
      <div className="grid gap-4 mt-4 grid-cols-1">
        <AreaChartComponent revenue={revenue} expenses={expenses} />
        <BarChartComponent properties={properties} revenue={revenue} expenses={expenses} />
      </div>
    </>
  );
}

export default memo(DashboardPage);
