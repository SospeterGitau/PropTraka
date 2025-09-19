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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-card p-6 rounded-lg w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">{transaction ? 'Edit' : 'Add'} Tenancy</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
           <div>
            <label>Property</label>
            <input name="propertyName" defaultValue={transaction?.propertyName} required className="w-full p-2 border rounded" />
          </div>
          <div>
            <label>Tenant</label>
            <input name="tenant" defaultValue={transaction?.tenant} required className="w-full p-2 border rounded" />
          </div>
           <div>
            <label>Tenancy Start Date</label>
            <input name="tenancyStartDate" type="date" defaultValue={transaction?.tenancyStartDate?.split('T')[0]} required className="w-full p-2 border rounded" />
          </div>
          <div>
            <label>Tenancy End Date</label>
            <input name="tenancyEndDate" type="date" defaultValue={transaction?.tenancyEndDate?.split('T')[0]} required className="w-full p-2 border rounded" />
          </div>
          <div>
            <label>Monthly Rent</label>
            <input name="amount" type="number" defaultValue={transaction?.amount} required className="w-full p-2 border rounded" />
          </div>
          <div>
            <label>Deposit (due with first month's rent)</label>
            <input name="deposit" type="number" defaultValue={transaction?.deposit} className="w-full p-2 border rounded" />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </div>
    </div>
  );
}


export default function RevenuePage() {
  const { revenue, setRevenue } = useDataContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
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

  const handleAdd = () => {
    setSelectedTransaction(null);
    setIsFormOpen(true);
  };

  const handleEdit = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsFormOpen(true);
  };

  const handleDelete = (transaction: Transaction) => {
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

  const handleFormSubmit = (data: Transaction[]) => {
    const tenancyId = data[0].tenancyId;
    // Remove existing transactions for this tenancy before adding/updating
    const otherTenancies = revenue.filter(r => r.tenancyId !== tenancyId);
    
    // Attempt to preserve payment status on edit
    const updatedData = data.map(newTx => {
      const existingTx = revenue.find(oldTx => oldTx.id === newTx.id);
      return existingTx ? { ...newTx, amountPaid: existingTx.amountPaid } : newTx;
    });

    setRevenue([...otherTenancies, ...updatedData]);
    setIsFormOpen(false);
    setSelectedTransaction(null);
  };

  return (
    <>
      <PageHeader title="Revenue">
        <Button onClick={handleAdd}>Add Tenancy</Button>
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
                          <DropdownMenuItem onSelect={() => handleEdit(item)}>Edit Tenancy</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleDelete(item)}>Delete Tenancy</DropdownMenuItem>
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
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
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
