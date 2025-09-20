
'use client';

import { useState, useEffect } from 'react';
import { MoreHorizontal, ChevronDown, ChevronRight } from 'lucide-react';
import { format, eachMonthOfInterval } from 'date-fns';
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';

function formatAddress(property: Property) {
  return `${property.addressLine1}, ${property.city}, ${property.state} ${property.postalCode}`;
}


// A simple form dialog for adding/editing revenue.
function RevenueForm({
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
    const tenant = formData.get('tenant') as string;
    const tenantEmail = formData.get('tenantEmail') as string;
    const amount = Number(formData.get('amount'));
    const deposit = Number(formData.get('deposit'));
    
    // Check for existing tenant at the same property
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
    
    // Explicitly parse date parts to avoid timezone issues during comparison
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

    const newTransactions = months.map((monthStartDate, index) => {
      // Use a consistent ID scheme for the tenancy
      const tenancyId = transaction?.tenancyId || `t${Date.now()}`;
      return {
        id: `${tenancyId}-${index}`,
        tenancyId: tenancyId,
        date: format(monthStartDate, 'yyyy-MM-dd'),
        amount: amount,
        propertyName: selectedProperty ? formatAddress(selectedProperty) : 'N/A',
        tenant: tenant,
        tenantEmail: tenantEmail,
        type: 'revenue' as const,
        propertyId: propertyId,
        // Deposit is only due on the first month
        deposit: index === 0 ? deposit : 0,
        // For new entries, default amountPaid to 0. Editing preserves old values if they exist.
        amountPaid: 0,
        tenancyStartDate: tenancyStartDateStr,
        tenancyEndDate: tenancyEndDateStr,
      };
    });

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
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
           <div>
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
          <div>
            <Label>Tenant</Label>
            <Input name="tenant" defaultValue={transaction?.tenant} required />
          </div>
           <div>
            <Label>Tenant Email</Label>
            <Input name="tenantEmail" type="email" defaultValue={transaction?.tenantEmail} required />
          </div>
           <div>
            <Label>Tenancy Start Date</Label>
            <Input name="tenancyStartDate" type="date" defaultValue={transaction?.tenancyStartDate ? format(new Date(transaction.tenancyStartDate), 'yyyy-MM-dd') : ''} required />
          </div>
          <div>
            <Label>Tenancy End Date</Label>
            <Input name="tenancyEndDate" type="date" defaultValue={transaction?.tenancyEndDate ? format(new Date(transaction.tenancyEndDate), 'yyyy-MM-dd') : ''} required />
          </div>
          <div>
            <Label>Monthly Rent</Label>
            <Input name="amount" type="number" defaultValue={transaction?.amount} required />
          </div>
          <div>
            <Label>Deposit (due with first month's rent)</Label>
            <Input name="deposit" type="number" defaultValue={transaction?.deposit} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PaymentForm({
  isOpen,
  onClose,
  onSubmit,
  transaction,
  locale,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transactionId: string, amount: number) => void;
  transaction: Transaction | null;
  locale: string;
}) {
  const [formattedDate, setFormattedDate] = useState('');

  useEffect(() => {
    const formatDateAsync = async () => {
      if (transaction) {
        const localeData = await getLocale(locale);
        setFormattedDate(format(new Date(transaction.date), 'MMMM dd, yyyy', { locale: localeData }));
      }
    };
    formatDateAsync();
  }, [transaction, locale]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!transaction) return;
    const formData = new FormData(event.currentTarget);
    const amountPaid = Number(formData.get('amountPaid'));
    onSubmit(transaction.id, amountPaid);
    onClose();
  };

  if (!isOpen || !transaction) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <div className="text-sm text-muted-foreground">
          For {transaction.tenant} at {transaction.propertyName} (Due: {formattedDate})
        </div>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amountPaid" className="text-right">Amount Paid</Label>
              <Input id="amountPaid" name="amountPaid" type="number" step="0.01" defaultValue={transaction.amountPaid || ''} className="col-span-3" required />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save Payment</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


export default function RevenuePage() {
  const { properties, revenue, setRevenue, formatCurrency, locale } = useDataContext();
  const [isTenancyFormOpen, setIsTenancyFormOpen] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [formattedDates, setFormattedDates] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const formatAllDates = async () => {
      const localeData = await getLocale(locale);
      const newFormattedDates: { [key: string]: string } = {};
      for (const item of revenue) {
        newFormattedDates[`${item.id}-due`] = format(new Date(item.date), 'MMM dd, yyyy', { locale: localeData });
        if(item.tenancyStartDate) {
          newFormattedDates[`${item.id}-start`] = format(new Date(item.tenancyStartDate), 'MMM dd, yyyy', { locale: localeData });
        }
        if(item.tenancyEndDate) {
          newFormattedDates[`${item.id}-end`] = format(new Date(item.tenancyEndDate), 'MMM dd, yyyy', { locale: localeData });
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
  
  const handleRecordPayment = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsPaymentFormOpen(true);
  };

  const handleDeleteTenancy = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedTransaction) {
      // Delete all transactions related to the same tenancy
      setRevenue(revenue.filter((item) => item.tenancyId !== selectedTransaction.tenancyId));
      setIsDeleteDialogOpen(false);
      setSelectedTransaction(null);
    }
  };

  const handleTenancyFormSubmit = (data: Transaction[]) => {
    const tenancyId = data[0].tenancyId;
    // Remove existing transactions for this tenancy before adding/updating
    const otherTenancies = revenue.filter(r => r.tenancyId !== tenancyId);
    
    // Attempt to preserve payment status on edit
    const updatedData = data.map(newTx => {
      const existingTx = revenue.find(oldTx => oldTx.id === newTx.id);
      return existingTx ? { ...newTx, amountPaid: existingTx.amountPaid } : newTx;
    });

    setRevenue([...otherTenancies, ...updatedData]);
    setIsTenancyFormOpen(false);
    setSelectedTransaction(null);
  };

  const handlePaymentFormSubmit = (transactionId: string, amount: number) => {
    setRevenue(revenue.map(tx => 
      tx.id === transactionId ? { ...tx, amountPaid: amount } : tx
    ));
    setIsPaymentFormOpen(false);
    setSelectedTransaction(null);
  };

  // Group transactions by tenancyId
  const tenancies = revenue.reduce((acc, tx) => {
    const tenancyId = tx.tenancyId || `no-id-${tx.id}`;
    if (!acc[tenancyId]) {
      acc[tenancyId] = {
        ...tx, // Use first transaction as representative
        transactions: [],
      };
    }
    acc[tenancyId].transactions.push(tx);
    return acc;
  }, {} as Record<string, Transaction & { transactions: Transaction[] }>);

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
                <TableHead className="w-[60px]"></TableHead>
                <TableHead>Tenant & Property</TableHead>
                <TableHead>Tenancy Period</TableHead>
                <TableHead className="text-right">Total Due</TableHead>
                <TableHead className="text-right">Total Paid</TableHead>
                <TableHead className="text-right">Total Balance</TableHead>
                <TableHead className="w-[100px] text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.values(tenancies).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((tenancy) => {
                const totalDue = tenancy.transactions.reduce((sum, tx) => sum + tx.amount + (tx.deposit ?? 0), 0);
                const totalPaid = tenancy.transactions.reduce((sum, tx) => sum + (tx.amountPaid ?? 0), 0);
                const totalBalance = totalDue - totalPaid;
                
                return (
                  <Collapsible asChild key={tenancy.tenancyId} tag="tbody">
                    <>
                      <TableRow className="font-semibold bg-transparent hover:bg-muted/50">
                        <TableCell>
                           <CollapsibleTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ChevronRight className="h-4 w-4 transition-transform [&[data-state=open]]:rotate-90" />
                              </Button>
                           </CollapsibleTrigger>
                        </TableCell>
                        <TableCell>
                          <div>{tenancy.tenant}</div>
                          <div className="text-sm text-muted-foreground font-normal">{tenancy.propertyName}</div>
                        </TableCell>
                        <TableCell className="font-normal">{formattedDates[`${tenancy.id}-start`]} - {formattedDates[`${tenancy.id}-end`]}</TableCell>
                        <TableCell className="text-right font-normal">{formatCurrency(totalDue)}</TableCell>
                        <TableCell className="text-right font-normal">{formatCurrency(totalPaid)}</TableCell>
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
                              <DropdownMenuItem onSelect={() => handleEditTenancy(tenancy)}>Edit Tenancy</DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => handleDeleteTenancy(tenancy)}>Delete Tenancy</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      <CollapsibleContent asChild>
                        <tr>
                          <TableCell colSpan={7} className="p-0">
                             <div className="p-4 bg-muted/50">
                               <h4 className="font-semibold mb-2">Monthly Breakdown</h4>
                               <Table>
                                 <TableHeader>
                                   <TableRow>
                                     <TableHead>Due Date</TableHead>
                                     <TableHead>Rent</TableHead>
                                     <TableHead>Deposit</TableHead>
                                     <TableHead className="text-right">Amount Paid</TableHead>
                                     <TableHead className="text-right">Balance</TableHead>
                                     <TableHead className="text-center">Action</TableHead>
                                   </TableRow>
                                 </TableHeader>
                                 <TableBody>
                                   {tenancy.transactions.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(tx => {
                                     const due = tx.amount + (tx.deposit ?? 0);
                                     const paid = tx.amountPaid ?? 0;
                                     const balance = due - paid;
                                     return (
                                        <TableRow key={tx.id}>
                                          <TableCell>{formattedDates[`${tx.id}-due`]}</TableCell>
                                          <TableCell>{formatCurrency(tx.amount)}</TableCell>
                                          <TableCell>{formatCurrency(tx.deposit ?? 0)}</TableCell>
                                          <TableCell className="text-right">{formatCurrency(paid)}</TableCell>
                                           <TableCell className={cn("text-right", balance > 0 && 'text-destructive', balance === 0 && 'text-green-600')}>
                                            {formatCurrency(balance)}
                                          </TableCell>
                                          <TableCell className="text-center">
                                            <Button size="sm" variant="outline" onClick={() => handleRecordPayment(tx)}>
                                              Record Payment
                                            </Button>
                                          </TableCell>
                                        </TableRow>
                                     )
                                   })}
                                 </TableBody>
                               </Table>
                             </div>
                          </TableCell>
                        </tr>
                      </CollapsibleContent>
                    </>
                  </Collapsible>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <RevenueForm
        isOpen={isTenancyFormOpen}
        onClose={() => setIsTenancyFormOpen(false)}
        onSubmit={handleTenancyFormSubmit}
        transaction={selectedTransaction}
        properties={properties}
        revenue={revenue}
      />

      <PaymentForm
        isOpen={isPaymentFormOpen}
        onClose={() => setIsPaymentFormOpen(false)}
        onSubmit={handlePaymentFormSubmit}
        transaction={selectedTransaction}
        locale={locale}
      />

      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        itemName={`tenancy for ${selectedTransaction?.tenant} at ${selectedTransaction?.propertyName}`}
      />
    </>
  );
}

    

    