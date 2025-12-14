
'use client';

import React, { useState, useMemo, memo } from 'react';
import type { Expense } from '@/lib/types';
import { useDataContext } from '@/context/data-context';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, MoreHorizontal, Edit2, Trash2, Calendar, Tag } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useRouter } from 'next/navigation';

const ExpensesClient = memo(function ExpensesClient() {
  const { expenses: expensesData, settings, loading } = useDataContext();
  const expenses = expensesData as Expense[];
  const locale = settings?.locale || 'en-KE';
  const currency = settings?.currency || 'KES';
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const router = useRouter();

  const filteredExpenses = useMemo(() => {
    return expenses.filter(expense => {
      const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.contractorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        expense.propertyName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCategory = !filterCategory || expense.category === filterCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [expenses, searchTerm, filterCategory]);

  const categories = useMemo(() => {
    const cats = new Set(expenses.map(e => e.category));
    return Array.from(cats).sort();
  }, [expenses]);

  const totalExpenses = useMemo(() => {
    return filteredExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
  }, [filteredExpenses]);

  const handleDeleteExpense = (expense: Expense) => {
    if (confirm(`Are you sure you want to delete this expense (${formatCurrency(expense.amount, locale, currency)})?`)) {
      console.log('Delete expense:', expense.id);
      // TODO: Implement delete functionality with Firebase
    }
  };

  const handleAddExpense = () => {
    router.push('/expenses/add');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Expenses" />
        <Card>
          <CardHeader>
            <CardTitle><Skeleton className="h-6 w-1/2" /></CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Expenses" />

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalExpenses, locale, currency)}</div>
            <p className="text-xs text-muted-foreground">{filteredExpenses.length} expenses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Expense</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                filteredExpenses.length > 0 ? totalExpenses / filteredExpenses.length : 0,
                locale,
                currency
              )}
            </div>
            <p className="text-xs text-muted-foreground">Per expense</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">Expense types</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Expense Records</CardTitle>
              <CardDescription>Track and manage all property expenses</CardDescription>
            </div>
            <Button size="sm" onClick={handleAddExpense}>
              <Plus className="mr-2 h-4 w-4" />
              Add Expense
            </Button>
          </div>

          <div className="flex flex-col gap-4 mt-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by description, contractor, or property..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {categories.length > 0 && (
              <select
                value={filterCategory || ''}
                onChange={(e) => setFilterCategory(e.target.value || null)}
                className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat} className="capitalize">{cat}</option>
                ))}
              </select>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[150px]">Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="hidden md:table-cell">Category</TableHead>
                <TableHead className="hidden sm:table-cell">Contractor</TableHead>
                <TableHead className="hidden sm:table-cell">Frequency</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredExpenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    {searchTerm || filterCategory ? 'No expenses found matching your filters.' : 'No expenses recorded yet.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredExpenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{new Date(expense.date).toLocaleDateString(locale)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{expense.description}</div>
                      <div className="text-sm text-muted-foreground md:hidden">{expense.category}</div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary" className="capitalize">{expense.category}</Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {expense.contractorName || '—'}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {expense.expenseType === 'recurring' ? (
                        <>
                          <Badge variant="outline" className="capitalize">{expense.frequency}</Badge>
                        </>
                      ) : (
                        <Badge variant="outline">One-off</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold">{formatCurrency(expense.amount || 0, locale, currency)}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="cursor-pointer">
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer text-destructive"
                            onClick={() => handleDeleteExpense(expense)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
});

export default ExpensesClient;
