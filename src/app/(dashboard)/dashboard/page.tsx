
'use client';

import { useMemo } from 'react';
import { useDataContext } from '@/context/data-context';
import { useUser } from '@/firebase';
import { Building, TrendingUp, TrendingDown, Loader2, Calendar, Percent, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { CurrencyIcon } from '@/components/currency-icon';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AreaChart } from '@/components/dashboard/area-chart';
import { HorizontalBarChart } from '@/components/dashboard/horizontal-bar-chart';
import { formatCurrency } from '@/lib/utils';
import { startOfToday, isBefore } from 'date-fns';

export default function DashboardPage() {
  const { user, isAuthLoading: authLoading } = useUser();
  const { properties, revenue, expenses, isLoading: dataLoading, settings } = useDataContext();
  const { currency, locale } = settings;

  // Calculate all metrics
  const metrics = useMemo(() => {
    const totalProperties = properties.length;
    const totalAssetValue = properties.reduce((sum, prop) => sum + (prop.currentValue || 0), 0);
    
    const totalMortgageDebt = properties.reduce((sum, prop) => sum + (prop.mortgage || 0), 0);
    const netEquity = totalAssetValue - totalMortgageDebt;
    
    const totalRevenue = revenue.reduce((sum, doc) => sum + (doc.amountPaid || 0), 0);
    const totalExpenses = expenses.reduce((sum, doc) => sum + (doc.amount || 0), 0);
    const netIncome = totalRevenue - totalExpenses;

    const tenancies = Object.values(
      revenue.reduce((acc, tx) => {
        if (tx.tenancyId) {
          acc[tx.tenancyId] = tx;
        }
        return acc;
      }, {} as Record<string, any>)
    );
    const tenanciesCount = tenancies.length;
    const totalUnits = properties.length;
    const occupancyRate = totalUnits > 0 ? (tenanciesCount / totalUnits) * 100 : 0;

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const thisMonthRevenue = revenue
      .filter(r => {
        const date = r.date ? new Date(r.date) : new Date();
        return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, r) => sum + (r.amountPaid || 0), 0);

    const arrearsByTenancy = tenancies.filter(tenancy => {
      const dueTransactions = (tenancy.transactions || []).filter((tx: any) => !isBefore(startOfToday(), new Date(tx.date)));
      const totalDueToDate = dueTransactions.reduce((sum: number, tx: any) => sum + tx.rent + ((tx.serviceCharges || []).reduce((scSum: number, sc: any) => scSum + sc.amount, 0)) + (tx.deposit || 0), 0);
      const totalPaid = (tenancy.transactions || []).reduce((sum: number, tx: any) => sum + (tx.amountPaid || 0), 0);
      return (totalDueToDate - totalPaid) > 0.01;
    });
    const arrearsCount = arrearsByTenancy.length;

    return {
      totalProperties,
      totalAssetValue,
      totalMortgageDebt,
      netEquity,
      totalRevenue,
      totalExpenses,
      netIncome,
      tenanciesCount,
      occupancyRate,
      thisMonthRevenue,
      arrearsCount,
      totalUnits
    };
  }, [properties, revenue, expenses]);

  const chartData = useMemo(() => {
    const monthsData: Record<string, { month: string; revenue: number; expenses: number }> = {};
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthsData[monthKey] = {
        month: date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
        revenue: 0,
        expenses: 0
      };
    }

    revenue.forEach(r => {
      const date = new Date(r.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthsData[monthKey]) {
        monthsData[monthKey].revenue += r.amountPaid || 0;
      }
    });

    expenses.forEach(e => {
      const date = new Date(e.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthsData[monthKey]) {
        monthsData[monthKey].expenses += e.amount || 0;
      }
    });

    return Object.values(monthsData);
  }, [revenue, expenses]);

  // Profit per property - USE ADDRESSES
  const propertyProfits = useMemo(() => {
    return properties.map(prop => {
      const propRevenue = revenue
        .filter(r => r.propertyId === prop.id)
        .reduce((sum, r) => sum + (r.amountPaid || 0), 0);
      
      const propExpenses = expenses
        .filter(e => e.propertyId === prop.id)
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      // Use addressLine1 + city as display name
      const displayName = prop.addressLine1 
        ? `${prop.addressLine1}${prop.city ? ', ' + prop.city : ''}` 
        : 'Unnamed Property';

      return {
        name: displayName,
        profit: propRevenue - propExpenses
      };
    }).sort((a, b) => b.profit - a.profit);
  }, [properties, revenue, expenses]);

  const recentActivity = useMemo(() => {
    const activities: Array<{ type: string; description: string; amount: number; date: Date }> = [];

    revenue.forEach(r => {
      if (r.amountPaid && r.amountPaid > 0) {
        activities.push({
          type: 'revenue',
          description: `Payment from ${r.tenant || 'Tenant'}`,
          amount: r.amountPaid || 0,
          date: new Date(r.date)
        });
      }
    });

    expenses.forEach(e => {
      activities.push({
        type: 'expense',
        description: `Expense: ${e.category || 'Uncategorized'}`,
        amount: e.amount || 0,
        date: new Date(e.date)
      });
    });

    return activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);
  }, [revenue, expenses]);

  if (authLoading || dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Dashboard">
        <p className="text-sm text-muted-foreground hidden sm:block">
            Welcome back, {user?.displayName || user?.email || 'User'}!
        </p>
      </PageHeader>

      {/* Main Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <KpiCard
          icon={Calendar}
          title="This Month"
          value={metrics.thisMonthRevenue}
          description="Current month revenue"
        />
        <KpiCard
          icon={TrendingUp}
          title="Net Income"
          value={metrics.netIncome}
          description="Revenue - Expenses"
          variant={metrics.netIncome >= 0 ? 'default' : 'destructive'}
        />
        <KpiCard
          icon={AlertCircle}
          title="Arrears"
          value={metrics.arrearsCount}
          description="Overdue payments"
          variant={metrics.arrearsCount > 0 ? 'destructive' : 'default'}
        />
        <KpiCard
          icon={TrendingDown}
          title="Total Expenses"
          value={metrics.totalExpenses}
          description="All-time total"
          variant="destructive"
        />
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
         <KpiCard
          icon={CurrencyIcon}
          title="Asset Value"
          value={metrics.totalAssetValue}
          description="Total property value"
        />
        <KpiCard
          icon={CurrencyIcon}
          title="Net Equity"
          value={metrics.netEquity}
          description="After mortgages"
        />
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.totalProperties}</div>
            <p className="text-xs text-muted-foreground">{metrics.totalUnits} total units</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Occupancy</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.occupancyRate.toFixed(0)}%</div>
            <p className="text-xs text-muted-foreground">{metrics.tenanciesCount} active tenants</p>
          </CardContent>
        </Card>
      </div>


      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Income vs Expenses</h3>
          <p className="text-sm text-muted-foreground mb-4">Last 6 months trend</p>
          <AreaChart data={chartData} />
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Profit Per Property</h3>
          <p className="text-sm text-muted-foreground mb-4">Net income by property</p>
          <HorizontalBarChart data={propertyProfits} />
        </div>
      </div>

      {/* Insights Section */}
      <div className="grid gap-6 lg:grid-cols-2 mb-6">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between border-b pb-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.date.toLocaleDateString('en-GB', { 
                        day: 'numeric', 
                        month: 'short',
                        year: 'numeric'
                      })}
                    </p>
                  </div>
                  <span className={`text-sm font-semibold ${
                    activity.type === 'revenue' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {activity.type === 'revenue' ? '+' : '-'}{formatCurrency(activity.amount, locale, currency)}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-500" />
            Requires Attention
          </h3>
          <div className="space-y-3">
            {metrics.arrearsCount > 0 ? (
              <div className="flex items-start gap-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-md">
                <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Overdue Payments</p>
                  <p className="text-xs text-muted-foreground">{metrics.arrearsCount} tenants with arrears</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 rounded-md">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <p className="text-sm font-medium">All payments up to date! 🥳</p>
              </div>
            )}
            
            {metrics.occupancyRate < 80 && (
              <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 rounded-md">
                <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                <div>
                  <p className="text-sm font-medium">Low Occupancy</p>
                  <p className="text-xs text-muted-foreground">
                    {metrics.totalUnits - metrics.tenanciesCount} vacant units
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {metrics.totalProperties === 0 && (
        <div className="rounded-lg border bg-card p-8 text-center">
          <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">No properties yet</h3>
          <p className="text-muted-foreground mb-4">
            Get started by adding your first property
          </p>
          <Button asChild>
            <Link href="/properties">Add Property</Link>
          </Button>
        </div>
      )}
    </>
  );
}

    