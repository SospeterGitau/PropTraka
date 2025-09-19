'use client';

import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { format, eachMonthOfInterval, startOfMonth } from 'date-fns';
import { useDataContext } from '@/context/data-context';
import type { Transaction } from '@/lib/types';
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

// A simple form dialog for adding/editing revenue.
function RevenueForm({
  isOpen,
  onClose,
  onSubmit,
  transaction,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Transaction[]) => void;
  transaction?: Transaction | null;
}) {
  const { toast } = useToast();

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    const tenancyStartDateStr = formData.get('tenancyStartDate') as string;
    const tenancyEndDateStr = formData.get('tenancyEndDate') as string;
    const propertyName = formData.get('propertyName') as string;
    const tenant = formData.get('tenant') as string;
    const amount = Number(formData.get('amount'));
    const deposit = Number(formData.get('deposit'));

    if (!tenancyStartDateStr || !tenancyEndDateStr) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "Tenancy start and end dates are required.",
      });
      return;
    }

    const tenancyStartDate = new Date(tenancyStartDateStr);
    const tenancyEndDate = new Date(tenancyEndDateStr);

    if (tenancyStartDate > tenancyEndDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Tenancy start date cannot be after the end date.",
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
        propertyName: propertyName,
        tenant: tenant,
        type: 'revenue' as const,
        propertyId: transaction?.propertyId || 'new',
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
            <Input name="propertyName" defaultValue={transaction?.propertyName} required />
          </div>
          <div>
            <Label>Tenant</Label>
            <Input name="tenant" defaultValue={transaction?.tenant} required />
          </div>
           <div>
            <Label>Tenancy Start Date</Label>
            <Input name="tenancyStartDate" type="date" defaultValue={transaction?.tenancyStartDate?.split('T')[0]} required />
          </div>
          <div>
            <Label>Tenancy End Date</Label>
            <Input name="tenancyEndDate" type="date" defaultValue={transaction?.tenancyEndDate?.split('T')[0]} required />
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
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transactionId: string, amount: number) => void;
  transaction: Transaction | null;
}) {
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
          For {transaction.tenant} at {transaction.propertyName} (Due: {format(new Date(transaction.date), 'MMMM dd, yyyy')})
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
  const { revenue, setRevenue } = useDataContext();
  const [isTenancyFormOpen, setIsTenancyFormOpen] = useState(false);
  const [isPaymentFormOpen, setIsPaymentFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch (error) {
      return 'Invalid Date';
    }
  };

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

  return (
    <>
      <PageHeader title="Revenue">
        <Button onClick={handleAddTenancy}>Add Tenancy</Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Revenue Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Due Date</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Tenancy Period</TableHead>
                <TableHead className="text-right">Monthly Rent</TableHead>
                <TableHead className="text-right">Deposit</TableHead>
                <TableHead className="text-right">Amount Due</TableHead>
                <TableHead className="text-right">Amount Paid</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revenue.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((item) => {
                const amountDue = item.amount + (item.deposit ?? 0);
                const balance = amountDue - (item.amountPaid ?? 0);
                return (
                  <TableRow key={item.id}>
                    <TableCell>{formatDate(item.date)}</TableCell>
                    <TableCell>
                      <div className="font-medium">{item.tenant}</div>
                      <div className="text-sm text-muted-foreground">{item.propertyName}</div>
                    </TableCell>
                    <TableCell>{formatDate(item.tenancyStartDate)} - {formatDate(item.tenancyEndDate)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.deposit ?? 0)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(amountDue)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.amountPaid ?? 0)}</TableCell>
                    <TableCell className={`text-right font-semibold ${balance > 0 ? 'text-destructive' : ''}`}>
                      {formatCurrency(balance)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => handleRecordPayment(item)}>Record Payment</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleEditTenancy(item)}>Edit Tenancy</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleDeleteTenancy(item)}>Delete Tenancy</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
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
      />

      <PaymentForm
        isOpen={isPaymentFormOpen}
        onClose={() => setIsPaymentFormOpen(false)}
        onSubmit={handlePaymentFormSubmit}
        transaction={selectedTransaction}
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
