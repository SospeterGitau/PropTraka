'use client';

import React, { useState, useEffect } from 'react';
import type { Property } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Users, Percent, BarChart3 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { fetchMLPrediction } from '@/app/actions';

interface MLPredictionsPanelProps {
    properties: Property[];
}

export function MLPredictionsPanel({ properties }: MLPredictionsPanelProps) {
    const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
    const [priceResult, setPriceResult] = useState<any>(null);
    const [demandResult, setDemandResult] = useState<any>(null);
    const [roiResult, setRoiResult] = useState<any>(null);
    const [comparisonResults, setComparisonResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

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
                <div className="flex items-center justify-between mb-4 bg-muted/40 p-1 rounded-lg overflow-x-auto">
                    <TabsList className="bg-transparent h-auto min-h-[44px] w-full justify-start md:justify-center">
                        <TabsTrigger value="price" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground min-h-[40px] px-4">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Price
                        </TabsTrigger>
                        <TabsTrigger value="demand" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground min-h-[40px] px-4">
                            <Users className="w-4 h-4 mr-2" />
                            Demand
                        </TabsTrigger>
                        <TabsTrigger value="roi" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground min-h-[40px] px-4">
                            <Percent className="w-4 h-4 mr-2" />
                            % ROI
                        </TabsTrigger>
                        <TabsTrigger value="compare" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white min-h-[40px] px-4">
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
                        <Card className="border-0 shadow-md">
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
                                                className="w-full h-12 px-3 py-2 border border-gray-300 rounded-md bg-background text-foreground"
                                            >
                                                {properties.map(prop => (
                                                    <option key={prop.id} value={prop.id}>{prop.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-end">
                                            <Button onClick={handlePredictPrice} disabled={loading || !selectedProperty} className="w-full h-12">
                                                {loading ? 'Analyzing...' : 'Predict Future Price'}
                                            </Button>
                                        </div>
                                    </div>

                                    {priceResult && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-900">
                                                <p className="text-sm text-muted-foreground">Predicted Price (5 Years)</p>
                                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                                                    {formatCurrency(priceResult.predicted_price, 'en-KE', 'KES')}
                                                </p>
                                            </div>
                                            <div className="bg-muted p-4 rounded-lg">
                                                <p className="text-sm text-muted-foreground">Current Value</p>
                                                <p className="text-xl font-semibold mt-1">
                                                    {formatCurrency(selectedProperty?.currentValue || 0, 'en-KE', 'KES')}
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
                        <Card className="border-0 shadow-md">
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
                                                className="w-full h-12 px-3 py-2 border border-gray-300 rounded-md bg-background text-foreground"
                                            >
                                                {properties.map(prop => (
                                                    <option key={prop.id} value={prop.id}>{prop.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-end">
                                            <Button onClick={handleAnalyzeDemand} disabled={loading || !selectedProperty} className="w-full h-12 bg-green-600 hover:bg-green-700 text-white">
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
                                                    {formatCurrency(demandResult.recommended_rental_rate, 'en-KE', 'KES')}
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
                        <Card className="border-0 shadow-md">
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
                                                className="w-full h-12 px-3 py-2 border border-gray-300 rounded-md bg-background text-foreground"
                                            >
                                                {properties.map(prop => (
                                                    <option key={prop.id} value={prop.id}>{prop.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="flex items-end">
                                            <Button onClick={handleCalculateROI} disabled={loading || !selectedProperty} className="w-full h-12 bg-purple-600 hover:bg-purple-700 text-white">
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
                                                    +{formatCurrency(roiResult.total_return, 'en-KE', 'KES')}
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
                        <Card className="border-0 shadow-md">
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
