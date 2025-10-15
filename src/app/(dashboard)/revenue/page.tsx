'use client';

import { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import { format, startOfToday, eachMonthOfInterval, isAfter, isBefore } from 'date-fns';
import { useDataContext } from '@/context/data-context';
import type { Property, Transaction } from '@/lib/types';
import { getLocale } from '@/lib/locales';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';

function formatAddress(property: Property) {
  return `${property.addressLine1}, ${property.city}, ${property.state} ${property.postalCode}`;
}

const RevenueForm = memo(function RevenueForm({
  isOpen,
  onClose,
  onSubmit,
  transaction,
  properties,
  revenue,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Transaction[]) => void;
  transaction?: Transaction | null;
  properties: Property[],
  revenue: Transaction[],
}) {
  const { toast } = useToast();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const tenancyStartDateStr = formData.get('tenancyStartDate') as string;
    const tenancyEndDateStr = formData.get('tenancyEndDate') as string;
    const propertyId = formData.get('propertyId') as string;
    const selectedProperty = properties.find(p => p.id === propertyId);
    const tenant = formData.get('tenantName') as string;
    const tenantEmail = formData.get('tenantEmail') as string;
    const tenantPhone = formData.get('tenantPhone') as string;
    const amount = Number(formData.get('amount'));
    const deposit = Number(formData.get('deposit'));
    const contractUrl = formData.get('contractUrl') as string;
    const notes = formData.get('notes') as string;
    const consent = formData.get('consent') as string;

    if (!consent) {
        toast({
            variant: "destructive",
            title: "Consent Required",
            description: "You must confirm the tenant has consented to their data being stored.",
        });
        return;
    }
    
    const isEditing = !!transaction;
    const existingTenancy = revenue.find(
      (t) =>
        t.tenant?.toLowerCase() === tenant.toLowerCase() &&
        t.propertyId === propertyId &&
        (!isEditing || t.tenancyId !== transaction.tenancyId)
    );

    if (existingTenancy) {
      toast({
        variant: "destructive",
        title: "Duplicate Tenancy",
        description: `A tenancy for "${tenant}" already exists at this property.`,
      });
      return;
    }

    if (!tenancyStartDateStr || !tenancyEndDateStr) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Tenancy start and end dates are required.",
      });
      return;
    }
    
    const [startYear, startMonth, startDay] = tenancyStartDateStr.split('-').map(Number);
    const [endYear, endMonth, endDay] = tenancyEndDateStr.split('-').map(Number);
    const tenancyStartDate = new Date(Date.UTC(startYear, startMonth - 1, startDay));
    const tenancyEndDate = new Date(Date.UTC(endYear, endMonth - 1, endDay));

    if (tenancyEndDate < tenancyStartDate) {
      toast({
        variant: "destructive",
        title: "Invalid Date Range",
        description: "Tenancy end date cannot be before the start date.",
      });
      return;
    }

    const months = eachMonthOfInterval({
      start: tenancyStartDate,
      end: tenancyEndDate,
    });

    const tenancyId = transaction?.tenancyId || `t${Date.now()}`;
    const newTransactions = months.map((monthStartDate, index) => ({
        id: `${tenancyId}-${index}`,
        tenancyId: tenancyId,
        date: format(monthStartDate, 'yyyy-MM-dd'),
        amount: amount,
        propertyName: selectedProperty ? formatAddress(selectedProperty) : 'N/A',
        tenant: tenant,
        tenantEmail: tenantEmail,
        tenantPhone: tenantPhone,
        type: 'revenue' as const,
        propertyId: propertyId,
        deposit: index === 0 ? deposit : 0,
        amountPaid: 0,
        tenancyStartDate: tenancyStartDateStr,
        tenancyEndDate: tenancyEndDateStr,
        contractUrl: contractUrl,
        notes: index === 0 ? notes : undefined,
      }));

    onSubmit(newTransactions);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{transaction ? 'Edit' : 'Add'} Tenancy</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 max-h-[80vh] overflow-y-auto pr-2">
           <div className="space-y-2">
            <Label>Property</Label>
             <Select name="propertyId" defaultValue={transaction?.propertyId} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map(property => (
                  <SelectItem key={property.id} value={property.id}>{formatAddress(property)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Tenant Name</Label>
            <Input name="tenantName" defaultValue={transaction?.tenant} required />
          </div>
           <div className="space-y-2">
            <Label>Tenant Email</Label>
            <Input name="tenantEmail" type="email" defaultValue={transaction?.tenantEmail} required />
          </div>
          <div className="space-y-2">
            <Label>Tenant Phone</Label>
            <Input name="tenantPhone" type="tel" defaultValue={transaction?.tenantPhone} />
          </div>
           <div className="space-y-2">
            <Label>Tenancy Start Date</Label>
            <Input name="tenancyStartDate" type="date" defaultValue={transaction?.tenancyStartDate ? format(new Date(transaction.tenancyStartDate), 'yyyy-MM-dd') : ''} required />
          </div>
          <div className="space-y-2">
            <Label>Tenancy End Date</Label>
            <Input name="tenancyEndDate" type="date" defaultValue={transaction?.tenancyEndDate ? format(new Date(transaction.tenancyEndDate), 'yyyy-MM-dd') : ''} required />
          </div>
          <div className="space-y-2">
            <Label>Monthly Rent</Label>
            <Input name="amount" type="number" defaultValue={transaction?.amount} required />
          </div>
          <div className="space-y-2">
            <Label>Deposit (due with first month's rent)</Label>
            <Input name="deposit" type="number" defaultValue={transaction?.deposit} />
          </div>
          <div className="space-y-2">
            <Label>Contract Link (optional)</Label>
            <Input name="contractUrl" type="url" defaultValue={transaction?.contractUrl} placeholder="https://docs.google.com/..." />
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea name="notes" defaultValue={transaction?.notes} />
          </div>
           <div className="items-top flex space-x-2 pt-2">
                <Checkbox id="consent" name="consent" />
                <div className="grid gap-1.5 leading-none">
                    <label
                    htmlFor="consent"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                    I confirm I have the tenant's consent to store and process their personal information in accordance with our privacy policy.
                    </label>
                    <p className="text-sm text-muted-foreground">
                    You can view the <Link href="/privacy" className="text-primary underline">Privacy Policy</Link> for more details.
                    </p>
                </div>
            </div>
          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
});


function RevenuePage() {
  const { properties, revenue, addTenancy, updateTenancy, deleteTenancy, formatCurrency, locale, addChangeLogEntry, isDataLoading } = useDataContext();
  const [isTenancyFormOpen, setIsTenancyFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [formattedDates, setFormattedDates] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (!revenue) return;
    const formatAllDates = async () => {
      const localeData = await getLocale(locale);
      const newFormattedDates: { [key: string]: string } = {};
      for (const item of revenue) {
        if(item.tenancyStartDate) {
          newFormattedDates[`${item.tenancyId}-start`] = format(new Date(item.tenancyStartDate), 'MMM dd, yyyy', { locale: localeData });
        }
        if(item.tenancyEndDate) {
          newFormattedDates[`${item.tenancyId}-end`] = format(new Date(item.tenancyEndDate), 'MMM dd, yyyy', { locale: localeData });
        }
        if(item.nextDueDate) {
            newFormattedDates[`${item.tenancyId}-nextDue`] = format(new Date(item.nextDueDate), 'MMM dd, yyyy', { locale: localeData });
        }
      }
      setFormattedDates(newFormattedDates);
    };
    formatAllDates();
  }, [revenue, locale]);

  const handleAddTenancy = () => {
    setSelectedTransaction(null);
    setIsTenancyFormOpen(true);
  };

  const handleEditTenancy = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsTenancyFormOpen(true);
  };
  
  const handleDeleteTenancy = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedTransaction?.tenancyId) {
      await deleteTenancy(selectedTransaction.tenancyId);
      addChangeLogEntry({
        type: 'Tenancy',
        action: 'Deleted',
        description: `Tenancy for "${selectedTransaction.tenant}" at "${selectedTransaction.propertyName}" was deleted.`,
        entityId: selectedTransaction.tenancyId,
      });
      setIsDeleteDialogOpen(false);
      setSelectedTransaction(null);
    }
  };

  const handleTenancyFormSubmit = async (data: Transaction[]) => {
    if (!revenue) return;
    const tenancyId = data[0].tenancyId!;
    const isEditing = revenue.some(r => r.tenancyId === tenancyId);
    
    if (isEditing) {
      await updateTenancy(data);
    } else {
      await addTenancy(data);
    }
    
    addChangeLogEntry({
      type: 'Tenancy',
      action: isEditing ? 'Updated' : 'Created',
      description: `Tenancy for "${data[0].tenant}" at "${data[0].propertyName}" was ${isEditing ? 'updated' : 'created'}.`,
      entityId: tenancyId,
    });

    setIsTenancyFormOpen(false);
    setSelectedTransaction(null);
  };
  
  if (isDataLoading) {
    return (
        <>
            <PageHeader title="Revenue">
                <Button disabled>Add Tenancy</Button>
            </PageHeader>
            <Card>
                <CardHeader>
                    <CardTitle><Skeleton className="h-6 w-1/2" /></CardTitle>
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-48 w-full" />
                </CardContent>
            </Card>
        </>
    );
  }

  const tenancies = Object.values(
    (revenue || []).reduce((acc, tx) => {
      const tenancyId = tx.tenancyId || `no-id-${tx.id}`;
      if (!acc[tenancyId]) {
        acc[tenancyId] = {
          ...tx,
          transactions: [],
        };
      }
      acc[tenancyId].transactions.push(tx);
      return acc;
    }, {} as Record<string, Transaction & { transactions: Transaction[] }>)
  ).map(tenancy => {
      const today = startOfToday();
      const sortedTransactions = tenancy.transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      const unpaidTransactions = sortedTransactions.filter(tx => {
        const due = tx.amount + (tx.deposit ?? 0);
        const paid = tx.amountPaid ?? 0;
        return paid < due;
      });

      const nextUpcoming = unpaidTransactions.find(tx => !isBefore(new Date(tx.date), today));
      const earliestOverdue = unpaidTransactions.find(tx => isBefore(new Date(tx.date), today));

      const nextDueTransaction = nextUpcoming || earliestOverdue;
      
      return {
          ...tenancy,
          nextDueDate: nextDueTransaction?.date,
      };
  });

  return (
    <>
      <PageHeader title="Revenue">
        <Button onClick={handleAddTenancy}>Add Tenancy</Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Revenue Transactions by Tenancy</CardTitle>
        </CardHeader>
        <CardContent>
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
                {tenancies.length > 0 ? (
                    tenancies.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tenancy) => {
                        const totalDue = tenancy.transactions.reduce((sum, tx) => sum + tx.amount + (tx.deposit ?? 0), 0);
                        const totalPaid = tenancy.transactions.reduce((sum, tx) => sum + (tx.amountPaid ?? 0), 0);
                        const totalBalance = totalDue - totalPaid;
                        
                        const today = startOfToday();
                        const isTenancyActive = tenancy.tenancyStartDate && tenancy.tenancyEndDate && new Date(tenancy.tenancyStartDate) <= today && new Date(tenancy.tenancyEndDate) >= today;

                        let statusBadge;
                        if (tenancy.nextDueDate) {
                            const isOverdue = isBefore(new Date(tenancy.nextDueDate), today);
                            statusBadge = (
                                <Badge variant={isOverdue ? "destructive" : "outline"}>
                                    {isOverdue ? 'Overdue' : 'Upcoming'} {formattedDates[`${tenancy.tenancyId}-nextDue`]}
                                </Badge>
                            );
                        } else if (!isTenancyActive && totalBalance <= 0) {
                            statusBadge = <Badge variant="default">Completed</Badge>;
                        } else if (isTenancyActive && totalBalance <= 0) {
                            statusBadge = <Badge variant="secondary">Paid Up</Badge>;
                        } else {
                            statusBadge = <Badge variant="outline">N/A</Badge>;
                        }

                        return (
                            <TableRow key={tenancy.tenancyId}>
                              <TableCell>
                                <Link href={`/revenue/${tenancy.tenancyId}`} className="font-medium text-primary underline">
                                    {tenancy.tenant}
                                </Link>
                                <div className="text-sm text-muted-foreground">{tenancy.propertyName}</div>
                              </TableCell>
                              <TableCell>{formattedDates[`${tenancy.tenancyId}-start`]} - {formattedDates[`${tenancy.tenancyId}-end`]}</TableCell>
                              <TableCell>
                                 {statusBadge}
                              </TableCell>
                              <TableCell className="text-right">{formatCurrency(totalDue)}</TableCell>
                              <TableCell className="text-right">{formatCurrency(totalPaid)}</TableCell>
                              <TableCell className={cn("text-right", totalBalance > 0 && 'text-destructive')}>
                                {formatCurrency(totalBalance)}
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
                                      <Link href={`/revenue/${tenancy.tenancyId}`}>View Details</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleEditTenancy(tenancy)}>Edit Tenancy</DropdownMenuItem>
                                    <DropdownMenuItem onSelect={() => handleDeleteTenancy(tenancy)}>Delete Tenancy</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </TableCell>
                            </TableRow>
                        );
                    })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No tenancies found. Click "Add Tenancy" to get started.
                    </TableCell>
                  </TableRow>
                )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      {properties && revenue && <RevenueForm
        isOpen={isTenancyFormOpen}
        onClose={() => setIsTenancyFormOpen(false)}
        onSubmit={handleTenancyFormSubmit}
        transaction={selectedTransaction}
        properties={properties}
        revenue={revenue}
      />}

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        itemName={`tenancy for ${selectedTransaction?.tenant} at ${selectedTransaction?.propertyName}`}
      />
    </>
  );
}

export default memo(RevenuePage);
