'use client';

import { useDataContext } from '@/context/data-context';
import { useUser } from '@/firebase';
import { Building, Users, TrendingUp, TrendingDown, Loader2, AlertCircle, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { user, isAuthLoading: authLoading } = useUser();
  const { properties, revenue, expenses, isLoading: dataLoading, settings } = useDataContext();
  const { locale, currency } = settings;

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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Properties</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalProperties}</div>
            <p className="text-xs text-muted-foreground">Total properties</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tenants</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tenanciesCount}</div>
            <p className="text-xs text-muted-foreground">Active tenancies</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue, locale, currency)}</div>
            <p className="text-xs text-muted-foreground">All-time total</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses, locale, currency)}</div>
            <p className="text-xs text-muted-foreground">All-time total</p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Asset Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalAssetValue, locale, currency)}</div>
            <p className="text-xs text-muted-foreground">Total property value</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={cn("text-2xl font-bold", netIncome >= 0 ? 'text-accent-foreground' : 'text-destructive')}>
              {formatCurrency(netIncome, locale, currency)}
            </div>
            <p className="text-xs text-muted-foreground">Revenue - Expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Arrears</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{arrearsCount}</div>
            <p className="text-xs text-muted-foreground">Overdue payments</p>
          </CardContent>
        </Card>
      </div>

      {/* Empty State */}
      {totalProperties === 0 && !dataLoading && (
        <Card className="text-center p-8">
          <CardContent>
            <Building className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No properties yet</h3>
            <p className="text-muted-foreground mb-4">
              Get started by adding your first property
            </p>
            <Button asChild>
              <Link href="/properties">Add Property</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </>
  );
}
