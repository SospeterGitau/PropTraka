
'use client';

import React, { useMemo, memo, useState, useEffect } from 'react';
import { useDataContext } from '@/context/data-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/currency-formatter';
import Link from 'next/link';
import { ArrowRight, TrendingUp, TrendingDown, AlertCircle, Building, Users, Calendar, Percent, DollarSign, BarChart3, BarChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Property, RevenueTransaction, Expense, Tenancy } from '@/lib/types';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { AreaChart } from '@/components/dashboard/area-chart';
import { HorizontalBarChart } from '@/components/dashboard/horizontal-bar-chart';
import { CurrencyIcon } from '@/components/currency-icon';
import { startOfToday, isBefore } from 'date-fns';

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
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    if (properties.length > 0 && !selectedProperty) {
      setSelectedProperty(properties[0]);
    }
  }, [properties, selectedProperty]);

  const callCloudFunction = async (functionName: string, data: any) => {
    try {
      setLoading(true);
      setError('');
      
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
    setShowComparison(false);

    const payload = {
      location: selectedProperty.address?.city || 'Nairobi',
      bedrooms: selectedProperty.bedrooms || 2,
      current_price: selectedProperty.currentValue || 1000000,
      annual_appreciation_rate: 0.05,
    };

    const result = await callCloudFunction('predictPrice', payload);
    if (result) {
      setPriceResult(result);
    }
  };

  const handleAnalyzeDemand = async () => {
    if (!selectedProperty) return;
    setShowComparison(false);

    const payload = {
      location: selectedProperty.address?.city || 'Nairobi',
      property_type: selectedProperty.type || 'Residential',
      current_rental_rate: selectedProperty.targetRent || 15000,
      market_data: {
        average_occupancy: 0.85,
        median_rental_price: 12000,
      },
    };

    const result = await callCloudFunction('analyzeDemand', payload);
    if (result) {
      setDemandResult(result);
    }
  };

  const handleCalculateROI = async () => {
    if (!selectedProperty) return;
    setShowComparison(false);

    const payload = {
      initial_investment: selectedProperty.currentValue || 1000000,
      annual_rental_income: (selectedProperty.targetRent || 15000) * 12,
      annual_expenses: 2000, // Placeholder, ideally from expenses data
      mortgage_principal_remaining: selectedProperty.mortgageBalance || 0,
      property_appreciation_rate: 0.05,
      years: 5,
    };

    const result = await callCloudFunction('calculateROI', payload);
    if (result) {
      setRoiResult(result);
    }
  };

  const handleCompareProperties = async () => {
    if (properties.length < 2) {
      setError('Need at least 2 properties to compare');
      return;
    }

    setLoading(true);
    setShowComparison(true);
    const results = [];
    
    // Compare top 3 properties or all if less than 3
    const propertiesToCompare = properties.slice(0, 3);

    for (const prop of propertiesToCompare) {
      const roiData = await callCloudFunction('calculateROI', {
        initial_investment: prop.currentValue || 1000000,
        annual_rental_income: (prop.targetRent || 15000) * 12,
        annual_expenses: 2000, // Placeholder
        property_appreciation_rate: 0.05,
        years: 5,
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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>ML Predictions & Analysis</CardTitle>
          <Button 
            variant={showComparison ? "default" : "outline"}
            onClick={handleCompareProperties}
            disabled={loading}
          >
            <BarChart className="mr-2 h-4 w-4" />
            Compare Properties
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {!showComparison && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">Select Property</label>
                  <select
                    value={selectedProperty?.id || ''}
                    onChange={(e) => {
                      const prop = properties.find(p => p.id === e.target.value);
                      setSelectedProperty(prop || null);
                      // Reset results when property changes
                      setPriceResult(null);
                      setDemandResult(null);
                      setRoiResult(null);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-background text-foreground"
                  >
                    {properties.map(prop => (
                      <option key={prop.id} value={prop.id}>
                        {prop.name} - {prop.address.city}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedProperty && (
                  <div className="bg-muted p-4 rounded-md space-y-2">
                    <p><strong>City:</strong> {selectedProperty.address.city}</p>
                    <p><strong>Type:</strong> {selectedProperty.type}</p>
                    <p><strong>Target Rent:</strong> {formatCurrency(selectedProperty.targetRent || 0, 'en-KE', 'KES')}</p>
                    <p><strong>Value:</strong> {formatCurrency(selectedProperty.currentValue || 0, 'en-KE', 'KES')}</p>
                  </div>
                )}
              </>
            )}

            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive p-3 rounded-md">
                {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {showComparison ? (
        <Card>
          <CardHeader>
            <CardTitle>Property Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            {comparisonResults.length > 0 ? (
               <div className="overflow-x-auto">
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
                        <td className="px-4 py-3">{formatCurrency(result.initial_investment || 0, 'en-KE', 'KES')}</td>
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
              <div className="text-center py-8">
                 {loading ? <p>Comparing properties...</p> : <p>No comparison data available.</p>}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Price Forecast
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handlePredictPrice}
                disabled={loading || !selectedProperty}
                className="w-full"
              >
                {loading ? 'Analyzing...' : 'Predict Price'}
              </Button>

              {priceResult && (
                <div className="space-y-2 text-sm">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                    <p className="text-muted-foreground">Predicted Price (5 Years)</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(priceResult.predicted_price, 'en-KE', 'KES')}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-muted p-2 rounded">
                      <p className="text-xs text-muted-foreground">Current</p>
                      <p className="font-semibold">{formatCurrency(selectedProperty?.currentValue || 0, 'en-KE', 'KES')}</p>
                    </div>
                    <div className="bg-muted p-2 rounded">
                      <p className="text-xs text-muted-foreground">Appreciation</p>
                      <p className="font-semibold text-green-600">+{priceResult.appreciation_percentage?.toFixed(1)}%</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Demand Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleAnalyzeDemand}
                disabled={loading || !selectedProperty}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? 'Analyzing...' : 'Analyze Demand'}
              </Button>

              {demandResult && (
                <div className="space-y-2 text-sm">
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                    <p className="text-muted-foreground">Demand Score</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {demandResult.demand_score?.toFixed(1)}/10
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Recommended Rental</span>
                      <span className="font-semibold">{formatCurrency(demandResult.recommended_rental_rate, 'en-KE', 'KES')}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Market Status</span>
                      <span className="font-semibold capitalize">{demandResult.market_status}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                ROI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                onClick={handleCalculateROI}
                disabled={loading || !selectedProperty}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {loading ? 'Calculating...' : 'Calculate ROI'}
              </Button>

              {roiResult && (
                <div className="space-y-2 text-sm">
                  <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-md">
                    <p className="text-muted-foreground">5-Year ROI</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {roiResult.total_roi_percentage?.toFixed(1)}%
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>Total Return</span>
                      <span className="font-semibold text-green-600">+{formatCurrency(roiResult.total_return, 'en-KE', 'KES')}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span>Annual Yield</span>
                      <span className="font-semibold">{roiResult.annual_yield_percentage?.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

const DashboardPage = memo(function DashboardPage() {
  const { properties, revenue, expenses, tenancies, settings, loading } = useDataContext();
  const locale = settings?.dateFormat || 'en-KE';
  const currency = settings?.currency || 'KES';
  const companyName = settings?.companyName || 'My Company';

  const toDate = (d: any) => d && typeof d.toDate === 'function' ? d.toDate() : d ? new Date(d) : new Date();

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
    };
  }, [revenue, expenses, properties, tenancies, loading]);

  const chartData = useMemo(() => {
    const monthsData: Record<string, { date: string; revenue: number; expenses: number }> = {};
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthsData[monthKey] = {
        date: date.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
        revenue: 0,
        expenses: 0,
      };
    }

    revenue.filter(r => r.status === 'Paid').forEach(r => {
      const date = toDate(r.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthsData[monthKey]) {
        monthsData[monthKey].revenue += r.amount;
      }
    });

    expenses.forEach(e => {
      const date = toDate(e.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthsData[monthKey]) {
        monthsData[monthKey].expenses += e.amount;
      }
    });

    return Object.values(monthsData);
  }, [revenue, expenses]);

  const profitPerProperty = useMemo(() => {
    return properties.map(prop => {
        const propRevenue = revenue
            .filter(r => r.propertyId === prop.id && r.status === 'Paid')
            .reduce((sum, r) => sum + r.amount, 0);
        
        const propExpenses = expenses
            .filter(e => e.propertyId === prop.id)
            .reduce((sum, e) => sum + e.amount, 0);
        
        return {
            name: `${prop.name}`,
            profit: propRevenue - propExpenses,
        };
    }).sort((a, b) => b.profit - a.profit).slice(0, 5); // Top 5
  }, [properties, revenue, expenses]);


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
      <PageHeader title={`Welcome back, ${companyName}!`} />

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

          <div className="mb-8">
            <MLPredictionsPanel />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Income vs Expenses (Last 6 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <AreaChart data={chartData} />
              </CardContent>
            </Card>
            
            {properties.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Profit Per Property (All Time - Top 5)</CardTitle>
                </CardHeader>
                <CardContent>
                  <HorizontalBarChart data={profitPerProperty} />
                </CardContent>
              </Card>
            )}
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-4">
            <Card className="md:col-span-2 lg:col-span-3">
               <CardHeader>
                <CardTitle>Quick Links</CardTitle>
                <CardDescription>Navigate to key sections</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4">
                <Button variant="outline" asChild><Link href="/revenue">View Revenue</Link></Button>
                <Button variant="outline" asChild><Link href="/expenses">View Expenses</Link></Button>
                <Button variant="outline" asChild><Link href="/properties">View Properties</Link></Button>
                <Button variant="outline" asChild><Link href="/maintenance">View Maintenance</Link></Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </>
  );
});

export default DashboardPage;
