'use client';

import { useDataContext } from '@/context/data-context';
import { useUser } from '@/firebase';
import { Building, Users, TrendingUp, TrendingDown, Loader2, AlertCircle, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
  const { user, isAuthLoading: authLoading } = useUser();
  const { properties, revenue, expenses, isLoading: dataLoading } = useDataContext();

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

  const totalProperties = properties.length;
  const totalAssetValue = properties.reduce((sum, prop) => sum + (prop.currentValue || 0), 0);
  
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
  const arrearsCount = 0; // Simplified for now

  return (
    <>
      <PageHeader title="Dashboard">
        <p className="text-sm text-muted-foreground hidden sm:block">
            Welcome back, {user?.displayName || user?.email || 'User'}!
        </p>
      </PageHeader>

      {/* Main Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground">Properties</h3>
            <Building className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold text-foreground">{totalProperties}</p>
          <p className="text-sm text-muted-foreground">Total properties</p>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground">Tenants</h3>
            <Users className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold text-foreground">{tenanciesCount}</p>
          <p className="text-sm text-muted-foreground">Active tenancies</p>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground">Revenue</h3>
            <TrendingUp className="h-5 w-5 text-green-500" />
          </div>
          <p className="text-3xl font-bold text-foreground">KES {totalRevenue.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Total revenue all-time</p>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground">Expenses</h3>
            <TrendingDown className="h-5 w-5 text-red-500" />
          </div>
           <p className="text-3xl font-bold text-foreground">KES {totalExpenses.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Total expenses all-time</p>
        </div>
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground">Asset Value</h3>
            <DollarSign className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-2xl font-bold text-foreground">KES {totalAssetValue.toLocaleString()}</p>
          <p className="text-sm text-muted-foreground">Total property value</p>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground">Net Income</h3>
            <TrendingUp className="h-5 w-5 text-primary" />
          </div>
          <p className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            KES {netIncome.toLocaleString()}
          </p>
          <p className="text-sm text-muted-foreground">Revenue - Expenses</p>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-foreground">Arrears</h3>
            <AlertCircle className="h-5 w-5 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-foreground">{arrearsCount}</p>
          <p className="text-sm text-muted-foreground">Overdue payments</p>
        </div>
      </div>

      {/* Empty State */}
      {totalProperties === 0 && !dataLoading && (
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
