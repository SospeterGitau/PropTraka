'use client';

import { useMemo } from 'react';
import { AlertCircle, TrendingDown, Calendar } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useDataContext } from '@/context/data-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { startOfToday, isBefore } from 'date-fns';

interface ArrearsSummaryProps {
  revenue: any[];
  properties: any[];
}

export function ArrearsSummary({ revenue, properties }: ArrearsSummaryProps) {
  const { settings } = useDataContext();
  const { currency, locale } = settings;

  // Calculate arrears analysis
  const { arrearsAnalysis, totalArrearsAmount, criticalArrears } = useMemo(() => {
    const today = startOfToday();
    const arrearsMap = new Map<string, {
      tenantName: string;
      propertyName: string;
      propertyAddress?: string;
      totalOwed: number;
      daysOverdue: number;
      dueDate: Date;
    }>();

    revenue.forEach(tx => {
      if (tx.tenancyId) {
        const txDate = tx.date ? new Date(tx.date) : new Date();
        
        // Check if payment is overdue
        if (isBefore(txDate, today)) {
          const daysOverdue = Math.floor((today.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // Calculate what's owed
          const serviceChargesTotal = (tx.serviceCharges || []).reduce((sum: any, sc: any) => sum + sc.amount, 0);
          const amountDue = tx.rent + serviceChargesTotal + (tx.deposit || 0);
          const amountOwed = amountDue - (tx.amountPaid || 0);

          if (amountOwed > 0) {
            const key = tx.tenancyId;
            const existing = arrearsMap.get(key);
            
            arrearsMap.set(key, {
              tenantName: tx.tenant?.name || tx.tenantName || 'Unknown Tenant',
              propertyName: tx.propertyName || 'Unknown Property',
              propertyAddress: tx.propertyAddress,
              totalOwed: (existing?.totalOwed || 0) + amountOwed,
              daysOverdue: Math.max(existing?.daysOverdue || 0, daysOverdue),
              dueDate: txDate
            });
          }
        }
      }
    });

    const arrearsArray = Array.from(arrearsMap.values())
      .sort((a, b) => b.totalOwed - a.totalOwed);

    const totalArrears = arrearsArray.reduce((sum, arr) => sum + arr.totalOwed, 0);
    const critical = arrearsArray.filter(arr => arr.daysOverdue > 30).length;

    return {
      arrearsAnalysis: arrearsArray,
      totalArrearsAmount: totalArrears,
      criticalArrears: critical
    };
  }, [revenue]);

  const getSeverityColor = (daysOverdue: number) => {
    if (daysOverdue > 60) return 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800';
    if (daysOverdue > 30) return 'text-orange-700 dark:text-orange-300 bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800';
    return 'text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800';
  };

  const getSeverityLabel = (daysOverdue: number) => {
    if (daysOverdue > 60) return 'CRITICAL';
    if (daysOverdue > 30) return 'URGENT';
    return 'OVERDUE';
  };

  if (arrearsAnalysis.length === 0) {
    return (
      <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/20">
        <CardContent className="flex items-center gap-4 py-6">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-100 dark:bg-green-900/30">
              <AlertCircle className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-green-900 dark:text-green-100">
              All Payments Up to Date
            </h3>
            <p className="text-sm text-green-800 dark:text-green-200 mt-1">
              No overdue payments detected. Great job managing your portfolio! 🎉
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-medium text-red-700 dark:text-red-300">Total Arrears</p>
                <p className="text-2xl font-bold text-red-600 mt-1 truncate">
                  {formatCurrency(totalArrearsAmount, locale, currency)}
                </p>
              </div>
              <TrendingDown className="h-6 w-6 text-red-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950/20">
          <CardContent className="pt-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-medium text-orange-700 dark:text-orange-300">Cases</p>
                <p className="text-2xl font-bold text-orange-600 mt-1">
                  {arrearsAnalysis.length}
                </p>
              </div>
              <AlertCircle className="h-6 w-6 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-2",
          criticalArrears > 0 
            ? 'border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-950/20' 
            : 'border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-950/20'
        )}>
          <CardContent className="pt-4">
            <div className="flex items-end justify-between">
              <div>
                <p className={cn(
                  "text-xs font-medium",
                  criticalArrears > 0 
                    ? 'text-red-700 dark:text-red-300' 
                    : 'text-yellow-700 dark:text-yellow-300'
                )}>
                  Critical Cases
                </p>
                <p className={cn(
                  "text-2xl font-bold mt-1",
                  criticalArrears > 0 
                    ? 'text-red-600' 
                    : 'text-yellow-600'
                )}>
                  {criticalArrears}
                </p>
              </div>
              <Calendar className={cn(
                "h-6 w-6 opacity-20",
                criticalArrears > 0 
                  ? 'text-red-600' 
                  : 'text-yellow-600'
              )} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Arrears List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Overdue Payments Details
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            {arrearsAnalysis.length} tenant{arrearsAnalysis.length !== 1 ? 's' : ''} with outstanding balances
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {arrearsAnalysis.map((arrear, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-start justify-between p-3 rounded-lg border",
                  getSeverityColor(arrear.daysOverdue)
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {getSeverityLabel(arrear.daysOverdue)}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      {arrear.daysOverdue} days overdue
                    </span>
                  </div>
                  
                  <p className="text-sm font-medium line-clamp-1">
                    {arrear.tenantName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {arrear.propertyAddress || arrear.propertyName}
                  </p>
                </div>

                <div className="text-right ml-3 flex-shrink-0">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Amount Owed</p>
                  <p className="text-sm font-bold text-current">
                    {formatCurrency(arrear.totalOwed, locale, currency)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action */}
      <Button asChild className="w-full" variant="outline">
        <Link href="/arrears">
          Manage Arrears →
        </Link>
      </Button>
    </div>
  );
}
