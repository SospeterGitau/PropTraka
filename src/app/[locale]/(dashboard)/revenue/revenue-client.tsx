
'use client';


import { useState, useEffect, memo, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MoreHorizontal, PlusCircle, Users } from 'lucide-react';
import { format, startOfToday, isBefore } from 'date-fns';
import type { Transaction, Tenancy, RevenueTransaction } from '@/lib/types';
import { useUser } from '@/firebase/auth';
import { useDataContext } from '@/app/contexts/data-context';
import { parseDate, formatCurrency, cn } from '@/lib/utils';
import { getLocale } from '@/lib/locales';
import { deleteTenancyRevenue } from '@/app/actions/revenue';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuLabel, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';

interface RevenueClientProps {
  initialRevenue: Transaction[];
  initialTenancies: Tenancy[];
}

interface TenancyWithMetrics extends Tenancy {
  transactions: RevenueTransaction[];
  nextDueDate?: string;
}

const RevenueClient = memo(function RevenueClient({ initialRevenue, initialTenancies }: RevenueClientProps) {
  const { user } = useUser();
  const { settings } = useDataContext(); // Keep only for settings
  const router = useRouter();
  const currency = settings?.currency || 'KES';
  const locale = settings?.locale || 'en-KE';

  const [revenue, setRevenue] = useState<Transaction[]>(initialRevenue);
  const [tenanciesData, setTenanciesData] = useState<Tenancy[]>(initialTenancies);

  useEffect(() => {
    setRevenue(initialRevenue);
    setTenanciesData(initialTenancies);
  }, [initialRevenue, initialTenancies]);



  // State
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [formattedDates, setFormattedDates] = useState<{ [key: string]: string }>({});

  // Join Transactions to Tenancies
  const tenanciesWithMetrics: TenancyWithMetrics[] = useMemo(() => {
    return tenanciesData.map(tenancy => {
      const tenancyTransactions = revenue.filter(tx => {
        const rTx = tx as unknown as RevenueTransaction;
        // Cast to any to avoid TS overlap error with Expense type or other inferred literal types
        return ((rTx as any).type === 'revenue' || (rTx as any).type === 'income') &&
          rTx.tenancyId === tenancy.id;
      }) as unknown as RevenueTransaction[];

      const sortedTransactions = tenancyTransactions.sort((a, b) => {
        const aDate = parseDate(a.date)?.getTime() ?? 0;
        const bDate = parseDate(b.date)?.getTime() ?? 0;
        return aDate - bDate;
      });

      const unpaidTransactions = sortedTransactions.filter(tx => {
        const totalServiceCharges = (tx.serviceCharges || []).reduce((sum: number, sc: any) => sum + sc.amount, 0);
        const due = (tx.rent ?? 0) + totalServiceCharges + (tx.deposit ?? 0);
        const paid = tx.amountPaid ?? 0;
        return paid < due;
      });

      const today = startOfToday();
      const earliestOverdue = unpaidTransactions.find(tx => tx.date && isBefore(parseDate(tx.date) ?? new Date(0), today));
      const nextUpcoming = unpaidTransactions.find(tx => !tx.date || !isBefore(parseDate(tx.date) ?? new Date(0), today));
      const nextDueTransaction = earliestOverdue || nextUpcoming;

      return {
        ...tenancy,
        transactions: tenancyTransactions,
        nextDueDate: nextDueTransaction?.date,
      };
    });
  }, [revenue, tenanciesData]);



  useEffect(() => {
    const formatAllDates = async () => {
      const localeData = await getLocale(locale);
      const newFormattedDates: { [key: string]: string } = {};

      for (const tenancy of tenanciesWithMetrics) {
        if (tenancy.startDate && !newFormattedDates[`${tenancy.id}-start`]) {
          const d = parseDate(tenancy.startDate);
          if (d) newFormattedDates[`${tenancy.id}-start`] = format(d, 'PP', { locale: localeData });
        }
        if (tenancy.endDate && !newFormattedDates[`${tenancy.id}-end`]) {
          const d = parseDate(tenancy.endDate);
          if (d) newFormattedDates[`${tenancy.id}-end`] = format(d, 'PP', { locale: localeData });
        }
        if (tenancy.nextDueDate && !newFormattedDates[`${tenancy.id}-nextDue`]) {
          const d = parseDate(tenancy.nextDueDate);
          if (d) newFormattedDates[`${tenancy.id}-nextDue`] = format(d, 'PP', { locale: localeData });
        }
      }
      setFormattedDates(newFormattedDates);
    };
    formatAllDates();
  }, [tenanciesWithMetrics, locale]);




  const handleDeleteTenancy = (tenancy: Tenancy) => {
    setSelectedTransaction({ tenancyId: tenancy.id, tenant: tenancy.tenantName, propertyName: tenancy.propertyName } as any); // Partial Object for dialog
    setIsDeleteDialogOpen(true);
  };


  const confirmDelete = async () => {
    if (selectedTransaction && user) {
      // Cast to access tenancyId safely, assuming we only delete tenancies/revenue here
      const rTx = selectedTransaction as unknown as RevenueTransaction;
      if (!rTx.tenancyId) return;

      const tid = rTx.tenancyId;

      // Optimistic Update
      const previousRevenue = [...revenue];
      setRevenue(prev => prev.filter(tx => (tx as any).tenancyId !== tid));
      setIsDeleteDialogOpen(false);

      try {
        await deleteTenancyRevenue(tid);
        router.refresh();
      } catch (error) {
        console.error("Failed to delete", error);
        // Revert
        setRevenue(previousRevenue);
        alert("Failed to delete tenancy revenue.");
      }
      setSelectedTransaction(null);
    }
  };


  // No loading state needed as data is pre-fetched server-side
  // But we can keep skeleton if we want to simulate loading during transition? 
  // For now, removing check for isDataLoading

  return (
    <>
      <PageHeader title="Revenue">
        <Button asChild>
          <Link href="/revenue/add">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Tenancy
          </Link>
        </Button>
      </PageHeader>
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle>Your Tenancies</CardTitle>
          <CardDescription>An overview of all tenancy agreements and their financial status.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {tenanciesWithMetrics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
              <Users className="w-16 h-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold">No Tenancies Found</h3>
              <p className="text-muted-foreground mb-4">Track revenue by creating your first tenancy.</p>
              <Button asChild>
                <Link href="/revenue/add">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Tenancy
                </Link>
              </Button>
            </div>
          ) : (
            <>
              {/* Desktop View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tenant &amp; Property</TableHead>
                      <TableHead>Tenancy Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Total Due</TableHead>
                      <TableHead className="text-right">Total Paid</TableHead>
                      <TableHead className="text-right">Total Balance</TableHead>
                      <TableHead className="w-[100px] text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tenanciesWithMetrics.sort((a, b) => {
                      const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                      const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                      return bDate - aDate;
                    }).map((tenancy) => {
                      const totalDue = tenancy.transactions.reduce((sum, tx) => sum + (tx.rent ?? 0) + ((tx.serviceCharges || []).reduce((scSum, s) => scSum + s.amount, 0)) + (tx.deposit ?? 0), 0);
                      const totalPaid = tenancy.transactions.reduce((sum, tx) => sum + (tx.amountPaid ?? 0), 0);
                      const totalBalance = totalDue - totalPaid;



                      const today = startOfToday();
                      const isTenancyActive = tenancy.startDate && tenancy.endDate && isBefore(new Date(tenancy.startDate), today) && isBefore(today, new Date(tenancy.endDate));


                      let statusBadge: React.ReactNode;
                      const hasOverdue = tenancy.nextDueDate && isBefore(new Date(tenancy.nextDueDate), today);

                      if (hasOverdue) {
                        statusBadge = <Badge variant="destructive">Overdue</Badge>
                      } else if (tenancy.nextDueDate && !hasOverdue) {
                        statusBadge = <Badge variant="default">Upcoming</Badge>
                      } else if (!isTenancyActive && totalBalance <= 0) {
                        statusBadge = <Badge variant="secondary">Completed</Badge>;
                      } else if (isTenancyActive && totalBalance <= 0) {
                        statusBadge = <Badge variant="secondary">Paid Up</Badge>;
                      } else {
                        statusBadge = <Badge variant="outline">N/A</Badge>;
                      }

                      return (
                        <TableRow key={tenancy.id}>
                          <TableCell>
                            <Link href={`/revenue/${tenancy.id}`} className="font-medium text-primary underline">
                              {tenancy.tenantName}
                            </Link>
                            <div className="text-sm text-muted-foreground">{tenancy.propertyName}</div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formattedDates[`${tenancy.id}-start`]} - {formattedDates[`${tenancy.id}-end`]}
                          </TableCell>
                          <TableCell>
                            {statusBadge}
                          </TableCell>
                          <TableCell className="text-right">{formatCurrency(totalDue, locale, currency)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(totalPaid, locale, currency)}</TableCell>
                          <TableCell className={cn("text-right", totalBalance > 0 && 'text-destructive')}>
                            {formatCurrency(totalBalance, locale, currency)}
                          </TableCell>
                          <TableCell className="text-center">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button aria-haspopup="true" size="icon" variant="ghost">
                                  <MoreHorizontal className="h-4 w-4" />
                                  <span className="sr-only">Toggle menu</span>
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Tenancy Actions</DropdownMenuLabel>
                                <DropdownMenuItem asChild>
                                  <Link href={`/revenue/${tenancy.id}`}>View Details</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link href={`/revenue/edit/${tenancy.id}`}>Edit Tenancy</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem onSelect={() => handleDeleteTenancy(tenancy)}>Delete Tenancy</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-4">
                {tenanciesWithMetrics.sort((a, b) => {
                  const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                  const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                  return bDate - aDate;
                }).map((tenancy) => {
                  const totalDue = tenancy.transactions.reduce((sum, tx) => sum + (tx.rent ?? 0) + ((tx.serviceCharges || []).reduce((scSum, s) => scSum + s.amount, 0)) + (tx.deposit ?? 0), 0);
                  const totalPaid = tenancy.transactions.reduce((sum, tx) => sum + (tx.amountPaid ?? 0), 0);
                  const totalBalance = totalDue - totalPaid;



                  const today = startOfToday();
                  const isTenancyActive = tenancy.startDate && tenancy.endDate && isBefore(new Date(tenancy.startDate), today) && isBefore(today, new Date(tenancy.endDate));


                  let statusBadge: React.ReactNode;
                  const hasOverdue = tenancy.nextDueDate && isBefore(new Date(tenancy.nextDueDate), today);

                  if (hasOverdue) {
                    statusBadge = <Badge variant="destructive">Overdue</Badge>
                  } else if (tenancy.nextDueDate && !hasOverdue) {
                    statusBadge = <Badge variant="default">Upcoming</Badge>
                  } else if (!isTenancyActive && totalBalance <= 0) {
                    statusBadge = <Badge variant="secondary">Completed</Badge>;
                  } else if (isTenancyActive && totalBalance <= 0) {
                    statusBadge = <Badge variant="secondary">Paid Up</Badge>;
                  } else {
                    statusBadge = <Badge variant="outline">N/A</Badge>;
                  }

                  return (
                    <div key={tenancy.id} className="bg-card rounded-lg p-4 shadow-md flex flex-col gap-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-base">{tenancy.tenantName}</h3>
                          <p className="text-sm text-muted-foreground">{tenancy.propertyName}</p>
                        </div>
                        {statusBadge}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-sm border-t pt-2 mt-1">
                        <div>
                          <p className="text-muted-foreground text-xs">Total Due</p>
                          <p className="font-medium">{formatCurrency(totalDue, locale, currency)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground text-xs">Balance</p>
                          <p className={cn("font-medium", totalBalance > 0 && 'text-destructive')}>{formatCurrency(totalBalance, locale, currency)}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-muted-foreground text-xs">Tenancy Period</p>
                          <p className="font-medium">{formattedDates[`${tenancy.id}-start`]} - {formattedDates[`${tenancy.id}-end`]}</p>
                        </div>
                      </div>

                      <Button variant="outline" className="w-full mt-2 h-11" asChild>
                        <Link href={`/revenue/${tenancy.id}`}>Manage Tenancy</Link>
                      </Button>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        itemName={`tenancy for ${(selectedTransaction as any)?.tenant} at ${(selectedTransaction as any)?.propertyName}`}
      />
    </>
  );
});

export default RevenueClient;