
'use client';

import React, { useState, useMemo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useDataContext } from '@/context/data-context';
import { Building2, Download, Play, TrendingUp, BarChart3, DollarSign, AlertCircle, Loader2 } from 'lucide-react';
import type { Property } from '@/lib/types';

// Type definitions for ML Analysis results
interface PriceForecastResult {
  currentPrice: number;
  forecastedPrice: number;
  percentageChange: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
}

interface DemandAnalysisResult {
  demandScore: number;
  rentalIncome: number;
  occupancyRate: number;
  marketTrend: string;
}

interface ROIAnalysisResult {
  annualROI: number;
  projectedReturn: number;
  paybackPeriod: number;
  riskLevel: 'low' | 'medium' | 'high';
}

interface MLReport {
  propertyId: string;
  propertyName: string;
  analysisDate: string;
  priceForast?: PriceForecastResult;
  demandAnalysis?: DemandAnalysisResult;
  roiAnalysis?: ROIAnalysisResult;
}

// Helper function to format currency
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency: 'KES',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

// Helper function to abbreviate large numbers
const abbreviateNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(0) + 'K';
  }
  return num.toString();
};

// ML Predictions Panel Component
const MLPredictionsPanel = ({ properties }: { properties: Property[] }) => {
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(properties[0]?.id || '');
  const [isPending, setIsPending] = useState(false);
  const [report, setReport] = useState<MLReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);

  const handleRunAnalysis = async () => {
    if (!selectedProperty) return;
    
    setIsPending(true);
    setError(null);
    
    try {
      // Simulate API calls to cloud functions
      // In production, these would be actual HTTP requests to your cloud functions
      
      // Mock data for demonstration
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockReport: MLReport = {
        propertyId: selectedProperty.id,
        propertyName: `${selectedProperty.propertyType} - ${selectedProperty.city}`,
        analysisDate: new Date().toISOString().split('T')[0],
        priceForast: {
          currentPrice: selectedProperty.currentValue || selectedProperty.purchasePrice,
          forecastedPrice: (selectedProperty.currentValue || selectedProperty.purchasePrice) * 1.12,
          percentageChange: 12,
          trend: 'up',
          confidence: 0.85,
        },
        demandAnalysis: {
          demandScore: 78,
          rentalIncome: selectedProperty.rentalValue ? selectedProperty.rentalValue * 12 : 0,
          occupancyRate: 0.92,
          marketTrend: 'Growing',
        },
        roiAnalysis: {
          annualROI: 14.5,
          projectedReturn: (selectedProperty.currentValue || selectedProperty.purchasePrice) * 0.145,
          paybackPeriod: 6.9,
          riskLevel: 'low',
        },
      };
      
      setReport(mockReport);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsPending(false);
    }
  };

  const handleExport = () => {
    if (!report) return;
    
    // Create CSV content
    const csvContent = `
Property Analysis Report
Generated: ${new Date().toLocaleString()}

PROPERTY DETAILS
Property: ${report.propertyName}
Analysis Date: ${report.analysisDate}

PRICE FORECAST
Current Price: ${formatCurrency(report.priceForast?.currentPrice || 0)}
Forecasted Price: ${formatCurrency(report.priceForast?.forecastedPrice || 0)}
Change: ${report.priceForast?.percentageChange}%
Trend: ${report.priceForast?.trend}

DEMAND ANALYSIS
Demand Score: ${report.demandAnalysis?.demandScore}/100
Annual Rental Income: ${formatCurrency(report.demandAnalysis?.rentalIncome || 0)}
Occupancy Rate: ${((report.demandAnalysis?.occupancyRate || 0) * 100).toFixed(1)}%
Market Trend: ${report.demandAnalysis?.marketTrend}

ROI ANALYSIS
Annual ROI: ${report.roiAnalysis?.annualROI}%
Projected Annual Return: ${formatCurrency(report.roiAnalysis?.projectedReturn || 0)}
Payback Period: ${report.roiAnalysis?.paybackPeriod.toFixed(1)} years
Risk Level: ${report.roiAnalysis?.riskLevel}
    `.trim();

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis-${report.propertyId}-${report.analysisDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">ML Predictions</h2>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={handleExport}
            disabled={!report || isPending}
            className="hover:bg-accent"
          >
            <Download className="w-4 h-4" />
          </Button>
          <Button
            onClick={handleRunAnalysis}
            disabled={isPending || !selectedProperty}
            className="gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Analysis
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Property Selector */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Select Property</label>
        <Select value={selectedPropertyId} onValueChange={setSelectedPropertyId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a property" />
          </SelectTrigger>
          <SelectContent>
            {properties.map(property => (
              <SelectItem key={property.id} value={property.id}>
                {property.propertyType} - {property.city} - KES {abbreviateNumber(property.purchasePrice)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results Section */}
      {report ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Price Forecast Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-4 h-4" />
                Price Forecast
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Price</p>
                <p className="text-2xl font-bold">{formatCurrency(report.priceForast?.currentPrice || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Forecasted Price</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(report.priceForast?.forecastedPrice || 0)}
                </p>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm font-medium">
                  <span className={report.priceForast?.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                    {report.priceForast?.percentageChange}% {report.priceForast?.trend === 'up' ? '↑' : '↓'}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Confidence: {((report.priceForast?.confidence || 0) * 100).toFixed(0)}%
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Demand Analysis Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="w-4 h-4" />
                Demand Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Demand Score</p>
                <p className="text-2xl font-bold">{report.demandAnalysis?.demandScore}/100</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Annual Rental Income</p>
                <p className="text-xl font-bold">{formatCurrency(report.demandAnalysis?.rentalIncome || 0)}</p>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm font-medium">
                  Occupancy: {((report.demandAnalysis?.occupancyRate || 0) * 100).toFixed(0)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  Trend: {report.demandAnalysis?.marketTrend}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* ROI Analysis Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="w-4 h-4" />
                ROI Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Annual ROI</p>
                <p className="text-2xl font-bold text-blue-600">{report.roiAnalysis?.annualROI}%</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Projected Annual Return</p>
                <p className="text-xl font-bold">{formatCurrency(report.roiAnalysis?.projectedReturn || 0)}</p>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm font-medium">
                  Payback Period: {report.roiAnalysis?.paybackPeriod.toFixed(1)} years
                </p>
                <p className={`text-xs font-medium ${
                  report.roiAnalysis?.riskLevel === 'low' ? 'text-green-600' : 
                  report.roiAnalysis?.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  Risk: {report.roiAnalysis?.riskLevel.toUpperCase()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-muted-foreground">
            Select a property and run an analysis to get started
          </p>
        </div>
      )}
    </div>
  );
};

// KPI Card Component
const KpiCard = ({ title, value, icon: Icon, suffix = '', description }: {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  suffix?: string;
  description?: string;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}{suffix}</div>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </CardContent>
  </Card>
);

// Main Dashboard Component
const DashboardPageContent = () => {
  const { properties = [], revenue = [], expenses = [], loading } = useDataContext();

  const stats = useMemo(() => {
    if (!properties || properties.length === 0) return null;
    
    const totalProperties = properties.length;
    const totalRevenue = (revenue || []).reduce((sum, r) => sum + ((r as any)?.rent || 0), 0);
    const totalExpenses = (expenses || []).reduce((sum, e) => sum + ((e as any)?.amount || 0), 0);
    const netProfit = totalRevenue - totalExpenses;
    const occupancyRate = properties.length > 0 
      ? ((revenue || []).filter(r => (r as any)?.rent > 0).length / (properties.length * 12)) * 100 
      : 0;

    return {
      totalProperties,
      totalRevenue,
      totalExpenses,
      netProfit,
      occupancyRate,
    };
  }, [properties, revenue, expenses]);

  if (loading || !stats) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <PageHeader title="Dashboard" />
      
      <div className="space-y-8">
        {/* KPI Cards Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Portfolio Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard
              title="Total Properties"
              value={stats.totalProperties}
              icon={() => <Building2 className="h-4 w-4" />}
              description="Units across portfolio"
            />
            <KpiCard
              title="Occupancy Rate"
              value={stats.occupancyRate.toFixed(1)}
              suffix="%"
              icon={() => <BarChart3 className="h-4 w-4" />}
              description="Current active tenancies"
            />
            <KpiCard
              title="Total Expenses"
              value={formatCurrency(stats.totalExpenses)}
              icon={() => <DollarSign className="h-4 w-4" />}
              description="Cumulative from all properties"
            />
            <KpiCard
              title="Portfolio Asset Value"
              value={formatCurrency((properties || []).reduce((sum, p) => sum + ((p as any)?.currentValue || (p as any)?.purchasePrice), 0))}
              icon={() => <TrendingUp className="h-4 w-4" />}
              description="Current combined market value"
            />
            <KpiCard
              title="Monthly Revenue (Current)"
              value={formatCurrency(stats.totalRevenue / 12)}
              icon={() => <DollarSign className="h-4 w-4" />}
              description="December 2025"
            />
          </div>
        </div>

        {/* ML Predictions Section */}
        {properties && properties.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Advanced Analytics</h2>
            <Card>
              <CardContent className="pt-6">
                <MLPredictionsPanel properties={properties} />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Empty State */}
        {(!properties || properties.length === 0) && (
          <Card>
            <CardContent className="pt-6 text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Properties Yet</h3>
              <p className="text-muted-foreground">Add properties to see analytics and ML predictions</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default DashboardPageContent;
