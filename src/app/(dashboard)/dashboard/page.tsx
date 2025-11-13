
'use client';

import { Building, TrendingUp, TrendingDown, CircleAlert, Banknote } from 'lucide-react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { memo, useMemo } from 'react';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { PageHeader } from '@/components/page-header';
import { CurrencyIcon } from '@/components/currency-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useCollection } from 'react-firebase-hooks/firestore';
import type { Property, Transaction } from '@/lib/types';
import { useDataContext } from '@/context/data-context';
import { Button } from '@/components/ui/button';
import { startOfToday, isBefore } from 'date-fns';
import { useUser, useFirestore } from '@/firebase';
import { createUserQuery } from '@/firebase/firestore/query-builder';
import { Query } from 'firebase/firestore';

// Dynamically import charts to prevent server-side rendering issues
const AreaChartComponent = dynamic(() => import('@/components/dashboard/area-chart'), { ssr: false });
const BarChartComponent = dynamic(() => import('@/components/dashboard/bar-chart'), { ssr: false });

const DashboardPageContent = memo(function DashboardPageContent() {
  const { settings } = useDataContext();
  const { currency, locale } = settings;
  const { user } = useUser();
  const firestore = useFirestore();

  const propertiesQuery = useMemo(() => user?.uid ? createUserQuery(firestore, 'properties', user.uid) : null, [firestore, user?.uid]);
  const revenueQuery = useMemo(() => user?.uid ? createUserQuery(firestore, 'revenue', user.uid) : null, [firestore, user?.uid]);
  const expensesQuery = useMemo(() => user?.uid ? createUserQuery(firestore, 'expenses', user.uid) : null, [firestore, user?.uid]);

  const [propertiesSnapshot, isPropertiesLoading] = useCollection<Property>(propertiesQuery as Query<Property> | null);
  const [revenueSnapshot, isRevenueLoading] = useCollection<Transaction>(revenueQuery as Query<Transaction> | null);
  const [expensesSnapshot, isExpensesLoading] = useCollection<Transaction>(expensesQuery as Query<Transaction> | null);
  
  const properties = useMemo(() => propertiesSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Property)) || [], [propertiesSnapshot]);
  const revenue = useMemo(() => revenueSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction)) || [], [revenueSnapshot]);
  const expenses = useMemo(() => expensesSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Transaction)) || [], [expensesSnapshot]);

  const isDataLoading = isPropertiesLoading || isRevenueLoading || isExpensesLoading;

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
  
  if (properties.length === 0) {
    return (
        <>
            <PageHeader title="Dashboard" />
             <Card className="text-center py-16">
                <CardHeader>
                    <div className="mx-auto bg-muted rounded-full p-4 w-fit">
                        <Building className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <CardTitle className="mt-4 !text-2xl">Welcome to LeaseLync</CardTitle>
                    <CardDescription className="max-w-md mx-auto">Get started by adding your first property to your portfolio. Once added, you can begin tracking revenue, expenses, and more.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/properties">Add Property</Link>
                    </Button>
                </CardContent>
            </Card>
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
    .reduce((acc, e) => acc + (e.amount || 0), 0);
  
  const today = startOfToday();
  const tenancies = Object.values(
    revenue.reduce((acc, tx) => {
      const tenancyId = tx.tenancyId || `no-id-${tx.id}`;
      if (!acc[tenancyId]) {
        acc[tenancyId] = {
          transactions: [],
        };
      }
      acc[tenancyId].transactions.push(tx);
      return acc;
    }, {} as Record<string, { transactions: Transaction[] }>)
  );

  const totalArrears = tenancies.reduce((total, tenancy) => {
    const totalDueToDate = tenancy.transactions.reduce((sum, tx) => sum + tx.rent + (tx.serviceCharges?.reduce((scSum, sc) => scSum + sc.amount, 0) || 0) + (tx.deposit ?? 0), 0);
    const totalPaid = tenancy.transactions.reduce((sum, tx) => sum + (tx.amountPaid ?? 0), 0);
    const balance = totalDueToDate - totalPaid;
    return total + (balance > 0 ? balance : 0);
  }, 0);

  const netOperatingIncome = totalRevenue - totalExpenses;
  const noiVariant = netOperatingIncome >= 0 ? 'positive' : 'destructive';

  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          icon={Building}
          title="Total Property Value"
          value={totalPropertyValue}
          description="Current market value of all assets"
        />
        <KpiCard
          icon={Banknote}
          title="Total Portfolio Equity"
          value={totalEquity}
          description="Property value minus outstanding mortgage"
        />
        <KpiCard
          icon={TrendingUp}
          title="Revenue"
          value={totalRevenue}
          description="This month"
        />
        <KpiCard
          icon={TrendingDown}
          title="Expenses"
          value={totalExpenses}
          description="This month"
        />
        <KpiCard
          icon={CurrencyIcon}
          title="Net Operating Income"
          value={netOperatingIncome}
          description="This month (before tax)"
          variant={noiVariant}
        />
        <KpiCard
          icon={CircleAlert}
          title="Arrears"
          value={totalArrears}
          description="Total outstanding payments"
          variant={totalArrears > 0 ? 'destructive' : 'default'}
        />
      </div>
      <div className="grid gap-4 mt-4 grid-cols-1">
        <AreaChartComponent revenue={revenue} expenses={expenses} />
        <BarChartComponent properties={properties} revenue={revenue} expenses={expenses} />
      </div>
    </>
  );
});

export default function DashboardPage() {
    return (
        <DashboardPageContent />
    )
}
