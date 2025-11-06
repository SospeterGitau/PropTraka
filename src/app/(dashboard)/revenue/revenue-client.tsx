
'use client';

import { useState, useEffect, memo } from 'react';
import Link from 'next/link';
import { MoreHorizontal, PlusCircle, Trash2 } from 'lucide-react';
import { format, startOfToday, eachMonthOfInterval, isAfter, isBefore } from 'date-fns';
import { useDataContext } from '@/context/data-context';
import type { Property, Transaction, ServiceCharge } from '@/lib/types';
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
  tenancyToEdit,
  properties,
  revenue,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Transaction[]) => void;
  tenancyToEdit?: Transaction | null;
  properties: Property[],
  revenue: Transaction[],
}) {
  const { toast } = useToast();
  const [serviceCharges, setServiceCharges] = useState<ServiceCharge[]>([]);

  useEffect(() => {
    if (tenancyToEdit) {
      setServiceCharges(tenancyToEdit.serviceCharges || []);
    } else {
      setServiceCharges([]);
    }
  }, [tenancyToEdit]);
  
  const addServiceCharge = () => {
    setServiceCharges([...serviceCharges, { name: '', amount: 0 }]);
  };
  
  const removeServiceCharge = (index: number) => {
    setServiceCharges(serviceCharges.filter((_, i) => i !== index));
  };

  const handleServiceChargeChange = (index: number, field: 'name' | 'amount', value: string) => {
    const newCharges = [...serviceCharges];
    if (field === 'amount') {
        const numericValue = value === '' ? '' : parseFloat(value);
        (newCharges[index] as any)[field] = numericValue;
    } else {
        (newCharges[index] as any)[field] = value;
    }
    setServiceCharges(newCharges);
  };


  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const isEditing = !!tenancyToEdit;

    const tenancyStartDateStr = formData.get('tenancyStartDate') as string;
    const tenancyEndDateStr = formData.get('tenancyEndDate') as string;
    const propertyId = formData.get('propertyId') as string;
    const selectedProperty = properties.find(p => p.id === propertyId);
    const tenant = formData.get('tenantName') as string;
    const tenantEmail = formData.get('tenantEmail') as string;
    const tenantPhone = formData.get('tenantPhone') as string;
    const rent = Number(formData.get('rent'));
    const deposit = Number(formData.get('deposit'));
    const contractUrl = formData.get('contractUrl') as string;
    const notes = formData.get('notes') as string;
    const consent = formData.get('consent') as string;

    if (!isEditing && !consent) {
        toast({
            variant: "destructive",
            title: "Consent Required",
            description: "You must confirm the tenant has consented to their data being stored.",
        });
        return;
    }
    
    const existingTenancy = revenue.find(
      (t) =>
        t.tenant?.toLowerCase() === tenant.toLowerCase() &&
        t.propertyId === propertyId &&
        (!isEditing || t.tenancyId !== tenancyToEdit.tenancyId)
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

    const tenancyId = tenancyToEdit?.tenancyId || `t${Date.now()}`;
    const existingTransactions = isEditing ? revenue.filter(t => t.tenancyId === tenancyToEdit.tenancyId) : [];

    const finalServiceCharges = serviceCharges
      .map(sc => ({
        name: sc.name,
        amount: Number(sc.amount) || 0,
      }))
      .filter(sc => sc.name && sc.amount > 0);

    const newTransactions = months.map((monthStartDate, index) => {
      const dateStr = format(monthStartDate, 'yyyy-MM-dd');
      const existingTx = existingTransactions.find(tx => tx.date === dateStr);

      const newTx: Partial<Transaction> = {
        tenancyId: tenancyId,
        date: dateStr,
        rent: rent,
        serviceCharges: finalServiceCharges,
        amountPaid: existingTx?.amountPaid || 0,
        propertyId: propertyId,
        propertyName: selectedProperty ? formatAddress(selectedProperty) : 'N/A',
        tenant: tenant,
        tenantEmail: tenantEmail,
        tenantPhone: tenantPhone,
        type: 'revenue' as const,
        deposit: index === 0 ? deposit : 0,
        tenancyStartDate: tenancyStartDateStr,
        tenancyEndDate: tenancyEndDateStr,
        contractUrl: contractUrl,
        ownerId: tenancyToEdit?.ownerId || '',
      };
      
      if (existingTx?.id) {
        newTx.id = existingTx.id;
      }
      
      if (index === 0 && notes) {
        newTx.notes = notes;
      }

      return newTx;
    });

    onSubmit(newTransactions as Transaction[]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{tenancyToEdit ? 'Edit' : 'Add'} Tenancy</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4 max-h-[80vh] overflow-y-auto pr-2">
           <div className="space-y-2">
            <Label>Property</Label>
             <Select name="propertyId" defaultValue={tenancyToEdit?.propertyId} required>
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
            <Input name="tenantName" defaultValue={tenancyToEdit?.tenant} required />
          </div>
           <div className="space-y-2">
            <Label>Tenant Email</Label>
            <Input name="tenantEmail" type="email" defaultValue={tenancyToEdit?.tenantEmail} required />
          </div>
          <div className="space-y-2">
            <Label>Tenant Phone</Label>
            <Input name="tenantPhone" type="tel" defaultValue={tenancyToEdit?.tenantPhone} />
          </div>
           <div className="space-y-2">
            <Label>Tenancy Start Date</Label>
            <Input name="tenancyStartDate" type="date" defaultValue={tenancyToEdit?.tenancyStartDate ? format(new Date(tenancyToEdit.tenancyStartDate), 'yyyy-MM-dd') : ''} required />
          </div>
          <div className="space-y-2">
            <Label>Tenancy End Date</Label>
            <Input name="tenancyEndDate" type="date" defaultValue={tenancyToEdit?.tenancyEndDate ? format(new Date(tenancyToEdit.tenancyEndDate), 'yyyy-MM-dd') : ''} required />
          </div>
          <div className="space-y-2">
            <Label>Monthly Rent</Label>
            <Input name="rent" type="number" defaultValue={tenancyToEdit?.rent} required />
          </div>
          
          <div className="space-y-2">
            <Label>Fixed Monthly Service Charges (optional)</Label>
            <div className="space-y-2 rounded-md border p-4">
              {serviceCharges.map((charge, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input placeholder="Charge Name (e.g., Security)" value={charge.name} onChange={(e) => handleServiceChargeChange(index, 'name', e.target.value)} />
                  <Input type="number" placeholder="Amount" value={charge.amount} onChange={(e) => handleServiceChargeChange(index, 'amount', e.target.value)} className="w-32" />
                  <Button variant="ghost" size="icon" onClick={() => removeServiceCharge(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addServiceCharge} className="w-full">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Service Charge
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Deposit (due with first month's rent)</Label>
            <Input name="deposit" type="number" defaultValue={tenancyToEdit?.deposit} />
          </div>
          <div className="space-y-2">
            <Label>Contract Link (optional)</Label>
            <Input name="contractUrl" type="url" defaultValue={tenancyToEdit?.contractUrl} placeholder="https://docs.google.com/..." />
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea name="notes" defaultValue={tenancyToEdit?.notes} />
          </div>
           {!tenancyToEdit && (
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
            )}
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


function RevenueClient() {
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
        if(item.tenancyId && item.tenancyStartDate && !newFormattedDates[`${item.tenancyId}-start`]) {
          newFormattedDates[`${item.tenancyId}-start`] = format(new Date(item.tenancyStartDate), 'MMM dd, yyyy', { locale: localeData });
        }
        if(item.tenancyId && item.tenancyEndDate && !newFormattedDates[`${item.tenancyId}-end`]) {
          newFormattedDates[`${item.tenancyId}-end`] = format(new Date(item.tenancyEndDate), 'MMM dd, yyyy', { locale: localeData });
        }
        if(item.tenancyId && item.nextDueDate && !newFormattedDates[`${item.tenancyId}-nextDue`]) {
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
        const totalServiceCharges = (tx.serviceCharges || []).reduce((sum, sc) => sum + sc.amount, 0);
        const due = tx.rent + totalServiceCharges + (tx.deposit ?? 0);
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
                        const totalDue = tenancy.transactions.reduce((sum, tx) => sum + tx.rent + ((tx.serviceCharges || []).reduce((scSum, s) => scSum + s.amount, 0)) + (tx.deposit ?? 0), 0);
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
        tenancyToEdit={selectedTransaction}
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

export default memo(RevenueClient);

    