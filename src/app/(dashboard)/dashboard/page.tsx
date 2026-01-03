'use client';

import React, { useMemo, memo, useState, useEffect } from 'react';
import { useDataContext } from '@/context/data-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/currency-formatter';
import Link from 'next/link';
import { TrendingUp, TrendingDown, AlertCircle, Building, Percent, Calendar, BarChart3, DollarSign, RefreshCw, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Property } from '@/lib/db-types';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { CurrencyIcon } from '@/components/currency-icon';
import { useUser } from '@/firebase';
import { PropertyROIScorecard } from '@/components/dashboard/property-roi-scorecard';
import { ArrearsSummary } from '@/components/dashboard/arrears-summary';

// ML Predictions Component
function MLPredictionsPanel() {
  const { properties, settings } = useDataContext();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [activeTab, setActiveTab] = useState<'price' | 'demand' | 'roi'>('price');

  const [priceResult, setPriceResult] = useState<any>(null);
  const [demandResult, setDemandResult] = useState<any>(null);
  const [roiResult, setRoiResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // User Settings safely retrieved
  const currency = settings?.currency || 'KES';
  const locale = settings?.dateFormat || 'en-KE';

  useEffect(() => {
    if (properties.length > 0 && !selectedProperty) {
      setSelectedProperty(properties[0]);
    }
  }, [properties, selectedProperty]);

  const callCloudFunction = async (functionName: string, data: any) => {
    try {
      setLoading(true);
      setError('');

      // Replace this URL with your actual project ID or dynamic config if needed
      // Current project: studio-4661291525-66fea
      const response = await fetch(
        `https://us-central1-studio-4661291525-66fea.cloudfunctions.net/${functionName}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error(`Function call failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMsg);
      console.error(`Error calling ${functionName}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handlePredictPrice = async () => {
    if (!selectedProperty) return;
    const payload = {
      location: selectedProperty.address?.city || 'Nairobi',
      bedrooms: selectedProperty.bedrooms || 2,
      current_price: selectedProperty.currentValue || 1000000,
      annual_appreciation_rate: 0.05,
    };
    const result = await callCloudFunction('predictPrice', payload);
    if (result) setPriceResult(result);
  };

  const handleAnalyzeDemand = async () => {
    if (!selectedProperty) return;
    const payload = {
      location: selectedProperty.address?.city || 'Nairobi',
      property_type: selectedProperty.type || 'Residential',
      current_rental_rate: selectedProperty.targetRent || 15000,
      market_data: { average_occupancy: 0.85, median_rental_price: 12000 },
    };
    const result = await callCloudFunction('analyzeDemand', payload);
    if (result) setDemandResult(result);
  };

  const handleCalculateROI = async () => {
    if (!selectedProperty) return;
    const payload = {
      initial_investment: selectedProperty.currentValue || 1000000,
      annual_rental_income: (selectedProperty.targetRent || 15000) * 12,
      annual_expenses: 2000, // Placeholder
      mortgage_principal_remaining: selectedProperty.mortgageBalance || 0,
      property_appreciation_rate: 0.05,
      years: 5,
    };
    const result = await callCloudFunction('calculateROI', payload);
    if (result) setRoiResult(result);
  };

  const handleRefresh = () => {
    if (activeTab === 'price') handlePredictPrice();
    else if (activeTab === 'demand') handleAnalyzeDemand();
    else if (activeTab === 'roi') handleCalculateROI();
  };

  if (properties.length === 0) {
    return (
      <Card className="mb-8">
        <CardHeader><CardTitle>AI Predictions</CardTitle></CardHeader>
        <CardContent><p className="text-muted-foreground">Add properties to use AI features.</p></CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-white/20 dark:border-slate-800/50 shadow-xl overflow-hidden">
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            AI Property Insights
            {loading && <RefreshCw className="h-4 w-4 animate-spin text-primary" />}
          </CardTitle>
          <p className="text-sm text-muted-foreground">Real-time market analysis & forecasts</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <select
            value={selectedProperty?.id || ''}
            onChange={(e) => {
              const prop = properties.find(p => p.id === e.target.value);
              setSelectedProperty(prop || null);
              setPriceResult(null);
              setDemandResult(null);
              setRoiResult(null);
            }}
            className="px-3 py-2 border rounded-md bg-background text-sm w-full md:w-64"
          >
            {properties.map(prop => (
              <option key={prop.id} value={prop.id}>{prop.name}</option>
            ))}
          </select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={loading || !selectedProperty}
            className="w-full sm:w-auto"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Analysis
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Tabs Navigation */}
        <div className="flex border-b overflow-x-auto">
          {[
            { id: 'price', label: 'Price Forecast', icon: TrendingUp },
            { id: 'demand', label: 'Demand Analysis', icon: BarChart3 },
            { id: 'roi', label: 'ROI Calculator', icon: DollarSign },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isActive
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="min-h-[200px]">
          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {activeTab === 'price' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              {!priceResult ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Predict value appreciation over the next 5 years.</p>
                  <Button onClick={handlePredictPrice} disabled={loading}>Run Prediction</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                    <p className="text-sm text-muted-foreground">Predicted 5-Year Value</p>
                    <p className="text-3xl font-bold text-primary">
                      {formatCurrency(priceResult.predicted_price, currency, locale)}
                    </p>
                    <p className="text-sm text-green-600 mt-1 flex items-center">
                      <TrendingUp className="h-4 w-4 mr-1" />
                      +{priceResult.appreciation_percentage?.toFixed(1)}% Appreciation
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current Value</span>
                      <span className="font-semibold">{formatCurrency(selectedProperty?.currentValue || 0, currency, locale)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Confidence</span>
                      <span className="font-semibold">85%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'demand' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              {!demandResult ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Analyze market demand and rental rates.</p>
                  <Button onClick={handleAnalyzeDemand} disabled={loading}>Analyze Market</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-sm text-muted-foreground">Market Demand Score</p>
                    <p className="text-3xl font-bold text-green-600">
                      {demandResult.demand_score?.toFixed(1)}/10
                    </p>
                    <p className="text-sm text-muted-foreground mt-1 capitalize">
                      {demandResult.market_status} Market
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Rec. Rent</span>
                      <span className="font-semibold">{formatCurrency(demandResult.recommended_rental_rate, currency, locale)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Occupancy Avg</span>
                      <span className="font-semibold">{(demandResult.market_data?.average_occupancy * 100)?.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'roi' && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              {!roiResult ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground mb-4">Calculate Return on Investment metrics.</p>
                  <Button onClick={handleCalculateROI} disabled={loading}>Calculate ROI</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800">
                    <p className="text-sm text-muted-foreground">Total 5-Year ROI</p>
                    <p className="text-3xl font-bold text-purple-600">
                      {roiResult.total_roi_percentage?.toFixed(1)}%
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Annual Yield: {roiResult.annual_yield_percentage?.toFixed(1)}%
                    </p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total Profit</span>
                      <span className="font-semibold text-green-600">{formatCurrency(roiResult.total_return, currency, locale)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Break-even</span>
                      <span className="font-semibold">Month {roiResult.break_even_months}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

const DashboardPage = memo(function DashboardPage() {
  const { properties, revenue, expenses, tenancies, settings, loading } = useDataContext();
  const { user } = useUser();
  const locale = settings?.dateFormat || 'en-KE';
  const currency = settings?.currency || 'KES';

  const metrics = useMemo(() => {
    if (loading) return null;

    const totalRevenue = revenue
      .filter(tx => tx.status === 'Paid')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const profit = totalRevenue - totalExpenses;

    const totalArrears = revenue
      .filter(tx => tx.status === 'Overdue')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalPropertyValue = properties.reduce((sum, p) => sum + (p.currentValue || 0), 0);
    const totalMortgageBalance = properties.reduce((sum, p) => sum + (p.mortgageBalance || 0), 0);
    const portfolioNetWorth = totalPropertyValue - totalMortgageBalance;

    const occupiedProperties = new Set(tenancies.filter(t => t.status === 'Active').map(t => t.propertyId));
    const occupancyRate = properties.length > 0 ? (occupiedProperties.size / properties.length) * 100 : 0;

    const activeTenancies = tenancies.filter(t => t.status === 'Active');

    // Calculate current month revenue
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const thisMonthRevenue = revenue
      .filter(r => {
        const date = r.date ? new Date(r.date) : new Date();
        return r.status === 'Paid' && date.getMonth() === currentMonth && date.getFullYear() === currentYear;
      })
      .reduce((sum, r) => sum + r.amount, 0);

    return {
      totalRevenue,
      totalExpenses,
      profit,
      totalArrears,
      totalPropertyValue,
      portfolioNetWorth,
      occupancyRate,
      totalProperties: properties.length,
      activeTenanciesCount: activeTenancies.length,
      thisMonthRevenue,
    };
  }, [revenue, expenses, properties, tenancies, loading]);

  if (loading) {
    return (
      <>
        <PageHeader title={`Welcome back, ${user?.displayName || settings?.companyName || 'User'}!`} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-4 w-1/2" /></CardHeader>
              <CardContent><Skeleton className="h-8 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title={`Welcome back, ${user?.displayName || settings?.companyName || 'User'}!`} />

      {metrics && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <KpiCard
              icon={Building}
              title="Total Properties"
              value={metrics.totalProperties}
              description="Units in your portfolio"
              formatAs="integer"
            />
            <KpiCard
              icon={Percent}
              title="Occupancy Rate"
              value={metrics.occupancyRate}
              description={`${metrics.activeTenanciesCount} active tenanc(ies)`}
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
              value={metrics.totalArrears}
              description="Total outstanding arrears"
              variant="destructive"
            />
            <KpiCard
              icon={Building}
              title="Portfolio Asset Value"
              value={metrics.totalPropertyValue}
              description="Current combined market value"
            />
            <KpiCard
              icon={CurrencyIcon}
              title="Equity After Mortgages"
              value={metrics.portfolioNetWorth}
              description="Net ownership value"
            />
            <KpiCard
              icon={TrendingUp}
              title="Net Profit"
              value={metrics.profit}
              description="Revenue - Expenses"
              variant={metrics.profit >= 0 ? 'positive' : 'destructive'}
            />
            <KpiCard
              icon={Calendar}
              title="Monthly Revenue (Current)"
              value={metrics.thisMonthRevenue}
              description={`${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}`}
            />
          </div>

          <div className="grid gap-8 md:grid-cols-2 mb-8">
            <Card className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-white/20 dark:border-slate-800/50 shadow-xl">
              <CardContent className="pt-6">
                <PropertyROIScorecard
                  properties={properties.map(p => ({
                    id: p.id,
                    name: p.addressLine1 || `Property ${p.id.slice(0, 4)}`,
                    streetAddress: p.addressLine1,
                    city: p.address.city,
                    currentValue: p.currentValue || p.purchasePrice || 0,
                    revenue: 0,
                    expenses: 0
                  }))}
                  revenue={revenue}
                  expenses={expenses}
                />
              </CardContent>
            </Card>

            <Card className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-white/20 dark:border-slate-800/50 shadow-xl">
              <CardContent className="pt-6">
                <ArrearsSummary revenue={revenue} properties={properties} />
              </CardContent>
            </Card>
          </div>

          <div className="mb-0">
            <MLPredictionsPanel />
          </div>
        </>
      )}
    </>
  );
});

export default DashboardPage;
