'use client';

import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
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
import { Badge } from '@/components/ui/badge';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';

// A simple form dialog for adding/editing revenue.
// In a real app, this would be a more robust form component.
function RevenueForm({
  isOpen,
  onClose,
  onSubmit,
  transaction,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Transaction) => void;
  transaction?: Transaction | null;
}) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data: Transaction = {
      id: transaction?.id || `r${Date.now()}`,
      date: formData.get('date') as string,
      amount: Number(formData.get('amount')),
      propertyName: formData.get('propertyName') as string,
      tenant: formData.get('tenant') as string,
      type: 'revenue',
      propertyId: transaction?.propertyId || 'new',
      deposit: Number(formData.get('deposit')),
      amountPaid: Number(formData.get('amountPaid')),
    };
    onSubmit(data);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-card p-6 rounded-lg w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">{transaction ? 'Edit' : 'Add'} Revenue</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label>Date</label>
            <input name="date" type="date" defaultValue={transaction?.date.split('T')[0]} required className="w-full p-2 border rounded" />
          </div>
          <div>
            <label>Property</label>
            <input name="propertyName" defaultValue={transaction?.propertyName} required className="w-full p-2 border rounded" />
          </div>
          <div>
            <label>Tenant</label>
            <input name="tenant" defaultValue={transaction?.tenant} required className="w-full p-2 border rounded" />
          </div>
          <div>
            <label>Amount Due</label>
            <input name="amount" type="number" defaultValue={transaction?.amount} required className="w-full p-2 border rounded" />
          </div>
          <div>
            <label>Amount Paid</label>
            <input name="amountPaid" type="number" defaultValue={transaction?.amountPaid} required className="w-full p-2 border rounded" />
          </div>
           <div>
            <label>Deposit</label>
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
  const formatDate = (dateString: string) => format(new Date(dateString), 'MMMM dd, yyyy');

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
      setRevenue(revenue.filter((item) => item.id !== selectedTransaction.id));
      setIsDeleteDialogOpen(false);
      setSelectedTransaction(null);
    }
  };

  const handleFormSubmit = (data: Transaction) => {
    if (data.id.startsWith('r') && !revenue.find(r => r.id === data.id)) {
       // Add
      setRevenue([data, ...revenue]);
    } else {
      // Update
      setRevenue(revenue.map((item) => (item.id === data.id ? data : item)));
    }
    setIsFormOpen(false);
    setSelectedTransaction(null);
  };

  return (
    <>
      <PageHeader title="Revenue">
        <Button onClick={handleAdd}>Add Revenue</Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Revenue Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead className="text-right">Amount Due</TableHead>
                <TableHead className="text-right">Amount Paid</TableHead>
                <TableHead className="text-right">Deposit</TableHead>
                <TableHead className="text-right">Balance</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {revenue.map((item) => {
                const balance = item.amount - (item.amountPaid ?? 0);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{formatDate(item.date)}</TableCell>
                    <TableCell>{item.propertyName}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{item.tenant}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.amountPaid ?? 0)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(item.deposit ?? 0)}</TableCell>
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
                          <DropdownMenuItem onSelect={() => handleEdit(item)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleDelete(item)}>Delete</DropdownMenuItem>
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
        itemName={`revenue transaction for ${selectedTransaction?.propertyName}`}
      />
    </>
  );
}
