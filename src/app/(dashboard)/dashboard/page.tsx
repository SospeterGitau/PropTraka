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
  Download
} from 'lucide-react';
import { CurrencyIcon } from '@/components/currency-icon';
import { PageHeader } from '@/components/page-header';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { AreaChart } from '@/components/dashboard/area-chart';
import { HorizontalBarChart } from '@/components/dashboard/horizontal-bar-chart';
import { startOfToday, isBefore } from 'date-fns';
import type { Transaction } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';


function MLPredictionsPanel() {
  const { properties, settings } = useDataContext();
  const [selectedProperty, setSelectedProperty] = useState<any>(null);
  const [priceResult, setPriceResult] = useState<any>(null);
  const [demandResult, setDemandResult] = useState<any>(null);
  const [roiResult, setRoiResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeFunction, setActiveFunction] = useState<'price' | 'demand' | 'roi' | 'compare' | null>(null);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'price' | 'demand' | 'roi' | 'compare' | 'empty'>('empty');
  const [compareProperties, setCompareProperties] = useState(false);
  const [comparisonResults, setComparisonResults] = useState<any>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const currency = settings?.currency || 'KES';
  const locale = settings?.locale || 'en-KE';

  useEffect(() => {
    if (properties.length > 0 && !selectedProperty) {
      setSelectedProperty(properties[0]);
    }
  }, [properties, selectedProperty]);

  const callCloudFunction = async (functionName: string, data: any) => {
    try {
      console.log(`Calling ${functionName}:`, data);

      const response = await fetch(
        `https://us-central1-studio-6577669797-1b758.cloudfunctions.net/${functionName}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        }
      );

      if (!response.ok) {
        throw new Error(`Function call failed: ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`Result from ${functionName}:`, result);
      return result;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setError(`Error: ${msg}`);
      console.error(`Error in ${functionName}:`, err);
      return null;
    }
  };

  const handlePredictPrice = async () => {
    if (!selectedProperty) return;
    setActiveFunction('price');
    setLoading(true);
    setError('');
    
    const payload = {
      location: selectedProperty.city || 'Nairobi',
      bedrooms: selectedProperty.bedrooms || 2,
      current_price: selectedProperty.property_value || 1000000,
      annual_appreciation_rate: 0.05,
      property_age: selectedProperty.property_age || 5,
    };
    const result = await callCloudFunction('predictPrice', payload);
    if (result) {
      setPriceResult(result);
      setActiveTab('price');
    }
    setLoading(false);
    setActiveFunction(null);
  };

  const handleAnalyzeDemand = async () => {
    if (!selectedProperty) return;
    setActiveFunction('demand');
    setLoading(true);
    setError('');
    
    const payload = {
      location: selectedProperty.city || 'Nairobi',
      property_type: selectedProperty.property_type || 'Residential',
      current_rental_rate: selectedProperty.monthly_rent || 15000,
      market_data: { average_occupancy: 0.85, median_rental_price: 12000 },
    };
    const result = await callCloudFunction('analyzeDemand', payload);
    if (result) {
      setDemandResult(result);
      setActiveTab('demand');
    }
    setLoading(false);
    setActiveFunction(null);
  };

  const handleCalculateROI = async () => {
    if (!selectedProperty) return;
    setActiveFunction('roi');
    setLoading(true);
    setError('');
    
    const payload = {
      initial_investment: selectedProperty.property_value || 1000000,
      annual_rental_income: (selectedProperty.monthly_rent || 15000) * 12,
      annual_expenses: selectedProperty.annual_expenses || 2000,
      property_appreciation_rate: 0.05,
      years: 5,
    };
    const result = await callCloudFunction('calculateROI', payload);
    if (result) {
      setRoiResult(result);
      setActiveTab('roi');
    }
    setLoading(false);
    setActiveFunction(null);
  };

  const handleCompareProperties = async () => {
    if (properties.length < 2) {
      setError('Need at least 2 properties to compare');
      return;
    }

    setActiveFunction('compare');
    setLoading(true);
    setError('');
    const results = [];
    
    for (const prop of properties.slice(0, 3)) {
      const roiData = await callCloudFunction('calculateROI', {
        initial_investment: prop.property_value || 1000000,
        annual_rental_income: (prop.monthly_rent || 15000) * 12,
        annual_expenses: prop.annual_expenses || 2000,
        property_appreciation_rate: 0.05,
        years: 5,
      });
      if (roiData) {
        results.push({
          property_name: `${prop.property_type} in ${prop.city}`,
          ...roiData
        });
      }
    }
    
    setComparisonResults(results);
    setCompareProperties(true);
    setActiveTab('compare');
    setLoading(false);
    setActiveFunction(null);
  };

  const formatNumberShort = (num: number): string => {
    if (num >= 1000000) {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 1,
      }).format(num);
    }
    if (num >= 1000) {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currency,
        notation: 'compact',
        compactDisplay: 'short',
        maximumFractionDigits: 0,
      }).format(num);
    }
    return formatCurrency(num, locale, currency);
  };

  const exportToPDF = async () => {
    const content = `
PROPERTY INVESTMENT ANALYSIS REPORT
=====================================
Generated: ${new Date().toLocaleDateString()}

PROPERTY: ${selectedProperty?.property_type} in ${selectedProperty?.city}
Value: ${formatCurrency(selectedProperty?.property_value || 0, locale, currency)}

PRICE FORECAST
${priceResult ? `Future Price (5 years): ${formatCurrency(priceResult.future_price || 0, locale, currency)}
Appreciation: ${priceResult.appreciation_percentage}
Trend: ${priceResult.trend}` : 'Not analyzed'}

DEMAND ANALYSIS
${demandResult ? `Demand Score: ${demandResult.demand_score}/10
Occupancy Rate: ${demandResult.occupancy_rate}
Annual Income Estimate: ${formatCurrency(demandResult.annual_income_estimate || 0, locale, currency)}` : 'Not analyzed'}

ROI ANALYSIS
${roiResult ? `Total ROI: ${roiResult.roi_percentage}
Annual ROI: ${roiResult.annual_roi}%
Break-even: ${roiResult.break_even_months} months` : 'Not analyzed'}

Risk Level: ${roiResult?.risk_level || 'Not assessed'}
    `;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `property-analysis-${selectedProperty?.id}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <Building className="h-6 w-6 text-primary" />
              <div>
                <CardTitle className="text-xl">AI Predictions & Analysis</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Advanced property investment insights powered by AI</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCompareProperties}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Compare
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={exportToPDF}>
                    Download Report (.txt)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <label className="block text-sm font-medium mb-3">Select Property</label>
          <select
            value={selectedProperty?.id || ''}
            onChange={(e) => setSelectedProperty(properties.find(p => p.id === e.target.value))}
            className="w-full px-3 py-2 bg-secondary border border-border rounded-md text-foreground focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          >
            <option value="">Choose a property...</option>
            {properties.map(prop => (
              <option key={prop.id} value={prop.id}>
                {prop.property_type} - {prop.city} - {formatNumberShort(prop.property_value || 0)}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {error && (
        <div className="bg-destructive/10 border border-destructive rounded-md p-3 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <button
            onClick={handlePredictPrice}
            disabled={!selectedProperty || activeFunction !== null}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition ${
              activeFunction === 'price'
                ? 'bg-primary text-primary-foreground'
                : activeTab === 'price'
                ? 'bg-primary/80 text-primary-foreground border-2 border-primary'
                : 'bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50'
            }`}
          >
            <TrendingUp className="h-4 w-4" />
            {activeFunction === 'price' ? 'Analyzing...' : 'Predict Price'}
          </button>
          <button
            onClick={handleAnalyzeDemand}
            disabled={!selectedProperty || activeFunction !== null}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition ${
              activeFunction === 'demand'
                ? 'bg-accent text-accent-foreground'
                : activeTab === 'demand'
                ? 'bg-accent/80 text-accent-foreground border-2 border-accent'
                : 'bg-accent text-accent-foreground hover:opacity-90 disabled:opacity-50'
            }`}
          >
            <Users className="h-4 w-4" />
            {activeFunction === 'demand' ? 'Analyzing...' : 'Analyze Demand'}
          </button>
          <button
            onClick={handleCalculateROI}
            disabled={!selectedProperty || activeFunction !== null}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md font-medium text-sm transition ${
              activeFunction === 'roi'
                ? 'bg-primary text-primary-foreground'
                : activeTab === 'roi'
                ? 'bg-primary/80 text-primary-foreground border-2 border-primary'
                : 'bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50'
            }`}
          >
            <Percent className="h-4 w-4" />
            {activeFunction === 'roi' ? 'Analyzing...' : 'Calculate ROI'}
          </button>
        </div>

        {(priceResult || demandResult || roiResult || compareProperties) && (
          <div className="flex gap-1 bg-secondary rounded-md p-1">
            {priceResult && (
              <button
                onClick={() => setActiveTab('price')}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded transition ${
                  activeTab === 'price'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                Price Forecast
              </button>
            )}
            {demandResult && (
              <button
                onClick={() => setActiveTab('demand')}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded transition ${
                  activeTab === 'demand'
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Users className="h-4 w-4" />
                Demand Analysis
              </button>
            )}
            {roiResult && (
              <button
                onClick={() => setActiveTab('roi')}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded transition ${
                  activeTab === 'roi'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Percent className="h-4 w-4" />
                ROI Analysis
              </button>
            )}
            {compareProperties && (
              <button
                onClick={() => setActiveTab('compare')}
                className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded transition ${
                  activeTab === 'compare'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <BarChart3 className="h-4 w-4" />
                Comparison
              </button>
            )}
          </div>
        )}
      </div>

      {activeTab === 'price' && priceResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Price Forecast (5 Years)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="bg-secondary rounded-md p-4">
                <p className="text-xs text-muted-foreground mb-1">Current Price</p>
                <p className="text-lg font-bold">{formatNumberShort(priceResult.current_price || 0)}</p>
              </div>
              <div className="bg-secondary rounded-md p-4">
                <p className="text-xs text-muted-foreground mb-1">Future Price</p>
                <p className="text-lg font-bold text-green-500">{formatNumberShort(priceResult.future_price || 0)}</p>
              </div>
              <div className="bg-secondary rounded-md p-4">
                <p className="text-xs text-muted-foreground mb-1">Total Appreciation</p>
                <p className="text-lg font-bold">{priceResult.appreciation_percentage}</p>
              </div>
              <div className="bg-secondary rounded-md p-4">
                <p className="text-xs text-muted-foreground mb-1">Trend</p>
                <p className="text-lg font-bold text-primary">{priceResult.trend}</p>
              </div>
            </div>

            {priceResult.forecast_data && (
              <div className="bg-secondary rounded-md p-4 overflow-x-auto">
                <h4 className="font-semibold text-sm mb-3">Year-by-Year Forecast</h4>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 font-medium">Year</th>
                      <th className="text-left py-2 px-2 font-medium">Price</th>
                      <th className="text-left py-2 px-2 font-medium">Lower</th>
                      <th className="text-left py-2 px-2 font-medium">Upper</th>
                      <th className="text-left py-2 px-2 font-medium">Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {priceResult.forecast_data.map((row: any, idx: number) => (
                      <tr key={idx} className="border-b border-border hover:bg-background/50">
                        <td className="py-2 px-2">{row.year}</td>
                        <td className="py-2 px-2">{formatNumberShort(row.predicted_price || 0)}</td>
                        <td className="py-2 px-2 text-muted-foreground">{formatNumberShort(row.lower_bound || 0)}</td>
                        <td className="py-2 px-2 text-green-500">{formatNumberShort(row.upper_bound || 0)}</td>
                        <td className="py-2 px-2">{row.confidence_level}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="bg-secondary rounded-md p-4 space-y-2">
              <p className="text-sm"><strong>Recommendation:</strong> <span className="text-muted-foreground">{priceResult.recommendation}</span></p>
              <p className="text-sm"><strong>Market Insight:</strong> <span className="text-muted-foreground">{priceResult.market_insights}</span></p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'demand' && demandResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-accent" />
              Demand Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="bg-secondary rounded-md p-4">
                <p className="text-xs text-muted-foreground mb-1">Demand Score</p>
                <p className="text-lg font-bold">{demandResult.demand_score}/10</p>
                <p className="text-xs text-muted-foreground mt-1">{demandResult.demand_level}</p>
              </div>
              <div className="bg-secondary rounded-md p-4">
                <p className="text-xs text-muted-foreground mb-1">Occupancy Rate</p>
                <p className="text-lg font-bold">{demandResult.occupancy_rate}</p>
              </div>
              <div className="bg-secondary rounded-md p-4">
                <p className="text-xs text-muted-foreground mb-1">Monthly Income</p>
                <p className="text-lg font-bold text-green-500">{formatNumberShort(demandResult.monthly_income_estimate || 0)}</p>
              </div>
              <div className="bg-secondary rounded-md p-4">
                <p className="text-xs text-muted-foreground mb-1">Annual Income</p>
                <p className="text-lg font-bold">{formatNumberShort(demandResult.annual_income_estimate || 0)}</p>
              </div>
            </div>

            {demandResult.market_comparison && (
              <div className="bg-secondary rounded-md p-4 space-y-3">
                <h4 className="font-semibold text-sm">Market Comparison</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {demandResult.market_comparison.map((comp: any, idx: number) => (
                    <div key={idx} className="bg-background rounded-md p-3 border border-border">
                      <p className="text-sm font-medium">{comp.type}</p>
                      <p className="text-xs text-muted-foreground mt-2">Rate: {formatNumberShort(comp.rate || 0)}</p>
                      <p className="text-xs text-muted-foreground">Occupancy: {(comp.occupancy * 100).toFixed(0)}%</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-secondary rounded-md p-4 space-y-2">
              <p className="text-sm"><strong>Recommendation:</strong> <span className="text-muted-foreground">{demandResult.recommendation}</span></p>
              <p className="text-sm"><strong>Risk Level:</strong> <span className="text-muted-foreground">{demandResult.risk_level}</span></p>
              <p className="text-sm"><strong>Market Insights:</strong> <span className="text-muted-foreground">{demandResult.market_insights}</span></p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'roi' && roiResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Percent className="h-5 w-5 text-primary" />
              ROI Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="bg-secondary rounded-md p-4">
                <p className="text-xs text-muted-foreground mb-1">Total ROI</p>
                <p className="text-lg font-bold">{roiResult.roi_percentage}</p>
              </div>
              <div className="bg-secondary rounded-md p-4">
                <p className="text-xs text-muted-foreground mb-1">Annual ROI</p>
                <p className="text-lg font-bold text-green-500">{roiResult.annual_roi}%</p>
              </div>
              <div className="bg-secondary rounded-md p-4">
                <p className="text-xs text-muted-foreground mb-1">Break-even</p>
                <p className="text-lg font-bold">{roiResult.break_even_months} months</p>
              </div>
              <div className="bg-secondary rounded-md p-4">
                <p className="text-xs text-muted-foreground mb-1">Risk Level</p>
                <p className={`text-lg font-bold ${roiResult.risk_level === 'LOW' ? 'text-green-500' : roiResult.risk_level === 'MEDIUM' ? 'text-yellow-500' : 'text-destructive'}`}>
                  {roiResult.risk_level}
                </p>
              </div>
            </div>

            {roiResult.yearly_breakdown && (
              <div className="bg-secondary rounded-md p-4 overflow-x-auto">
                <h4 className="font-semibold text-sm mb-3">Year-by-Year Cash Flow</h4>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 font-medium">Year</th>
                      <th className="text-left py-2 px-2 font-medium">Cash Flow</th>
                      <th className="text-left py-2 px-2 font-medium">Cumulative</th>
                      <th className="text-left py-2 px-2 font-medium">Property Value</th>
                      <th className="text-left py-2 px-2 font-medium">Total Assets</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roiResult.yearly_breakdown.map((row: any, idx: number) => (
                      <tr key={idx} className="border-b border-border hover:bg-background/50">
                        <td className="py-2 px-2">{row.year}</td>
                        <td className="py-2 px-2">{formatNumberShort(row.annual_cash_flow || 0)}</td>
                        <td className="py-2 px-2 text-primary font-semibold">{formatNumberShort(row.cumulative_cash_flow || 0)}</td>
                        <td className="py-2 px-2">{formatNumberShort(row.property_value || 0)}</td>
                        <td className="py-2 px-2 text-green-500 font-semibold">{formatNumberShort(row.total_assets || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="bg-secondary rounded-md p-4 space-y-2">
              <p className="text-sm"><strong>Recommendation:</strong> <span className="text-muted-foreground">{roiResult.recommendation}</span></p>
              <p className="text-sm"><strong>Cash-on-Cash Return:</strong> <span className="text-muted-foreground">{roiResult.cash_on_cash_return}%</span></p>
              <p className="text-sm"><strong>Investment Summary:</strong> <span className="text-muted-foreground">{roiResult.investment_summary}</span></p>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'compare' && compareProperties && comparisonResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Property Comparison
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-secondary rounded-md p-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-medium">Property</th>
                    <th className="text-left py-2 px-2 font-medium">Investment</th>
                    <th className="text-left py-2 px-2 font-medium">Total ROI</th>
                    <th className="text-left py-2 px-2 font-medium">Annual ROI</th>
                    <th className="text-left py-2 px-2 font-medium">Break-even</th>
                    <th className="text-left py-2 px-2 font-medium">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisonResults.map((result: any, idx: number) => (
                    <tr key={idx} className="border-b border-border hover:bg-background/50">
                      <td className="py-2 px-2 font-medium text-foreground">{result.property_name}</td>
                      <td className="py-2 px-2">{formatNumberShort(result.initial_investment || 0)}</td>
                      <td className="py-2 px-2 text-green-500 font-bold">{result.roi_percentage}</td>
                      <td className="py-2 px-2 text-primary">{result.annual_roi}%</td>
                      <td className="py-2 px-2">{result.break_even_months} months</td>
                      <td className={`py-2 px-2 font-semibold ${result.risk_level === 'LOW' ? 'text-green-500' : result.risk_level === 'MEDIUM' ? 'text-yellow-500' : 'text-destructive'}`}>
                        {result.risk_level}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-2 border-border border-t-primary"></div>
            <p className="text-sm text-muted-foreground">Analyzing your property...</p>
          </div>
        </div>
      )}

      {!priceResult && !demandResult && !roiResult && !compareProperties && !loading && (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-sm text-muted-foreground">Select a property and click an analysis button to get started</p>
          </CardContent>
        </Card>
      )}
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
    </>
  );
}
