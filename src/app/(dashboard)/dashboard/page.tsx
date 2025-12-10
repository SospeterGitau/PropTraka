
'use client';

import React, { useMemo, memo } from 'react';
import { useDataContext } from '@/context/data-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import type { Expense } from '@/lib/types';

const DashboardPage = memo(function DashboardPage() {
  const { properties, revenue, expenses: expensesData, settings, loading } = useDataContext();
  const locale = settings?.locale || 'en-KE';
  const currency = settings?.currency || 'KES';
  const companyName = settings?.companyName || 'My Company';
  const expenses = expensesData as Expense[];

  const metrics = useMemo(() => {
    if (loading) return null;

    // Calculate total revenue
    const totalRevenue = revenue.reduce((sum, tx) => {
      const serviceChargesTotal = (tx.serviceCharges || []).reduce((scSum, sc) => scSum + sc.amount, 0);
      return sum + (tx.rent || 0) + serviceChargesTotal + (tx.deposit || 0);
    }, 0);

    // Calculate total expenses
    const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

    // Calculate profit
    const profit = totalRevenue - totalExpenses;

    // Calculate occupancy rate (number of active tenancies / number of properties)
    const occupancyRate = properties.length > 0 
      ? ((revenue.filter(tx => tx.tenancyId).length) / (properties.length * 12)) * 100 
      : 0;

    // Calculate average rent per property
    const avgRentPerProperty = properties.length > 0 
      ? revenue.reduce((sum, tx) => sum + (tx.rent || 0), 0) / properties.length 
      : 0;

    return {
      totalRevenue,
      totalExpenses,
      profit,
      occupancyRate: Math.min(100, occupancyRate),
      avgRentPerProperty,
      totalProperties: properties.length,
    };
  }, [revenue, expenses, properties, loading]);

  if (loading) {
    return (
      <>
        <PageHeader title={`Welcome back, ${companyName}!`} />
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
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
                <p className="text-xs text-muted-foreground">All time</p>
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
                <CardTitle className="text-sm font-medium">Properties</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.totalProperties}</div>
                <p className="text-xs text-muted-foreground">Total managed</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Rent/Property</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(metrics.avgRentPerProperty, locale, currency)}
                </div>
                <p className="text-xs text-muted-foreground">Per property</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
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
                    <span className="text-sm text-muted-foreground">Avg Rent/Property</span>
                    <span className="font-semibold">{formatCurrency(metrics.avgRentPerProperty, locale, currency)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
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
                      <h3 className="font-semibold">{property.addressLine1}</h3>
                      <p className="text-sm text-muted-foreground">{property.city}, {property.county}</p>
                      <p className="text-sm font-medium mt-2">
                        {formatCurrency(property.monthly_rent || 0, locale, currency)}/month
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
