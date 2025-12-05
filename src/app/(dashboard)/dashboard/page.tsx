
'use client';

import { useMemo } from 'react';
import { useDataContext } from '@/context/data-context';
import { useUser } from '@/firebase';
import { 
  Building, 
  TrendingUp, 
  TrendingDown, 
  Loader2, 
  Calendar, 
  Percent, 
  AlertCircle,
  Home,
  BarChart3,
  Users
} from 'lucide-react';
import { CurrencyIcon } from '@/components/currency-icon';
import { PageHeader } from '@/components/page-header';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { AreaChart } from '@/components/dashboard/area-chart';
import { PropertyROIScorecard } from '@/components/dashboard/property-roi-scorecard';
import { CashFlowChart } from '@/components/dashboard/cash-flow-chart';
import { ArrearsSummary } from '@/components/dashboard/arrears-summary';
import { formatCurrency } from '@/lib/utils';
import { startOfToday, isBefore } from 'date-fns';
import type { Transaction } from '@/lib/types';
import { cn } from '@/lib/utils';

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
          if (!acc[tx.tenancyId]) {
            acc[tx.tenancyId] = {
              ...tx,
              transactions: [],
            };
          }
          acc[tx.tenancyId].transactions.push(tx);
        }
        return acc;
      }, {} as Record<string, Transaction & { transactions: Transaction[] }>)
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

    const arrearsByTenancy = tenancies.map(tenancy => {
        const today = startOfToday();
        const dueTransactions = tenancy.transactions.filter(tx => !isBefore(today, new Date(tx.date)));
        
        const totalDueToDate = dueTransactions.reduce((sum, tx) => {
          const serviceChargesTotal = (tx.serviceCharges || []).reduce((scSum, sc) => scSum + sc.amount, 0);
          return sum + tx.rent + serviceChargesTotal + (tx.deposit || 0);
        }, 0);
        
        const totalPaid = tenancy.transactions.reduce((sum, tx) => sum + (tx.amountPaid || 0), 0);
        const amountOwed = totalDueToDate - totalPaid;
  
        if (amountOwed <= 0) return null;
        
        return { tenant: tenancy.tenant, amountOwed };
    }).filter((a): a is NonNullable<typeof a> => a !== null);

    const totalArrearsAmount = arrearsByTenancy.reduce((sum, arrear) => sum + arrear.amountOwed, 0);

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
      totalArrearsAmount,
      totalUnits,
      arrearsByTenancy
    };
  }, [properties, revenue, expenses]);

  // Chart data - Last 6 months
  const chartData = useMemo(() => {
    const monthsData: Record<string, { month: string; revenue: number; expenses: number; netCashFlow: number }> = {};
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthsData[monthKey] = {
        month: date.toLocaleDateString('en-GB', { month: 'short', year: '2-digit' }),
        revenue: 0,
        expenses: 0,
        netCashFlow: 0
      };
    }

    revenue.forEach(r => {
      const date = r.date ? new Date(r.date) : new Date();
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthsData[monthKey]) {
        monthsData[monthKey].revenue += r.amountPaid || 0;
      }
    });

    expenses.forEach(e => {
      const date = e.date ? new Date(e.date) : new Date();
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthsData[monthKey]) {
        monthsData[monthKey].expenses += e.amount || 0;
      }
    });

    return Object.values(monthsData).map(d => ({
      ...d,
      netCashFlow: d.revenue - d.expenses
    }));
  }, [revenue, expenses]);

  // Recent activity
  const recentActivity = useMemo(() => {
    const activities: Array<{ type: string; description: string; amount: number; date: Date; propertyName?: string }> = [];

    revenue.forEach(r => {
      if (r.amountPaid && r.amountPaid > 0) {
        activities.push({
          type: 'revenue',
          description: `Payment from ${r.tenant}`,
          amount: r.amountPaid,
          date: r.date ? new Date(r.date) : new Date(),
          propertyName: r.propertyName || 'Property'
        });
      }
    });

    expenses.forEach(e => {
      activities.push({
        type: 'expense',
        description: `${e.category || 'Uncategorized'}`,
        amount: e.amount || 0,
        date: e.date ? new Date(e.date) : new Date(),
        propertyName: e.propertyName || 'Property'
      });
    });

    return activities
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 8);
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

  // Empty State - show if no properties are added yet
  if (metrics.totalProperties === 0) {
    return (
      <>
        <PageHeader
          title="Dashboard"
          description={`Welcome back, ${user?.displayName || user?.email || 'User'}!`}
        />
        <Card className="border-2 border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Get Started with Your Portfolio</h3>
            <p className="text-muted-foreground mb-6 text-center max-w-sm">
              Add your first property to begin tracking your real estate portfolio and manage your properties efficiently
            </p>
            <Button asChild>
              <Link href="/properties">Add Your First Property</Link>
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }


  return (
    <>
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.displayName || user?.email || 'User'}!`}
      />

      {/* SECTION 1: Portfolio Overview KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <KpiCard
          icon={Home}
          title="Total Properties"
          value={metrics.totalProperties}
          description={`${metrics.totalUnits} unit${metrics.totalUnits !== 1 ? 's' : ''} across portfolio`}
          formatAs="integer"
        />

        <KpiCard
          icon={Percent}
          title="Occupancy Rate"
          value={metrics.occupancyRate}
          description={`${metrics.tenanciesCount} active tenant${metrics.tenanciesCount !== 1 ? 's' : ''}`}
          formatAs="percent"
        />

        <KpiCard
          icon={TrendingUp}
          title="Total Revenue (All-time)"
          value={metrics.totalRevenue}
          description="Cumulative from all properties"
          variant="positive"
        />

        <KpiCard
          icon={AlertCircle}
          title="Overdue Payments"
          value={metrics.totalArrearsAmount}
          description={`${metrics.arrearsByTenancy.length} tenanc${metrics.arrearsByTenancy.length !== 1 ? 'ies' : 'y'} in arrears`}
          variant="destructive"
        />
      </div>

      {/* SECTION 2: Financial Position KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <KpiCard
          icon={Building}
          title="Portfolio Asset Value"
          value={metrics.totalAssetValue}
          description="Current combined market value"
        />

        <KpiCard
          icon={CurrencyIcon}
          title="Equity After Mortgages"
          value={metrics.netEquity}
          description="Net ownership value"
        />

        <KpiCard
          icon={BarChart3}
          title="Net Profit (Total)"
          value={metrics.netIncome}
          description="Revenue - Expenses"
          variant={metrics.netIncome >= 0 ? 'positive' : 'destructive'}
        />

        <KpiCard
          icon={Calendar}
          title="Monthly Revenue (Current)"
          value={metrics.thisMonthRevenue}
          description={`${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`}
        />
      </div>
      
      {/* SECTION 3: Income vs Expenses Trend Chart */}
      <div className="mb-8">
          <AreaChart data={chartData} />
      </div>

      {/* SECTION 4: Cash Flow Analysis */}
      <div className="mb-8">
        <CashFlowChart data={chartData} />
      </div>

      {/* SECTION 5: Arrears Summary - PROMINENT */}
      {metrics.totalArrearsAmount > 0 && (
        <div className="mb-8">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-foreground">Payment Collections</h3>
            <p className="text-sm text-muted-foreground mt-1">Monitor and manage overdue payments</p>
          </div>
          <ArrearsSummary revenue={revenue} properties={properties} />
        </div>
      )}

      {/* SECTION 6: Property Performance Overview */}
      <div className="mb-8">
        <PropertyROIScorecard 
          properties={properties}
          revenue={revenue}
          expenses={expenses}
        />
      </div>

      {/* SECTION 7: Recent Activity + Quick Actions */}
      <div className="grid gap-6 lg:grid-cols-2 mb-8">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Latest 8 transactions</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start justify-between pb-3 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {activity.type === 'revenue' ? (
                          <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600 flex-shrink-0" />
                        )}
                        <p className="text-sm font-medium truncate">{activity.propertyName}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{activity.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.date.toLocaleDateString('en-GB', { 
                          day: 'numeric', 
                          month: 'short',
                          year: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className={cn(
                      "text-sm font-semibold flex-shrink-0 ml-2",
                      activity.type === 'revenue' ? 'text-green-600' : 'text-red-600'
                    )}>
                      {activity.type === 'revenue' ? '+' : '-'}{formatCurrency(activity.amount, locale, currency)}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground py-8 text-center">No recent activity</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions & Portfolio Summary */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                Portfolio Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tenants:</span>
                <span className="font-semibold">{metrics.tenanciesCount} / {metrics.totalUnits} Units</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Overdue payments:</span>
                <span className="font-semibold text-orange-600">{metrics.arrearsByTenancy.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total arrears:</span>
                <span className="font-semibold text-red-600">{formatCurrency(metrics.totalArrearsAmount, locale, currency)}</span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex justify-between text-sm font-medium">
                <span>Overall Health:</span>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-semibold",
                  metrics.netIncome >= 0 && metrics.totalArrearsAmount === 0 && metrics.occupancyRate >= 80
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                    : metrics.netIncome >= 0
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                )}>
                  {metrics.netIncome >= 0 && metrics.totalArrearsAmount === 0 && metrics.occupancyRate >= 80
                    ? '✅ Excellent'
                    : metrics.netIncome >= 0
                    ? '⚠️ Good'
                    : '🚨 Needs Attention'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/properties">
                  <Building className="h-4 w-4 mr-2" />
                  Manage Properties
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/revenue">
                  <Users className="h-4 w-4 mr-2" />
                  Manage Tenancies
                </Link>
              </Button>
               <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/expenses">
                  <TrendingDown className="h-4 w-4 mr-2" />
                  Add Expense
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
