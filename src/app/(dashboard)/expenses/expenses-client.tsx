
'use client';

import { useState, useEffect, memo, useMemo } from 'react';
import Link from 'next/link';
import { ChevronRight, FileText, MessageSquare, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import type { Property, Transaction, Contractor } from '@/lib/types';
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
import { Badge } from '@/components/ui/badge';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Skeleton } from '@/components/ui/skeleton';
import { ExpenseForm } from '@/components/expense-form';
import { useUser, useFirestore } from '@/firebase';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useDataContext } from '@/context/data-context';


function ExpensesTable({ 
  expenses,
  formattedDates,
  formatCurrency,
  onEdit,
  onDelete,
  showFrequency = false,
}: {
  expenses: Transaction[];
  formattedDates: { [key: string]: string };
  formatCurrency: (amount: number) => string;
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
  showFrequency?: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Property</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Vendor</TableHead>
          {showFrequency && <TableHead>Frequency</TableHead>}
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.map((item) => (
          item.notes ? (
            <Collapsible key={item.id} asChild>
              <>
                <TableRow>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <CollapsibleTrigger asChild>
                        <button className="flex items-center gap-2 group">
                          {formattedDates[item.id]}
                          <ChevronRight className="h-4 w-4 transform transition-transform duration-200 group-data-[state=open]:rotate-90" />
                        </button>
                      </CollapsibleTrigger>
                      {item.receiptUrl && (
                        <Link href={item.receiptUrl} target="_blank" rel="noopener noreferrer">
                          <FileText className="h-4 w-4 text-muted-foreground hover:text-primary" />
                        </Link>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{item.propertyName}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.category}</Badge>
                  </TableCell>
                  <TableCell>{item.contractorName}</TableCell>
                  {showFrequency && (
                    <TableCell className="capitalize">{item.frequency}</TableCell>
                  )}
                  <TableCell className="text-right">{formatCurrency(item.amount || 0)}</TableCell>
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
                        <DropdownMenuItem onSelect={() => onEdit(item)}>Edit</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onDelete(item)}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
                <CollapsibleContent asChild>
                  <TableRow>
                    <TableCell colSpan={showFrequency ? 7 : 6} className="py-2 px-4 bg-muted/50">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="h-4 w-4 mt-1 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.notes}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                </CollapsibleContent>
              </>
            </Collapsible>
          ) : (
            <TableRow key={item.id}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {formattedDates[item.id]}
                  {item.receiptUrl && (
                    <Link href={item.receiptUrl} target="_blank" rel="noopener noreferrer">
                      <FileText className="h-4 w-4 text-muted-foreground hover:text-primary" />
                    </Link>
                  )}
                </div>
              </TableCell>
              <TableCell>{item.propertyName}</TableCell>
              <TableCell>
                <Badge variant="secondary">{item.category}</Badge>
              </TableCell>
              <TableCell>{item.contractorName}</TableCell>
              {showFrequency && (
                <TableCell className="capitalize">{item.frequency}</TableCell>
              )}
              <TableCell className="text-right">{formatCurrency(item.amount || 0)}</TableCell>
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
                    <DropdownMenuItem onSelect={() => onEdit(item)}>Edit</DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onDelete(item)}>Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          )
        ))}
      </TableBody>
    </Table>
  )
}

const ExpensesClient = memo(function ExpensesClient() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { settings } = useDataContext();
  const { locale, currency } = settings;

  const expensesQuery = useMemo(() => user ? query(collection(firestore, 'expenses'), where('ownerId', '==', user.uid)) : null, [firestore, user]);
  const propertiesQuery = useMemo(() => user ? query(collection(firestore, 'properties'), where('ownerId', '==', user.uid)) : null, [firestore, user]);
  const contractorsQuery = useMemo(() => user ? query(collection(firestore, 'contractors'), where('ownerId', '==', user.uid)) : null, [firestore, user]);

  const [expensesSnapshot, isExpensesLoading] = useCollection(expensesQuery);
  const [propertiesSnapshot, isPropertiesLoading] = useCollection(propertiesQuery);
  const [contractorsSnapshot, isContractorsLoading] = useCollection(contractorsQuery);

  const isDataLoading = isExpensesLoading || isPropertiesLoading || isContractorsLoading;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [formattedDates, setFormattedDates] = useState<{ [key: string]: string }>({});
  
  const expenses = useMemo(() => expensesSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)), [expensesSnapshot]);
  const properties = useMemo(() => propertiesSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property)), [propertiesSnapshot]);
  const contractors = useMemo(() => contractorsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Contractor)), [contractorsSnapshot]);


  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  };
  
  const addChangeLogEntry = async (log: Omit<any, 'id' | 'date' | 'ownerId'>) => {
    if (!user) return;
    await addDoc(collection(firestore, 'changelog'), {
      ...log,
      ownerId: user.uid,
      date: serverTimestamp(),
    });
  };

  useEffect(() => {
    const formatAllDates = async () => {
      if (!expenses) return;
      const localeData = await getLocale(locale);
      const newFormattedDates: { [key: string]: string } = {};
      for (const item of expenses) {
        newFormattedDates[item.id] = format(new Date(item.date), 'MMMM dd, yyyy', { locale: localeData });
      }
      setFormattedDates(newFormattedDates);
    };
    formatAllDates();
  }, [expenses, locale]);
  
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
      deleteDoc(doc(firestore, 'expenses', selectedTransaction.id));
      addChangeLogEntry({
        type: 'Expense',
        action: 'Deleted',
        description: `Expense for ${formatCurrency(selectedTransaction.amount || 0)} (${selectedTransaction.category}) was deleted.`,
        entityId: selectedTransaction.id,
      });
      setIsDeleteDialogOpen(false);
      setSelectedTransaction(null);
    }
  };

  const handleFormSubmit = async (data: Transaction) => {
    if (!user) return;
    const isEditing = !!data.id && expenses?.some(e => e.id === data.id);
    
    if (isEditing) {
      const { id, ...expenseData } = data;
      await updateDoc(doc(firestore, 'expenses', id), expenseData);
      addChangeLogEntry({
        type: 'Expense',
        action: 'Updated',
        description: `Expense for ${formatCurrency(data.amount || 0)} (${data.category}) was updated.`,
        entityId: data.id,
      });
    } else {
      const { id, type, ...expenseData } = data;
      const docRef = await addDoc(collection(firestore, 'expenses'), { ...expenseData, type: 'expense', ownerId: user.uid });
      addChangeLogEntry({
        type: 'Expense',
        action: 'Created',
        description: `Expense for ${formatCurrency(data.amount || 0)} (${data.category}) was logged.`,
        entityId: docRef.id,
      });
    }
  };
  
  if (isDataLoading) {
    return (
      <>
        <PageHeader title="Expenses">
          <Button disabled>Add Expense</Button>
        </PageHeader>
        <Skeleton className="h-10 w-48 mb-4" />
        <Card>
          <CardHeader><CardTitle><Skeleton className="h-6 w-1/2" /></CardTitle></CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </>
    )
  }

  const oneOffExpenses = expenses?.filter(e => e.expenseType === 'one-off' || !e.expenseType) || [];
  const recurringExpenses = expenses?.filter(e => e.expenseType === 'recurring') || [];

  return (
    <>
      <PageHeader title="Expenses">
        <Button onClick={handleAdd}>Add Expense</Button>
      </PageHeader>
      <Tabs defaultValue="one-off">
        <TabsList>
          <TabsTrigger value="one-off">One-off Expenses</TabsTrigger>
          <TabsTrigger value="recurring">Recurring Expenses</TabsTrigger>
        </TabsList>
        <TabsContent value="one-off" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>One-off Expense Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <ExpensesTable
                expenses={oneOffExpenses}
                formattedDates={formattedDates}
                formatCurrency={formatCurrency}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="recurring" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Recurring Expense Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <ExpensesTable
                expenses={recurringExpenses}
                formattedDates={formattedDates}
                formatCurrency={formatCurrency}
                onEdit={handleEdit}
                onDelete={handleDelete}
                showFrequency={true}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {properties && contractors && <ExpenseForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        transaction={selectedTransaction}
        properties={properties}
        contractors={contractors}
      />}
      
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        itemName={`expense transaction for ${selectedTransaction?.propertyName}`}
      />
    </>
  );
});

export default ExpensesClient;
