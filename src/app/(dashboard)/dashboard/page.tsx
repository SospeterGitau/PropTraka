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
  DollarSign,
  Loader2,
  Download,
  BarChart,
  BrainCircuit,
  ChevronDown
} from 'lucide-react';
import { CurrencyIcon } from '@/components/currency-icon';
import { PageHeader } from '@/components/page-header';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { AreaChart } from '@/components/dashboard/area-chart';
import { HorizontalBarChart } from '@/components/dashboard/horizontal-bar-chart';
import { startOfToday, isBefore } from 'date-fns';
import type { Transaction, Property } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ML Predictions Component
function MLPredictionsPanel() {
  const { properties, settings } = useDataContext();
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>('');
  const [priceResult, setPriceResult] = useState<any>(null);
  const [demandResult, setDemandResult] = useState<any>(null);
  const [roiResult, setRoiResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('price');

  const selectedProperty = useMemo(() => properties.find(p => p.id === selectedPropertyId), [properties, selectedPropertyId]);

  useEffect(() => {
    if (properties.length > 0 && !selectedPropertyId) {
      setSelectedPropertyId(properties[0].id);
    }
  }, [properties, selectedPropertyId]);

  const callCloudFunction = async (functionName: string, data: any) => {
    try {
      setLoading(true);
      setError('');
      const response = await fetch(
        `https://us-central1-studio-6577669797-1b758.cloudfunctions.net/${functionName}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data }), // Functions expect a 'data' wrapper
        }
      );

      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody.error?.message || `Function call failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result.result; // The actual result is nested
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Error: ${msg}`);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handlePredictPrice = async () => {
    if (!selectedProperty) return;
    const payload = {
      location: selectedProperty.city,
      propertyType: selectedProperty.propertyType,
      bedrooms: selectedProperty.bedrooms,
      sqm: selectedProperty.size,
      currentPrice: selectedProperty.currentValue,
    };
    const result = await callCloudFunction('predictPrice', payload);
    if (result) {
        setPriceResult(result.predictions);
        setActiveTab('price');
    }
  };

  const handleAnalyzeDemand = async () => {
    if (!selectedProperty) return;
    const payload = {
        location: selectedProperty.city,
        propertyType: selectedProperty.propertyType,
        bedrooms: selectedProperty.bedrooms,
        targetRent: selectedProperty.rentalValue
    };
    const result = await callCloudFunction('analyzeDemand', payload);
    if (result) {
        setDemandResult(result.analysis);
        setActiveTab('demand');
    }
  };

  const handleCalculateROI = async () => {
    if (!selectedProperty) return;
    const payload = {
        propertyValue: selectedProperty.currentValue,
        monthlyRent: selectedProperty.rentalValue,
        annualExpenses: 20000, // Placeholder - this should be calculated
        downPaymentPercent: 20,
        loanInterestRate: 12.5,
        investmentYears: 5
    };
    const result = await callCloudFunction('calculateROI', payload);
     if (result) {
        setRoiResult(result.roi);
        setActiveTab('roi');
    }
  };

  const exportToPDF = () => {
    // PDF generation logic would go here
    console.log("Exporting to PDF...");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <CardTitle className="flex items-center gap-2"><BrainCircuit className="h-6 w-6" /> AI Predictions & Analysis</CardTitle>
                <CardDescription className="mt-1">Advanced property investment insights powered by AI.</CardDescription>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-center">
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline"><ChevronDown className="mr-2 h-4 w-4"/> Run Analysis</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={handlePredictPrice} disabled={loading}>Price Forecast</DropdownMenuItem>
                        <DropdownMenuItem onClick={handleAnalyzeDemand} disabled={loading}>Demand Analysis</DropdownMenuItem>
                        <DropdownMenuItem onClick={handleCalculateROI} disabled={loading}>ROI Calculation</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Button variant="outline" size="icon" onClick={exportToPDF}><Download className="h-4 w-4" /></Button>
            </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
            <label className="text-sm font-medium">Select Property for Analysis</label>
             <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a property..." />
                </SelectTrigger>
                <SelectContent>
                    {properties.map(prop => (
                        <SelectItem key={prop.id} value={prop.id}>
                            {prop.addressLine1}, {prop.city} - {formatCurrency(prop.currentValue, settings.locale, settings.currency)}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>

        {error && ( <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 text-destructive-foreground text-sm">⚠️ {error}</div> )}

        {loading ? (
             <div className="flex items-center justify-center py-12">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                    <p className="text-muted-foreground font-medium">Analyzing your property...</p>
                </div>
            </div>
        ) : !priceResult && !demandResult && !roiResult ? (
            <div className="text-center py-12 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-muted-foreground">Select a property and run an analysis to get started.</p>
            </div>
        ) : (
             <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="price" disabled={!priceResult}>Price Forecast</TabsTrigger>
                    <TabsTrigger value="demand" disabled={!demandResult}>Demand Analysis</TabsTrigger>
                    <TabsTrigger value="roi" disabled={!roiResult}>ROI Analysis</TabsTrigger>
                </TabsList>
                
                {priceResult && (
                    <TabsContent value="price" className="pt-4">
                        <Card>
                            <CardHeader><CardTitle>📈 Price Forecast</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <KpiCard title="3-Month" value={priceResult.threeMonth.predicted} description={`+${priceResult.threeMonth.growthRate}%`} />
                                    <KpiCard title="6-Month" value={priceResult.sixMonth.predicted} description={`+${priceResult.sixMonth.growthRate}%`} />
                                    <KpiCard title="12-Month" value={priceResult.twelveMonth.predicted} description={`+${priceResult.twelveMonth.growthRate}%`} />
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {demandResult && (
                    <TabsContent value="demand" className="pt-4">
                         <Card>
                            <CardHeader><CardTitle>📊 Demand Analysis</CardTitle></CardHeader>
                            <CardContent>
                               <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <Card>
                                        <CardHeader><CardTitle className="text-base">Demand Level</CardTitle></CardHeader>
                                        <CardContent><p className="text-2xl font-bold capitalize">{demandResult.demandLevel}</p></CardContent>
                                    </Card>
                                     <Card>
                                        <CardHeader><CardTitle className="text-base">Occupancy</CardTitle></CardHeader>
                                        <CardContent><p className="text-2xl font-bold">{demandResult.occupancyForecast}%</p></CardContent>
                                    </Card>
                                     <Card>
                                        <CardHeader><CardTitle className="text-base">Optimal Rent</CardTitle></CardHeader>
                                        <CardContent><p className="text-xl font-bold">{formatCurrency(demandResult.optimalPriceRange.min, settings.locale, settings.currency)} - {formatCurrency(demandResult.optimalPriceRange.max, settings.locale, settings.currency)}</p></CardContent>
                                    </Card>
                                </div>
                                <p className="text-sm mt-4 text-muted-foreground">{demandResult.recommendation}</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}

                {roiResult && (
                    <TabsContent value="roi" className="pt-4">
                         <Card>
                            <CardHeader><CardTitle>💰 ROI Analysis</CardTitle></CardHeader>
                             <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <KpiCard title="Cap Rate" value={roiResult.capRate} formatAs="percent" description="Net Operating Income / Value" />
                                <KpiCard title="Cash on Cash" value={roiResult.cashOnCashReturn} formatAs="percent" description="Cash Flow / Down Payment" />
                                <KpiCard title="5-Year ROI" value={roiResult.fiveYearProjection.roi} formatAs="percent" description="Projected 5-year return" />
                            </CardContent>
                        </Card>
                    </TabsContent>
                )}
            </Tabs>
        )}
      </CardContent>
    </Card>
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
      
    </>
  );
}
