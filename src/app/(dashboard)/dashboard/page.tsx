'use client';

import { useMemo } from 'react';
import { useDataContext } from '@/context/data-context';
import { useUser } from '@/firebase';
import { 
  Building, 
  TrendingUp, 
  TrendingDown, 
  Users,
  Calendar, 
  Percent, 
  AlertCircle
} from 'lucide-react';
import { CurrencyIcon } from '@/components/currency-icon';
import { PageHeader } from '@/components/page-header';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { AreaChart } from '@/components/dashboard/area-chart';
import { HorizontalBarChart } from '@/components/dashboard/horizontal-bar-chart';
import { startOfToday, isBefore } from 'date-fns';
import type { Transaction } from '@/lib/types';

export default function DashboardPageContent() {
  const { user } = useUser();
  const { properties, revenue, expenses, settings } = useDataContext();

  // Calculate all metrics
  const metrics = useMemo(() => {
    const totalProperties = properties.length;
    const totalAssetValue = properties.reduce((sum, prop) => sum + (prop.currentValue || 0), 0);
    
    const totalMortgageDebt = properties.reduce((sum, prop) => sum + (prop.mortgage || 0), 0);
    const netEquity = totalAssetValue - totalMortgageDebt;
    
    const totalRevenue = revenue.reduce((sum, doc) => sum + (doc.amountPaid || 0), 0);
    
    // Reverted: Calculate all expenses, regardless of property association.
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
      totalUnits
    };
  }, [properties, revenue, expenses]);

  // Chart data - Last 6 months
  const chartData = useMemo(() => {
    const monthsData: Record<string, { month: string; revenue: number; expenses: number }> = {};
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthsData[monthKey] = {
        month: date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
        revenue: 0,
        expenses: 0,
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

    return Object.values(monthsData);
  }, [revenue, expenses]);
  
  // Profit per property data
  const profitPerProperty = useMemo(() => {
      return properties.map(prop => {
          const propRevenue = revenue
              .filter(r => r.propertyId === prop.id)
              .reduce((sum, r) => sum + (r.amountPaid || 0), 0);
          
          const propExpenses = expenses
              .filter(e => e.propertyId === prop.id)
              .reduce((sum, e) => sum + (e.amount || 0), 0);
          
          return {
              name: `${prop.addressLine1}, ${prop.city}`,
              profit: propRevenue - propExpenses,
          };
      });
  }, [properties, revenue, expenses]);


  return (
    <>
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        description={`Welcome back, ${user?.displayName || user?.email || 'User'}!`}
      />

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <KpiCard
          icon={Building}
          title="Total Properties"
          value={metrics.totalProperties}
          description={`${metrics.totalUnits} unit(s) across portfolio`}
          formatAs="integer"
        />

        <KpiCard
          icon={Percent}
          title="Occupancy Rate"
          value={metrics.occupancyRate}
          description={`${metrics.tenanciesCount} active tenanc(ies)`}
          formatAs="percent"
        />
        
        <KpiCard
          icon={TrendingDown}
          title="Total Expenses"
          value={metrics.totalExpenses}
          description="Cumulative from all properties"
          variant="destructive"
        />

        <KpiCard
          icon={AlertCircle}
          title="Overdue Payments"
          value={metrics.totalArrearsAmount}
          description="Total outstanding arrears"
          variant="destructive"
        />
        
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
          icon={TrendingUp}
          title="Net Profit"
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
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 gap-8">
        <AreaChart data={chartData} />
        <HorizontalBarChart data={profitPerProperty} />
      </div>
    </>
  );
}
