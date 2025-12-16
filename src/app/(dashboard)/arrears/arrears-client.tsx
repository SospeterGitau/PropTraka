
'use client';

import { useMemo, useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Loader2, BarChart, FileText } from 'lucide-react';
import { useUser } from '@/firebase/auth'; // Corrected import
import { firestore } from '@/firebase'; // Corrected import
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy, getDocs, writeBatch, doc } from 'firebase/firestore';
import { useDataContext } from '@/context/data-context';
import { formatCurrency, cn } from '@/lib/utils';
import type { RevenueTransaction, Tenancy, Property, Tenant } from '@/lib/types';
import { startOfToday, isBefore, format } from 'date-fns';
import { ArrearsSummary } from '@/components/dashboard/arrears-summary';
import Link from 'next/link';
import { GenerateReportDialog } from '@/components/generate-report-dialog';
import { Skeleton } from '@/components/ui/skeleton';

interface ArrearDetail {
  tenancyId: string;
  tenantName: string;
  propertyName: string;
  amountOwed: number;
  lastPaymentDate: Date | null;
  dueDate: Date;
  daysOverdue: number;
}

export default function ArrearsClient() {
  const { user } = useUser();
  const { revenue, tenancies, properties, tenants, loading: dataContextLoading, error: dataContextError } = useDataContext();
  
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [reportData, setReportData] = useState<{ title: string; content: string } | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [arrearToDelete, setArrearToDelete] = useState<ArrearDetail | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLoading = dataContextLoading;
  const error = dataContextError;

  const tenantMap = useMemo(() => {
    return new Map(tenants.map(t => [t.id, t]));
  }, [tenants]);

  const propertyMap = useMemo(() => {
    return new Map(properties.map(p => [p.id, p]));
  }, [properties]);

  const arrearsDetails = useMemo(() => {
    if (!user || isLoading) return [];

    const allArrears: ArrearDetail[] = [];

    tenancies.forEach(tenancy => {
      const relatedRevenue = revenue.filter(tx => tx.tenancyId === tenancy.id && tx.status === 'Overdue');
      
      if (relatedRevenue.length > 0) {
        const amountOwed = relatedRevenue.reduce((sum, tx) => sum + tx.amount, 0);
        const latestOverdueTx = relatedRevenue.sort((a, b) => b.date.toDate().getTime() - a.date.toDate().getTime())[0];
        const dueDate = latestOverdueTx ? latestOverdueTx.date.toDate() : new Date();
        const daysOverdue = latestOverdueTx ? Math.floor((startOfToday().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) : 0;

        const tenant = tenantMap.get(tenancy.tenantId);
        const property = propertyMap.get(tenancy.propertyId);

        if (tenant && property) {
          allArrears.push({
            tenancyId: tenancy.id!,
            tenantName: `${tenant.firstName} ${tenant.lastName}`,
            propertyName: property.name,
            amountOwed,
            lastPaymentDate: null, // This would require looking up 'Paid' transactions, more complex.
            dueDate,
            daysOverdue: Math.max(0, daysOverdue),
          });
        }
      }
    });

    return allArrears.sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [user, revenue, tenancies, properties, tenants, isLoading, tenantMap, propertyMap]);

  const totalPortfolioArrears = useMemo(() => {
    return arrearsDetails.reduce((sum, arrear) => sum + arrear.amountOwed, 0);
  }, [arrearsDetails]);

  const handleGenerateReport = async () => {
    if (!user) return;
    setIsGeneratingReport(true);
    try {
        const reportSummary = arrearsDetails.map(a => 
            `- Tenancy ID: ${a.tenancyId}, Tenant: ${a.tenantName}, Property: ${a.propertyName}, Amount Owed: ${formatCurrency(a.amountOwed, 'en-KE', 'KES')}, Due Date: ${format(a.dueDate, 'P')}, Days Overdue: ${a.daysOverdue}`
        ).join('\n');

        const prompt = `Generate a detailed arrears report based on the following overdue tenancies:\n${reportSummary}\n\nHighlight key figures, oldest overdue accounts, and suggest actions.`;
        
        const response = await fetch('/api/generate-report', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt, reportType: 'Arrears' }),
        });

        if (!response.ok) {
            throw new Error('Failed to generate report');
        }

        const data = await response.json();
        setReportData({ title: "Arrears Report", content: data.report });
        setIsReportDialogOpen(true);

    } catch (err) {
        console.error("Error generating report:", err);
        // Display error to user
    } finally {
        setIsGeneratingReport(false);
    }
  };

  const handleDismissArrear = (arrear: ArrearDetail) => {
    setArrearToDelete(arrear);
    setDeleteConfirmationOpen(true);
  };

  const confirmDismiss = async () => {
    if (!arrearToDelete || !user) return;
    setIsSubmitting(true);
    try {
      const batch = writeBatch(firestore);

      // Find all overdue revenue transactions for this tenancy and mark them as waived or update their status
      const overdueTransactions = revenue.filter(
        (tx) => tx.tenancyId === arrearToDelete.tenancyId && tx.status === 'Overdue'
      );

      for (const tx of overdueTransactions) {
        const txRef = doc(firestore, 'revenue', tx.id!);
        batch.update(txRef, { status: 'Waived', updatedAt: new Date() }); // Or 'Paid' if being settled externally
      }

      await batch.commit();
      setArrearToDelete(null);
      setDeleteConfirmationOpen(false);
    } catch (e) {
      console.error("Error dismissing arrear: ", e);
    } finally {
      setIsSubmitting(false);
    }
  };


  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
            <CardContent><Skeleton className="h-10 w-1/2" /></CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    const errorMessage = typeof error === 'string' ? error : (error as Error).message || String(error);
    return <div className="text-destructive">Error loading arrears: {errorMessage}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Arrears Management</h1>
        <Button onClick={handleGenerateReport} disabled={isGeneratingReport || arrearsDetails.length === 0}>
          {isGeneratingReport ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <FileText className="mr-2 h-5 w-5" />}
          Generate Arrears Report
        </Button>
      </div>

      {arrearsDetails.length === 0 && !isLoading ? (
        <Card className="text-center py-8">
          <CardHeader>
            <CardTitle className="text-2xl font-semibold">No Overdue Payments</CardTitle>
            <CardDescription>All tenancies are currently up-to-date. Great job!</CardDescription>
          </CardHeader>
          <CardContent className="mt-4">
            <Button asChild>
              <Link href="/revenue"><BarChart className="mr-2 h-5 w-5" /> View All Revenue</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <ArrearsSummary totalArrears={totalPortfolioArrears} numberOfTenantsInArrears={arrearsDetails.length} longestArrearsDays={Math.max(...arrearsDetails.map(a => a.daysOverdue), 0)} />

          <Card>
            <CardHeader>
              <CardTitle>Overdue Tenancies</CardTitle>
              <CardDescription>Details of all outstanding rental payments.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-border">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Property</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Tenant</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Amount Owed</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Due Date</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Days Overdue</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border bg-background">
                    {arrearsDetails.map((arrear) => (
                      <tr key={arrear.tenancyId}>
                        <td className="px-4 py-3 font-medium">{arrear.propertyName}</td>
                        <td className="px-4 py-3">{arrear.tenantName}</td>
                        <td className="px-4 py-3 text-destructive font-semibold">
                          {formatCurrency(arrear.amountOwed, 'en-KE', 'KES')}
                        </td>
                        <td className="px-4 py-3">{format(arrear.dueDate, 'PPP')}</td>
                        <td className="px-4 py-3">
                          <span className={cn("font-medium", arrear.daysOverdue > 30 ? "text-red-500" : "text-yellow-500")}>
                            {arrear.daysOverdue} days
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="outline" size="sm" onClick={() => handleDismissArrear(arrear)} disabled={isSubmitting}>
                            Dismiss
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <AlertDialog open={deleteConfirmationOpen} onOpenChange={setDeleteConfirmationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Dismiss Arrear</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to dismiss the overdue payment for 
              <span className="font-bold">{arrearToDelete?.tenantName}</span> (Property: 
              <span className="font-bold">{arrearToDelete?.propertyName}</span>)?
              This will mark all associated overdue transactions as 'Waived'.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDismiss} disabled={isSubmitting} className="bg-primary text-primary-foreground hover:bg-primary/90">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Dismiss Arrear
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {reportData && (
        <GenerateReportDialog
          open={isReportDialogOpen}
          onOpenChange={setIsReportDialogOpen}
          title={reportData.title}
          content={reportData.content}
        />
      )}
    </div>
  );
}
