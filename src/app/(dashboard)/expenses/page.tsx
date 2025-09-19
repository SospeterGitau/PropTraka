'use client';

import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { expenses as initialExpenses } from '@/lib/data';
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

// A simple form dialog for adding/editing expenses.
function ExpenseForm({
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
      id: transaction?.id || `e${Date.now()}`,
      date: formData.get('date') as string,
      amount: Number(formData.get('amount')),
      propertyName: formData.get('propertyName') as string,
      category: formData.get('category') as string,
      vendor: formData.get('vendor') as string,
      type: 'expense',
      propertyId: transaction?.propertyId || 'new',
    };
    onSubmit(data);
    onClose();
  };

  if (!isOpen) return null;

  return (
     <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div className="bg-card p-6 rounded-lg w-full max-w-md">
        <h2 className="text-lg font-semibold mb-4">{transaction ? 'Edit' : 'Add'} Expense</h2>
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
            <label>Category</label>
            <input name="category" defaultValue={transaction?.category} required className="w-full p-2 border rounded" />
          </div>
           <div>
            <label>Vendor</label>
            <input name="vendor" defaultValue={transaction?.vendor} className="w-full p-2 border rounded" />
          </div>
          <div>
            <label>Amount</label>
            <input name="amount" type="number" defaultValue={transaction?.amount} required className="w-full p-2 border rounded" />
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


export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Transaction[]>(initialExpenses);
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
      setExpenses(expenses.filter((item) => item.id !== selectedTransaction.id));
      setIsDeleteDialogOpen(false);
      setSelectedTransaction(null);
    }
  };

  const handleFormSubmit = (data: Transaction) => {
    if (selectedTransaction) {
      setExpenses(expenses.map((item) => (item.id === data.id ? data : item)));
    } else {
      setExpenses([data, ...expenses]);
    }
  };


  return (
    <>
      <PageHeader title="Expenses">
        <Button onClick={handleAdd}>Add Expense</Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Expense Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Property</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{formatDate(item.date)}</TableCell>
                  <TableCell>{item.propertyName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.category}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <ExpenseForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        transaction={selectedTransaction}
      />
      
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        itemName={`expense transaction for ${selectedTransaction?.propertyName}`}
      />
    </>
  );
}
