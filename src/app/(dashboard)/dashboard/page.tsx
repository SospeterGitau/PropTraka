
'use client';

import React, { useMemo, memo } from 'react';
import { useDataContext } from '@/context/data-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/currency-formatter';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button'; // ADDED THIS IMPORT
import type { Property, RevenueTransaction, Expense, Tenancy } from '@/lib/db-types';

const DashboardPage = memo(function DashboardPage() {
  const { properties, revenue, expenses, tenancies, settings, loading } = useDataContext();
  const locale = settings?.dateFormat || 'en-KE';
  const currency = settings?.currency || 'KES';
  const companyName = settings?.companyName || 'My Company';

  const metrics = useMemo(() => {
    if (loading) return null;

    // Financial KPIs
    const totalRevenue = revenue
      .filter(tx => tx.status === 'Paid')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const profit = totalRevenue - totalExpenses;

    const totalArrears = revenue
      .filter(tx => tx.status === 'Overdue')
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Property KPIs
    const totalPropertyValue = properties.reduce((sum, p) => sum + (p.currentValue || 0), 0);
    const totalMortgageBalance = properties.reduce((sum, p) => sum + (p.mortgageBalance || 0), 0);
    const portfolioNetWorth = totalPropertyValue - totalMortgageBalance;

    // Occupancy & Rent KPIs
    const occupiedProperties = new Set(tenancies.filter(t => t.status === 'Active').map(t => t.propertyId));
    const occupancyRate = properties.length > 0 ? (occupiedProperties.size / properties.length) * 100 : 0;

    const activeTenancies = tenancies.filter(t => t.status === 'Active');
    const totalRentOfActiveTenancies = activeTenancies.reduce((sum, t) => sum + t.rentAmount, 0);
    const avgRentPerTenancy = activeTenancies.length > 0 ? totalRentOfActiveTenancies / activeTenancies.length : 0;

    return {
      totalRevenue,
      totalExpenses,
      profit,
      totalArrears,
      totalPropertyValue,
      portfolioNetWorth,
      occupancyRate,
      avgRentPerTenancy,
      totalProperties: properties.length,
    };
  }, [revenue, expenses, properties, tenancies, loading]);

  if (loading) {
    return (
      <>
        <PageHeader title={`Welcome back, ${companyName}!`} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={`Welcome back, ${companyName}!`} />

      {metrics && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Property Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(metrics.totalPropertyValue, locale, currency)}
                </div>
                <p className="text-xs text-muted-foreground">Estimated current value</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Portfolio Net Worth</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(metrics.portfolioNetWorth, locale, currency)}
                </div>
                <p className="text-xs text-muted-foreground">Value - Mortgage</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Net Profit</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${metrics.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(metrics.profit, locale, currency)}
                </div>
                <p className="text-xs text-muted-foreground">Paid Revenue - Expenses</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Arrears</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">
                  {formatCurrency(metrics.totalArrears, locale, currency)}
                </div>
                <p className="text-xs text-muted-foreground">Outstanding balance</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
                <CardDescription>All-time performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Paid Revenue</span>
                    <span className="font-semibold">{formatCurrency(metrics.totalRevenue, locale, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Expenses</span>
                    <span className="font-semibold">{formatCurrency(metrics.totalExpenses, locale, currency)}</span>
                  </div>
                  <div className="border-t pt-4 flex justify-between">
                    <span className="text-sm font-medium">Net Profit</span>
                    <span className={`font-bold ${metrics.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(metrics.profit, locale, currency)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Occupancy & Rent</CardTitle>
                <CardDescription>Current operational metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Occupancy Rate</span>
                    <span className="font-semibold">{metrics.occupancyRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Properties</span>
                    <span className="font-semibold">{metrics.totalProperties}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg. Rent per Tenancy</span>
                    <span className="font-semibold">{formatCurrency(metrics.avgRentPerTenancy, locale, currency)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 lg:col-span-1">
              <CardHeader>
                <CardTitle>Quick Links</CardTitle>
                <CardDescription>Navigate to key sections</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Button variant="outline" asChild><Link href="/revenue">View Revenue</Link></Button>
                <Button variant="outline" asChild><Link href="/expenses">View Expenses</Link></Button>
                <Button variant="outline" asChild><Link href="/properties">View Properties</Link></Button>
                <Button variant="outline" asChild><Link href="/maintenance">View Maintenance</Link></Button>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Your Properties</CardTitle>
              <CardDescription>A snapshot of your property portfolio</CardDescription>
            </CardHeader>
            <CardContent>
              {properties.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No properties yet. Get started by adding your first property.</p>
                  <Button asChild>
                    <Link href="/properties/add">Add Property</Link>
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {properties.slice(0, 6).map((property) => (
                    <Link
                      key={property.id}
                      href={`/properties/${property.id}`}
                      className="p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <h3 className="font-semibold">{property.name}</h3>
                      <p className="text-sm text-muted-foreground">{property.address.street}, {property.address.city}</p>
                      <p className="text-sm font-medium mt-2">
                        {formatCurrency(property.targetRent || 0, locale, currency)}/month
                      </p>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
});

export default DashboardPage;
