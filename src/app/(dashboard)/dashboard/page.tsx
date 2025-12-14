
'use client';

import React, { useMemo, memo } from 'react';
import { useDataContext } from '@/context/data-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/currency-formatter'; // Corrected import path
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Property, RevenueTransaction, Expense, Tenancy } from '@/lib/db-types'; // Updated imports

const DashboardPage = memo(function DashboardPage() {
  const { properties, revenue, expenses, tenancies, settings, loading } = useDataContext();
  const locale = settings?.dateFormat || 'en-KE'; // Using dateFormat as a proxy for locale
  const currency = settings?.currency || 'KES';
  const companyName = settings?.companyName || 'My Company';

  const metrics = useMemo(() => {
    if (loading) return null;

    // Calculate total revenue from paid transactions
    const totalRevenue = revenue
      .filter(tx => tx.status === 'Paid')
      .reduce((sum, tx) => sum + tx.amount, 0);

    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Calculate profit
    const profit = totalRevenue - totalExpenses;

    // Calculate occupancy rate
    const occupiedProperties = new Set(tenancies.filter(t => t.status === 'Active').map(t => t.propertyId));
    const occupancyRate = properties.length > 0 ? (occupiedProperties.size / properties.length) * 100 : 0;

    // Calculate average rent per active tenancy
    const activeTenancies = tenancies.filter(t => t.status === 'Active');
    const totalRentOfActiveTenancies = activeTenancies.reduce((sum, t) => sum + t.rentAmount, 0);
    const avgRentPerTenancy = activeTenancies.length > 0 ? totalRentOfActiveTenancies / activeTenancies.length : 0;

    return {
      totalRevenue,
      totalExpenses,
      profit,
      occupancyRate,
      avgRentPerTenancy,
      totalProperties: properties.length,
    };
  }, [revenue, expenses, properties, tenancies, loading]);

  if (loading) {
    return (
      <>
        <PageHeader title={`Welcome back, ${companyName}!`} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
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
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(metrics.totalRevenue, locale, currency)}
                </div>
                <p className="text-xs text-muted-foreground">All time (paid)</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(metrics.totalExpenses, locale, currency)}
                </div>
                <p className="text-xs text-muted-foreground">All time</p>
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
                <p className="text-xs text-muted-foreground">Revenue - Expenses</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Occupancy Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.occupancyRate.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground">Based on active tenancies</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Rent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(metrics.avgRentPerTenancy, locale, currency)}
                </div>
                <p className="text-xs text-muted-foreground">Per active tenancy</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Summary</CardTitle>
                <CardDescription>Year-to-date overview</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Revenue</span>
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
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>Key indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Occupancy Rate</span>
                    <span className="font-semibold">{metrics.occupancyRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Properties</span>
                    <span className="font-semibold">{metrics.totalProperties}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg Rent/Tenancy</span>
                    <span className="font-semibold">{formatCurrency(metrics.avgRentPerTenancy, locale, currency)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Your Properties</CardTitle>
              <CardDescription>Manage and view your properties</CardDescription>
            </CardHeader>
            <CardContent>
              {properties.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">No properties yet. Get started by adding your first property.</p>
                  <Link href="/properties" className="inline-flex items-center gap-2 text-primary hover:underline">
                    Add Property <ArrowRight className="h-4 w-4" />
                  </Link>
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
