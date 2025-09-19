'use client';

import { DollarSign, Building, TrendingUp, TrendingDown, CircleAlert } from 'lucide-react';
import { useDataContext } from '@/context/data-context';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { AreaChartComponent } from '@/components/dashboard/area-chart';
import { BarChartComponent } from '@/components/dashboard/bar-chart';
import { SmartAlerts } from '@/components/dashboard/smart-alerts';
import { PageHeader } from '@/components/page-header';

export default function DashboardPage() {
  const { properties, revenue, expenses } = useDataContext();

  const totalPropertyValue = properties.reduce((acc, p) => acc + p.currentValue, 0);
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

  const totalProfit = totalRevenue - totalExpenses;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <>
      <PageHeader title="Dashboard" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <KpiCard
          icon={Building}
          title="Total Property Value"
          value={formatCurrency(totalPropertyValue)}
          description="Current market value of all assets"
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
          icon={DollarSign}
          title="Profit"
          value={formatCurrency(totalProfit)}
          description="This month"
        />
        <KpiCard
          icon={CircleAlert}
          title="Arrears"
          value={formatCurrency(totalArrears)}
          description="Total outstanding payments"
        />
      </div>
      <div className="grid gap-4 mt-4 grid-cols-1 lg:grid-cols-2">
        <AreaChartComponent revenue={revenue} expenses={expenses} />
        <BarChartComponent properties={properties} revenue={revenue} expenses={expenses} />
        <SmartAlerts />
      </div>
    </>
  );
}
