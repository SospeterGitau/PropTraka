'use client';

import { useMemo, useState, useEffect } from 'react';
import { useDataContext } from '@/context/data-context';
import { useUser } from '@/firebase';
import { 
  Building, 
  TrendingUp, 
  TrendingDown, 
  Users,
  Calendar, 
  Percent, 
  AlertCircle,
  BarChart3,
  DollarSign
} from 'lucide-react';
import { CurrencyIcon } from '@/components/currency-icon';
import { PageHeader } from '@/components/page-header';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { AreaChart } from '@/components/dashboard/area-chart';
import { HorizontalBarChart } from '@/components/dashboard/horizontal-bar-chart';
import { startOfToday, isBefore } from 'date-fns';
import type { Transaction } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

// ML Predictions Component
function MLPredictionsPanel() {
  const { properties } = useDataContext();
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [priceResult, setPriceResult] = useState<any>(null);
  const [demandResult, setDemandResult] = useState<any>(null);
  const [roiResult, setRoiResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Debug log
  useEffect(() => {
    console.log('Properties loaded:', properties);
    console.log('Properties count:', properties.length);
  }, [properties]);

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
        `https://us-central1-studio-6577669797-1b758.cloudfunctions.net/${functionName}`,
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
      location: selectedProperty.city || 'Nairobi',
      bedrooms: selectedProperty.bedrooms || 2,
      current_price: selectedProperty.property_value || 1000000,
      annual_appreciation_rate: 0.05,
    };

    const result = await callCloudFunction('predictPrice', payload);
    if (result) {
      setPriceResult(result);
    }
  };

  const handleAnalyzeDemand = async () => {
    if (!selectedProperty) return;

    const payload = {
      location: selectedProperty.city || 'Nairobi',
      property_type: selectedProperty.property_type || 'Residential',
      current_rental_rate: selectedProperty.monthly_rent || 15000,
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

    const payload = {
      initial_investment: selectedProperty.property_value || 1000000,
      annual_rental_income: (selectedProperty.monthly_rent || 15000) * 12,
      annual_expenses: selectedProperty.annual_expenses || 2000,
      mortgage_principal_remaining: selectedProperty.mortgage || 0,
      property_appreciation_rate: 0.05,
      years: 5,
    };

    const result = await callCloudFunction('calculateROI', payload);
    if (result) {
      setRoiResult(result);
    }
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
        <CardHeader>
          <CardTitle>ML Predictions & Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Property</label>
              <select
                value={selectedProperty?.id || ''}
                onChange={(e) => {
                  const prop = properties.find(p => p.id === e.target.value);
                  setSelectedProperty(prop);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {properties.map(prop => (
                  <option key={prop.id} value={prop.id}>
                    {prop.addressLine1}, {prop.city} - KES {prop.property_value?.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>

            {selectedProperty && (
              <div className="bg-gray-50 p-4 rounded-md space-y-2">
                <p><strong>City:</strong> {selectedProperty.city}</p>
                <p><strong>Property Type:</strong> {selectedProperty.property_type}</p>
                <p><strong>Monthly Rent:</strong> KES {selectedProperty.monthly_rent?.toLocaleString()}</p>
                <p><strong>Property Value:</strong> KES {selectedProperty.property_value?.toLocaleString()}</p>
                <p><strong>Annual Expenses:</strong> KES {selectedProperty.annual_expenses?.toLocaleString()}</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md">
                {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Price Forecast
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <button
              onClick={handlePredictPrice}
              disabled={loading || !selectedProperty}
              className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
            >
              {loading ? 'Analyzing...' : 'Predict Price'}
            </button>

            {priceResult && (
              <div className="space-y-2 text-sm">
                <div className="bg-blue-50 p-3 rounded-md">
                  <p className="text-gray-600">Predicted Price (5 Years)</p>
                  <p className="text-2xl font-bold text-blue-600">
                    KES {priceResult.predicted_price?.toLocaleString()}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-xs text-gray-600">Current</p>
                    <p className="font-semibold">KES {selectedProperty.property_value?.toLocaleString()}</p>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <p className="text-xs text-gray-600">Appreciation</p>
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
            <button
              onClick={handleAnalyzeDemand}
              disabled={loading || !selectedProperty}
              className="w-full bg-green-600 text-white py-2 rounded-md hover:bg-green-700 disabled:bg-gray-400"
            >
              {loading ? 'Analyzing...' : 'Analyze Demand'}
            </button>

            {demandResult && (
              <div className="space-y-2 text-sm">
                <div className="bg-green-50 p-3 rounded-md">
                  <p className="text-gray-600">Demand Score</p>
                  <p className="text-2xl font-bold text-green-600">
                    {demandResult.demand_score?.toFixed(1)}/10
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Recommended Rental</span>
                    <span className="font-semibold">KES {demandResult.recommended_rental_rate?.toLocaleString()}</span>
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
            <button
              onClick={handleCalculateROI}
              disabled={loading || !selectedProperty}
              className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 disabled:bg-gray-400"
            >
              {loading ? 'Calculating...' : 'Calculate ROI'}
            </button>

            {roiResult && (
              <div className="space-y-2 text-sm">
                <div className="bg-purple-50 p-3 rounded-md">
                  <p className="text-gray-600">5-Year ROI</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {roiResult.total_roi_percentage?.toFixed(1)}%
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Total Return</span>
                    <span className="font-semibold text-green-600">+KES {roiResult.total_return?.toLocaleString()}</span>
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
    </div>
  );
}

export default function DashboardPageContent() {
  const { user } = useUser();
  const { properties, revenue, expenses, settings } = useDataContext();

  const metrics = useMemo(() => {
    const propertyIds = new Set(properties.map(p => p.id));
    
    const relevantRevenue = revenue.filter(r => r.propertyId && propertyIds.has(r.propertyId));
    const relevantExpenses = expenses.filter(e => e.propertyId && propertyIds.has(e.propertyId));
    const allExpenses = expenses;

    const totalProperties = properties.length;
    const totalAssetValue = properties.reduce((sum, prop) => sum + (prop.currentValue || 0), 0);
    
    const totalMortgageDebt = properties.reduce((sum, prop) => sum + (prop.mortgage || 0), 0);
    const netEquity = totalAssetValue - totalMortgageDebt;
    
    const totalRevenue = relevantRevenue.reduce((sum, doc) => sum + (doc.amountPaid || 0), 0);
    
    const totalExpensesWithProperty = relevantExpenses.reduce((sum, doc) => sum + (doc.amount || 0), 0);
    const totalAllExpenses = allExpenses.reduce((sum, doc) => sum + (doc.amount || 0), 0);

    const netIncome = totalRevenue - totalAllExpenses;

    const tenancies = Object.values(
      relevantRevenue.reduce((acc, tx) => {
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
    const thisMonthRevenue = relevantRevenue
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
      totalExpenses: totalAllExpenses,
      netIncome,
      tenanciesCount,
      occupancyRate,
      thisMonthRevenue,
      totalArrearsAmount,
      totalUnits,
      relevantRevenue,
      relevantExpenses,
    };
  }, [properties, revenue, expenses]);

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

    metrics.relevantRevenue.forEach(r => {
      const date = r.date ? new Date(r.date) : new Date();
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthsData[monthKey]) {
        monthsData[monthKey].revenue += r.amountPaid || 0;
      }
    });

    metrics.relevantExpenses.forEach(e => {
      const date = e.date ? new Date(e.date) : new Date();
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (monthsData[monthKey]) {
        monthsData[monthKey].expenses += e.amount || 0;
      }
    });

    return Object.values(monthsData);
  }, [metrics.relevantRevenue, metrics.relevantExpenses]);
  
  const profitPerProperty = useMemo(() => {
      return properties.map(prop => {
          const propRevenue = metrics.relevantRevenue
              .filter(r => r.propertyId === prop.id)
              .reduce((sum, r) => sum + (r.amountPaid || 0), 0);
          
          const propExpenses = metrics.relevantExpenses
              .filter(e => e.propertyId === prop.id)
              .reduce((sum, e) => sum + (e.amount || 0), 0);
          
          return {
              name: `${prop.addressLine1}, ${prop.city}`,
              profit: propRevenue - propExpenses,
          };
      });
  }, [properties, metrics.relevantRevenue, metrics.relevantExpenses]);

  return (
    <>
      <PageHeader title="Dashboard" />

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

      <div className="mb-8">
        <MLPredictionsPanel />
      </div>
      
      <div className="grid grid-cols-1 gap-8">
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
              <CardTitle>Profit Per Property (All Time)</CardTitle>
            </CardHeader>
            <CardContent>
              <HorizontalBarChart data={profitPerProperty} />
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
