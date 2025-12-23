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
  totalArrears: number;
  numberOfTenantsInArrears: number;
  longestArrearsDays: number;
}

export function ArrearsSummary({ totalArrears, numberOfTenantsInArrears, longestArrearsDays }: ArrearsSummaryProps) {
  const { settings } = useDataContext();
  const currency = settings?.currency || 'KES';
  const locale = settings?.locale || 'en-KE';

  const criticalArrears = longestArrearsDays > 30 ? 1 : 0;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/20">
          <CardContent className="pt-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs font-medium text-red-700 dark:text-red-300">Total Arrears</p>
                <p className="text-2xl font-bold text-red-600 mt-1 truncate">
                  {formatCurrency(totalArrears, locale, currency)}
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
                  {numberOfTenantsInArrears}
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

      <Button asChild className="w-full" variant="outline">
        <Link href="/arrears">Manage Arrears →</Link>
      </Button>
    </div>
  );
}
