
'use client';

import React, { useMemo, memo, useState, useEffect } from 'react';
import { useDataContext } from '@/context/data-context';
import { useUser } from '@/firebase/auth';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/currency-formatter';
import Link from 'next/link';
import { ArrowRight, TrendingUp, TrendingDown, AlertCircle, Building, Users, Calendar, Percent, DollarSign, BarChart3, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Property, RevenueTransaction, Expense, Tenancy } from '@/lib/types';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { AreaChart } from '@/components/dashboard/area-chart';
import { HorizontalBarChart } from '@/components/dashboard/horizontal-bar-chart';
import { CurrencyIcon } from '@/components/currency-icon';
import { HealthCheckSection } from '@/components/dashboard/health-check-section';
import { startOfToday, isBefore } from 'date-fns';

import { generateHealthInsights } from '@/ai/flows/generate-health-insights';
import { fetchMLPrediction } from '@/app/actions';

// ML Predictions Component
function MLPredictionsPanel() {
  const { properties } = useDataContext();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [priceResult, setPriceResult] = useState<any>(null);
  const [demandResult, setDemandResult] = useState<any>(null);
  const [roiResult, setRoiResult] = useState<any>(null);
  const [comparisonResults, setComparisonResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  // showComparison state removed as we are using Tabs now

  // Default to first property
  useEffect(() => {
    if (properties.length > 0 && !selectedProperty) {
      setSelectedProperty(properties[0]);
    }
  }, [properties, selectedProperty]);

  // Cloud Function Caller via Server Action
  const callCloudFunction = async (functionName: string, data: any) => {
    try {
      setLoading(true);
      setError('');

      const result = await fetchMLPrediction(functionName, data);
      return result;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMsg);
      console.error(`Error calling ${functionName}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Prediction Handlers
  const handlePredictPrice = async () => {
    if (!selectedProperty) return;

    // Calculate SQM from size if available, assuming size might be in sqft or undefined
    let sqm = 100; // Default
    if (selectedProperty.size) {
      if (selectedProperty.sizeUnit === 'sqft') {
        sqm = Math.round(selectedProperty.size * 0.092903);
      } else {
        sqm = selectedProperty.size;
      }
    } else if (selectedProperty.squareFootage) {
      sqm = Math.round(selectedProperty.squareFootage * 0.092903);
    }

    const payload = {
      location: selectedProperty.address?.city || 'Nairobi',
      propertyType: selectedProperty.type || 'Residential',
      bedrooms: selectedProperty.bedrooms || 2,
      sqm: sqm,
      currentPrice: selectedProperty.currentValue || 1000000,
    };

    const result = await callCloudFunction('predictPrice', payload);
    if (result) setPriceResult(result);
  };

  const handleAnalyzeDemand = async () => {
    if (!selectedProperty) return;

    const payload = {
      location: selectedProperty.address?.city || 'Nairobi',
      propertyType: selectedProperty.type || 'Residential',
      targetRent: selectedProperty.targetRent || 15000,
      bedrooms: selectedProperty.bedrooms || 2,

    };

    const result = await callCloudFunction('analyzeDemand', payload);
    if (result) setDemandResult(result);
  };

  const handleCalculateROI = async () => {
    if (!selectedProperty) return;

    const payload = {
      propertyValue: selectedProperty.currentValue || 1000000,
      monthlyRent: selectedProperty.targetRent || 15000, // Backend expects monthly
      annualExpenses: 2000, // Placeholder
      investmentYears: 5,
    };

    const result = await callCloudFunction('calculateROI', payload);
    if (result) setRoiResult(result);
  };

  const handleCompareProperties = async () => {
    if (properties.length < 2) {
      setError('Need at least 2 properties to compare');
      return;
    }

    setLoading(true);
    const results = [];
    const propertiesToCompare = properties.slice(0, 3); // Top 3

    for (const prop of propertiesToCompare) {
      const roiData = await callCloudFunction('calculateROI', {
        propertyValue: prop.currentValue || 1000000,
        monthlyRent: (prop.targetRent || 15000), // Backend expects monthly
        annualExpenses: 2000,
        investmentYears: 5,
        // Optional params backend accepts
        downPaymentPercent: 20,
        loanInterestRate: 12.5
      });
      if (roiData) {
        results.push({
          property_name: `${prop.name}`,
          ...roiData
        });
      }
    }

    setComparisonResults(results);
    setLoading(false);
  };

  if (properties.length === 0) {
    return (
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>ML Predictions & Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">No properties found. Please add properties to your portfolio first.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 mb-4">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">Predictions and Analysis</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          AI-powered insights to optimise your portfolio performance and forecast market trends.
        </p>
      </div>

      <Tabs defaultValue="price" className="w-full">
        <div className="flex items-center justify-between mb-4 bg-muted/40 p-1 rounded-lg">
          <TabsList className="bg-transparent">
            <TabsTrigger value="price" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <TrendingUp className="w-4 h-4 mr-2" />
              Price
            </TabsTrigger>
            <TabsTrigger value="demand" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Users className="w-4 h-4 mr-2" />
              Demand
            </TabsTrigger>
            <TabsTrigger value="roi" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Percent className="w-4 h-4 mr-2" />
              % ROI
            </TabsTrigger>
            <TabsTrigger value="compare" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <BarChart3 className="w-4 h-4 mr-2" />
              Compare
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Common Property Selector for individual analysis tabs */}
        <div className="mb-6">
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md mb-4">
              {error}
            </div>
          )}

          <TabsContent value="price" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Price Prediction</CardTitle>
                <CardDescription>Forecast future property value based on market trends.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Select Property</label>
                      <select
                        value={selectedProperty?.id || ''}
                        onChange={(e) => {
                          const prop = properties.find(p => p.id === e.target.value);
                          setSelectedProperty(prop || null);
                          setPriceResult(null);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-background text-foreground"
                      >
                        {properties.map(prop => (
                          <option key={prop.id} value={prop.id}>{prop.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handlePredictPrice} disabled={loading || !selectedProperty} className="w-full">
                        {loading ? 'Analyzing...' : 'Predict Future Price'}
                      </Button>
                    </div>
                  </div>

                  {priceResult && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
                        <p className="text-sm text-muted-foreground">Predicted Price (5 Years)</p>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                          {formatCurrency(priceResult.predicted_price, 'KES', 'en-KE')}
                        </p>
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Current Value</p>
                        <p className="text-xl font-semibold mt-1">
                          {formatCurrency(selectedProperty?.currentValue || 0, 'KES', 'en-KE')}
                        </p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-900">
                        <p className="text-sm text-muted-foreground">Appreciation</p>
                        <p className="text-xl font-bold text-green-600 mt-1">
                          +{priceResult.appreciation_percentage?.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="demand" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Market Demand Analysis</CardTitle>
                <CardDescription>Analyze rental demand and optimize pricing.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Select Property</label>
                      <select
                        value={selectedProperty?.id || ''}
                        onChange={(e) => {
                          const prop = properties.find(p => p.id === e.target.value);
                          setSelectedProperty(prop || null);
                          setDemandResult(null);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-background text-foreground"
                      >
                        {properties.map(prop => (
                          <option key={prop.id} value={prop.id}>{prop.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleAnalyzeDemand} disabled={loading || !selectedProperty} className="w-full bg-green-600 hover:bg-green-700 text-white">
                        {loading ? 'Analyzing...' : 'Analyze Market Demand'}
                      </Button>
                    </div>
                  </div>

                  {demandResult && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-900">
                        <p className="text-sm text-muted-foreground">Demand Score</p>
                        <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                          {demandResult.demand_score?.toFixed(1)}/10
                        </p>
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Recommended Rent</p>
                        <p className="text-xl font-semibold mt-1">
                          {formatCurrency(demandResult.recommended_rental_rate, 'KES', 'en-KE')}
                        </p>
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Market Status</p>
                        <p className="text-xl font-semibold capitalize mt-1">
                          {demandResult.market_status}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="roi" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>ROI Calculator</CardTitle>
                <CardDescription>Calculate 5-year return on investment projections.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Select Property</label>
                      <select
                        value={selectedProperty?.id || ''}
                        onChange={(e) => {
                          const prop = properties.find(p => p.id === e.target.value);
                          setSelectedProperty(prop || null);
                          setRoiResult(null);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-background text-foreground"
                      >
                        {properties.map(prop => (
                          <option key={prop.id} value={prop.id}>{prop.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button onClick={handleCalculateROI} disabled={loading || !selectedProperty} className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                        {loading ? 'Calculating...' : 'Calculate 5-Year ROI'}
                      </Button>
                    </div>
                  </div>

                  {roiResult && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-900">
                        <p className="text-sm text-muted-foreground">Total ROI (5 Years)</p>
                        <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                          {roiResult.total_roi_percentage?.toFixed(1)}%
                        </p>
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Net Return</p>
                        <p className="text-xl font-semibold text-green-600 mt-1">
                          +{formatCurrency(roiResult.total_return, 'KES', 'en-KE')}
                        </p>
                      </div>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm text-muted-foreground">Annual Yield</p>
                        <p className="text-xl font-semibold mt-1">
                          {roiResult.annual_yield_percentage?.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="compare" className="mt-0">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Property Comparison</CardTitle>
                  <CardDescription>Compare performance metrics across your portfolio.</CardDescription>
                </div>
                <Button onClick={handleCompareProperties} disabled={loading}>
                  {loading ? 'Comparing...' : 'Refresh Comparison'}
                </Button>
              </CardHeader>
              <CardContent>
                {comparisonResults.length > 0 ? (
                  <div className="overflow-x-auto rounded-md border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="px-4 py-3 text-left font-semibold">Property</th>
                          <th className="px-4 py-3 text-left font-semibold">Investment</th>
                          <th className="px-4 py-3 text-left font-semibold">Total ROI</th>
                          <th className="px-4 py-3 text-left font-semibold">Annual ROI</th>
                          <th className="px-4 py-3 text-left font-semibold">Break-even</th>
                          <th className="px-4 py-3 text-left font-semibold">Risk</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {comparisonResults.map((result: any, idx: number) => (
                          <tr key={idx} className="hover:bg-muted/20">
                            <td className="px-4 py-3 font-medium">{result.property_name}</td>
                            <td className="px-4 py-3">{formatCurrency(result.initial_investment || 0, 'KES', 'en-KE')}</td>
                            <td className="px-4 py-3 font-bold text-green-600">{result.roi_percentage}</td>
                            <td className="px-4 py-3 text-blue-600">{result.annual_roi}%</td>
                            <td className="px-4 py-3">{result.break_even_months} months</td>
                            <td className={`px-4 py-3 font-semibold ${result.risk_level === 'LOW' ? 'text-green-600' : result.risk_level === 'MEDIUM' ? 'text-yellow-600' : 'text-red-600'}`}>
                              {result.risk_level}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <BarChart3 className="h-12 w-12 text-muted-foreground mb-4 opacity-20" />
                    <p className="text-lg font-medium">No comparison data visible</p>
                    <p className="text-muted-foreground text-sm max-w-sm mt-2">
                      Click the button above to generate a comparison of your top performing properties.
                    </p>
                    <Button variant="secondary" onClick={handleCompareProperties} className="mt-4">
                      Start Comparison
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

const DashboardPage = memo(function DashboardPage() {
  const { properties, revenue, expenses, tenancies, settings, loading } = useDataContext();
  const { user } = useUser();
  const locale = settings?.dateFormat || 'en-KE';
  const currency = settings?.currency || 'KES';
  const companyName = settings?.companyName || 'My Company';

  const toDate = (d: any) => d && typeof d.toDate === 'function' ? d.toDate() : d ? new Date(d) : new Date();

  const [aiInsights, setAiInsights] = useState<any>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // Metrics calculation kept for KPI cards
  const metrics = useMemo(() => {
    if (loading) return null;

    // Financial KPIs
    const totalRevenue = revenue
      .filter(tx => tx.status === 'Paid')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const profit = totalRevenue - totalExpenses;

    const overdueTransactions = revenue.filter(tx => tx.status === 'Overdue');
    const totalArrears = overdueTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    // Count unique properties/tenants in arrears if possible, or just transaction count for now
    const arrearsCount = overdueTransactions.length;

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

    // Current Month Revenue
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const thisMonthRevenue = revenue
      .filter(r => {
        const date = toDate(r.date);
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
      avgRentPerTenancy,
      totalProperties: properties.length,
      activeTenanciesCount: activeTenancies.length,
      thisMonthRevenue,
      arrearsCount,
    };
  }, [revenue, expenses, properties, tenancies, loading]);

  // Fetch AI Insights when metrics are ready
  useEffect(() => {
    if (metrics && properties.length > 0 && !aiInsights && !loadingInsights) {
      setLoadingInsights(true);

      // Diversity Score logic duplicated here to pass to AI, 
      // ideally we'd extract this calculation to a shared utility or calculate it once and pass it down.
      // For now, I'll do a quick calculation or just pass 0 if we want the AI to calculate it?
      // Actually, the InputSchema expects it.
      const types = new Set(properties.map(p => p.type).filter(Boolean));
      const locations = new Set(properties.map(p => p.address?.city).filter(Boolean));
      let diversityScore = 0;
      diversityScore += Math.min(types.size, 3) * 1.5;
      diversityScore += Math.min(locations.size, 3) * 1.5;
      if (properties.length > 4) diversityScore += 1;
      diversityScore = Math.min(Math.round(diversityScore), 10);

      generateHealthInsights({
        occupancyRate: metrics.occupancyRate,
        totalArrears: metrics.totalArrears,
        arrearsCount: metrics.arrearsCount,
        diversityScore,
        propertyCount: metrics.totalProperties
      })
        .then(result => {
          setAiInsights(result);
        })
        .catch(err => {
          console.error("Failed to generate AI insights:", err);
          // setAiInsights(null); // Fallback to static
        })
        .finally(() => {
          setLoadingInsights(false);
        });
    }
  }, [metrics, properties, aiInsights, loadingInsights]);

  // Chart data and profit per property calculation removed as related UI is being removed


  if (loading) {
    return (
      <>
        <PageHeader title={`Welcome back, ${companyName}!`} />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
      <PageHeader title={`Welcome back, ${user?.displayName || companyName}!`} />

      {metrics && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <KpiCard
              icon={Building}
              title="Total Properties"
              value={metrics.totalProperties}
              description={`${metrics.totalProperties} unit(s) across portfolio`}
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


          <div className="mb-0">
            <HealthCheckSection
              occupancyRate={metrics.occupancyRate}
              totalArrears={metrics.totalArrears}
              properties={properties}
              arrearsCount={metrics.arrearsCount}
              aiInsights={aiInsights}
              loadingInsights={loadingInsights}
            />
          </div>

          <div className="mb-8">
            <MLPredictionsPanel />
          </div>
        </>
      )}
    </>
  );
});

export default DashboardPage;
