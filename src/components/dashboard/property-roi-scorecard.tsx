'use client';

import { useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, AlertCircle, CheckCircle2, ChevronDown } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useDataContext } from '@/context/data-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PropertyData {
  id: string;
  name: string;
  streetAddress?: string;
  city?: string;
  currentValue: number;
  revenue: number;
  expenses: number;
}

interface PropertyROIScorecardProps {
  properties: PropertyData[];
  revenue: any[];
  expenses: any[];
}

type ViewMode = 'top-performers' | 'all' | 'needs-attention';

export function PropertyROIScorecard({ properties, revenue, expenses }: PropertyROIScorecardProps) {
  const { settings } = useDataContext();
  const { currency, locale } = settings;
  const [viewMode, setViewMode] = useState<ViewMode>('top-performers');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const propertyMetrics = useMemo(() => {
    return properties.map(prop => {
      const propRevenue = revenue
        .filter(r => r.propertyId === prop.id)
        .reduce((sum, r) => sum + (r.amountPaid || 0), 0);
      
      const propExpenses = expenses
        .filter(e => e.propertyId === prop.id)
        .reduce((sum, e) => sum + (e.amount || 0), 0);

      const netProfit = propRevenue - propExpenses;
      const roi = prop.currentValue > 0 ? (netProfit / prop.currentValue) * 100 : 0;
      
      const displayName = prop.streetAddress 
        ? `${prop.streetAddress}${prop.city ? ', ' + prop.city : ''}` 
        : (prop.name || 'Unnamed Property');

      let status = 'strong';
      if (roi < 0) status = 'loss';
      else if (roi < 5) status = 'weak';
      else if (roi >= 10) status = 'strong';

      return {
        id: prop.id,
        name: displayName,
        revenue: propRevenue,
        expenses: propExpenses,
        netProfit,
        roi,
        status,
        assetValue: prop.currentValue
      };
    }).sort((a, b) => b.roi - a.roi);
  }, [properties, revenue, expenses]);

  // Filter by view mode
  const displayedProperties = useMemo(() => {
    switch(viewMode) {
      case 'top-performers':
        return propertyMetrics.slice(0, 5); // Show top 5
      case 'needs-attention':
        return propertyMetrics.filter(p => p.status !== 'strong'); // Show non-strong
      case 'all':
      default:
        return propertyMetrics;
    }
  }, [propertyMetrics, viewMode]);

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'strong':
        return {
          icon: <CheckCircle2 className="h-5 w-5" />,
          label: 'Strong',
          variant: 'positive'
        };
      case 'weak':
        return {
          icon: <AlertCircle className="h-5 w-5" />,
          label: 'Needs Review',
          variant: 'default'
        };
      case 'loss':
        return {
          icon: <TrendingDown className="h-5 w-5" />,
          label: 'Loss Making',
          variant: 'destructive'
        };
      default:
        return {
          icon: null,
          label: '',
          variant: 'default'
        };
    }
  };

  const strongCount = propertyMetrics.filter(p => p.status === 'strong').length;
  const needsAttentionCount = propertyMetrics.filter(p => p.status !== 'strong').length;
  const totalCount = propertyMetrics.length;

  return (
    <div className="space-y-4">
      {/* Header with Summary */}
      <div className="px-1 py-2">
        <h3 className="text-lg font-semibold text-foreground">Property Performance Overview</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {totalCount} propert{totalCount !== 1 ? 'ies' : 'y'} • 
          <span className="ml-2 font-medium text-green-600">{strongCount} Strong</span> •
          <span className="ml-2 font-medium text-orange-600">{needsAttentionCount} Needs Review</span>
        </p>
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-2">
        <Button
          variant={viewMode === 'top-performers' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('top-performers')}
          className="text-xs"
        >
          <TrendingUp className="h-4 w-4 mr-1" />
          Top Performers ({Math.min(5, propertyMetrics.filter(p => p.status === 'strong').length)})
        </Button>
        
        <Button
          variant={viewMode === 'needs-attention' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setViewMode('needs-attention')}
          className="text-xs"
        >
          <AlertCircle className="h-4 w-4 mr-1" />
          Needs Attention ({needsAttentionCount})
        </Button>

        {totalCount > 5 && (
          <Button
            variant={viewMode === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('all')}
            className="text-xs"
          >
            All ({totalCount})
          </Button>
        )}
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
          <CardContent className="pt-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-medium text-green-700 dark:text-green-300">Average ROI</p>
                <p className="text-2xl font-bold text-green-600 mt-1">
                  {(propertyMetrics.reduce((sum, p) => sum + p.roi, 0) / propertyMetrics.length).toFixed(1)}%
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Total Revenue</p>
                <p className="text-lg font-bold text-blue-600 mt-1 truncate">
                  {formatCurrency(propertyMetrics.reduce((sum, p) => sum + p.revenue, 0), locale, currency)}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-blue-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-medium text-purple-700 dark:text-purple-300">Combined Profit</p>
                <p className="text-lg font-bold text-purple-600 mt-1 truncate">
                  {formatCurrency(propertyMetrics.reduce((sum, p) => sum + p.netProfit, 0), locale, currency)}
                </p>
              </div>
              <TrendingUp className="h-6 w-6 text-purple-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Property List - Compact */}
      <div className="space-y-2">
        {displayedProperties.length > 0 ? (
          displayedProperties.map((metric, index) => {
            const statusConfig = getStatusConfig(metric.status);
            const isExpanded = expandedId === metric.id;

            return (
              <Card 
                key={metric.id} 
                className="overflow-hidden hover:shadow-md transition-all duration-200"
              >
                {/* Compact Header - Always Visible */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : metric.id)}
                  className="w-full p-4 flex items-start justify-between hover:bg-muted/50 transition-colors text-left"
                >
                  <div className="flex-1 min-w-0">
                    {/* Rank + Name */}
                    <div className="flex items-center gap-3">
                      <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/12 flex-shrink-0">
                        <span className="text-xs font-semibold text-primary">
                          {viewMode === 'all' 
                            ? propertyMetrics.findIndex(p => p.id === metric.id) + 1
                            : index + 1}
                        </span>
                      </div>
                      
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm line-clamp-1">
                          {metric.name}
                        </h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {formatCurrency(metric.assetValue, locale, currency)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Key Metrics (Always Visible) */}
                  <div className="flex items-center gap-4 ml-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Profit</p>
                      <p className={cn(
                        "text-sm font-bold",
                        metric.netProfit >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {formatCurrency(metric.netProfit, locale, currency)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">ROI</p>
                      <p className={cn(
                        "text-sm font-bold",
                        metric.roi >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {metric.roi.toFixed(1)}%
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div className={cn(
                      "flex items-center gap-1 px-2 py-1 rounded-full flex-shrink-0",
                      statusConfig.variant === 'positive' && 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
                      statusConfig.variant === 'destructive' && 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
                      statusConfig.variant === 'default' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                    )}>
                      {statusConfig.icon}
                    </div>

                    {/* Expand Icon */}
                    <ChevronDown className={cn(
                      "h-5 w-5 text-muted-foreground transition-transform flex-shrink-0",
                      isExpanded && 'rotate-180'
                    )} />
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <>
                    <div className="h-px bg-border" />
                    <CardContent className="pt-4 pb-4">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Monthly Revenue</p>
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(metric.revenue, locale, currency)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Monthly Expenses</p>
                          <p className="text-lg font-bold text-red-600">
                            {formatCurrency(metric.expenses, locale, currency)}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-muted-foreground mb-1">Net Monthly</p>
                          <p className={cn(
                            "text-lg font-bold",
                            (metric.revenue - metric.expenses) >= 0 ? 'text-green-600' : 'text-red-600'
                          )}>
                            {formatCurrency(metric.revenue - metric.expenses, locale, currency)}
                          </p>
                        </div>
                      </div>

                      {/* Insights */}
                      <div className="mt-4 pt-4 border-t space-y-2">
                        {metric.roi >= 15 && (
                          <p className="text-xs text-green-700 dark:text-green-300">
                            ✅ <span className="font-medium">Excellent performer</span> - Consider expansion
                          </p>
                        )}
                        {metric.roi >= 5 && metric.roi < 10 && (
                          <p className="text-xs text-blue-700 dark:text-blue-300">
                            ℹ️ <span className="font-medium">Performing well</span> - Maintain current operations
                          </p>
                        )}
                        {metric.roi >= 0 && metric.roi < 5 && (
                          <p className="text-xs text-orange-700 dark:text-orange-300">
                            ⚠️ <span className="font-medium">Moderate performance</span> - Review expenses for optimization
                          </p>
                        )}
                        {metric.roi < 0 && (
                          <p className="text-xs text-red-700 dark:text-red-300">
                            🚨 <span className="font-medium">Loss-making</span> - Urgent action required on expenses or pricing
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </>
                )}
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No properties in this view</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Show more indicator */}
      {viewMode === 'top-performers' && propertyMetrics.length > 5 && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setViewMode('all')}
            className="text-xs"
          >
            View all {propertyMetrics.length} properties
          </Button>
        </div>
      )}
    </div>
  );
}
