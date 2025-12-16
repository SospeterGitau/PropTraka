
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useDataContext } from '@/context/data-context';
import { addTransaction } from '@/lib/actions';
import { ExpenseForm } from '@/components/expense-form';
import type { Expense, Transaction } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function AddExpensePage() {
  const router = useRouter();
  const { properties, contractors } = useDataContext();

  const handleAddExpense = async (data: Expense | Omit<Expense, 'ownerId' | 'createdAt' | 'updatedAt'>) => {
    try {
      await addTransaction(data as unknown as Omit<Transaction, 'id'>);
      router.push('/expenses');
    } catch (error) {
      console.error("Failed to add expense:", error);
      // You might want to show a toast or error message here
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Expense</h1>
          <p className="text-muted-foreground">Record a new expense for your properties.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Expense Details</CardTitle>
          <CardDescription>
            Enter the details of the expense below. You can use the AI assistant to help categorize it.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {/* We need to use a slightly modified version of ExpenseForm that supports being embedded or just reuse logic. 
               The current ExpenseForm is wrapped in a Dialog. 
               I'll need to modify ExpenseForm to support a 'page' mode or extract the form.
               For now, since I can't easily refactor the internal state of ExpenseForm without major changes,
               and I already updated ExpenseForm to have a better internal layout,
               I will pass a new prop `mode="page"` to ExpenseForm.
           */}
           <ExpenseForm
              isOpen={true}
              onClose={handleBack}
              onSubmit={handleAddExpense}
              properties={properties}
              contractors={contractors}
              mode="page"
            />
        </CardContent>
      </Card>
    </div>
  );
}
