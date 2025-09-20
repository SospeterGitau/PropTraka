
'use client';

import { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, MoreHorizontal } from 'lucide-react';
import { format } from 'date-fns';
import { useDataContext } from '@/context/data-context';
import type { Property, Transaction } from '@/lib/types';
import { cn } from '@/lib/utils';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';

const defaultCategories = [
  'Maintenance',
  'Repairs',
  'Insurance',
  'Utilities',
  'Management Fees',
  'Salaries',
];

const frequencies = [
  { value: 'one-off', label: 'One-off' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];

function formatAddress(property: Property) {
  return `${property.addressLine1}, ${property.city}, ${property.state} ${property.postalCode}`;
}

function ExpenseForm({
  isOpen,
  onClose,
  onSubmit,
  transaction,
  properties,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Transaction) => void;
  transaction?: Transaction | null;
  properties: Property[];
}) {
  const [category, setCategory] = useState(transaction?.category || '');
  const [open, setOpen] = useState(false)

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const propertyId = formData.get('propertyId') as string;
    const selectedProperty = properties.find(p => p.id === propertyId);
    
    const data: Transaction = {
      id: transaction?.id || `e${Date.now()}`,
      date: formData.get('date') as string,
      amount: Number(formData.get('amount')),
      propertyName: selectedProperty ? formatAddress(selectedProperty) : 'N/A',
      propertyId: propertyId,
      category: category,
      vendor: formData.get('vendor') as string,
      type: 'expense',
      frequency: formData.get('frequency') as Transaction['frequency'],
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
            <Label className="block mb-1 text-sm font-medium">Date</Label>
            <input name="date" type="date" defaultValue={transaction?.date.split('T')[0]} required className="w-full p-2 border rounded bg-transparent" />
          </div>
          <div>
            <Label className="block mb-1 text-sm font-medium">Property</Label>
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
            <Label className="block mb-1 text-sm font-medium">Category</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={open} className="w-full justify-between">
                  {category ? defaultCategories.find((c) => c.toLowerCase() === category.toLowerCase()) || category : "Select a category..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[350px] p-0">
                <Command>
                  <CommandInput 
                    placeholder="Select or create category..." 
                    onValueChange={(currentValue) => setCategory(currentValue)}
                  />
                  <CommandList>
                    <CommandEmpty>No category found. Type to create.</CommandEmpty>
                    <CommandGroup>
                      {defaultCategories.map((cat) => (
                        <CommandItem
                          key={cat}
                          value={cat}
                          onSelect={(currentValue) => {
                            setCategory(currentValue === category ? "" : currentValue);
                            setOpen(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", category.toLowerCase() === cat.toLowerCase() ? "opacity-100" : "opacity-0")} />
                          {cat}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
           <div>
            <Label className="block mb-1 text-sm font-medium">Frequency</Label>
            <Select name="frequency" defaultValue={transaction?.frequency || 'one-off'} required>
              <SelectTrigger>
                <SelectValue placeholder="Select a frequency" />
              </SelectTrigger>
              <SelectContent>
                {frequencies.map(f => (
                  <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="block mb-1 text-sm font-medium">Vendor</Label>
            <input name="vendor" defaultValue={transaction?.vendor} className="w-full p-2 border rounded bg-transparent" />
          </div>
          <div>
            <Label className="block mb-1 text-sm font-medium">Amount</Label>
            <input name="amount" type="number" defaultValue={transaction?.amount} required className="w-full p-2 border rounded bg-transparent" />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
          {showFrequency && <TableHead>Frequency</TableHead>}
          <TableHead className="text-right">Amount</TableHead>
          <TableHead>
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {expenses.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{formattedDates[item.id]}</TableCell>
            <TableCell>{item.propertyName}</TableCell>
            <TableCell>
              <Badge variant="secondary">{item.category}</Badge>
            </TableCell>
             {showFrequency && (
              <TableCell className="capitalize">{item.frequency}</TableCell>
            )}
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
                  <DropdownMenuItem onSelect={() => onEdit(item)}>Edit</DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onDelete(item)}>Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function ExpensesPage() {
  const { properties, expenses, setExpenses, formatCurrency, locale } = useDataContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [formattedDates, setFormattedDates] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const formatAllDates = async () => {
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
      setExpenses(expenses.filter((item) => item.id !== selectedTransaction.id));
      setIsDeleteDialogOpen(false);
      setSelectedTransaction(null);
    }
  };

  const handleFormSubmit = (data: Transaction) => {
    if (data.id.startsWith('e') && !expenses.find(e => e.id === data.id)) {
      setExpenses([data, ...expenses]);
    } else {
      setExpenses(expenses.map((item) => (item.id === data.id ? data : item)));
    }
  };

  const oneOffExpenses = expenses.filter(e => e.frequency === 'one-off' || !e.frequency);
  const recurringExpenses = expenses.filter(e => e.frequency !== 'one-off');

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
          <Tabs defaultValue="one-off">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="one-off">One-off Expenses</TabsTrigger>
              <TabsTrigger value="recurring">Recurring Expenses</TabsTrigger>
            </TabsList>
            <TabsContent value="one-off">
              <ExpensesTable
                expenses={oneOffExpenses}
                formattedDates={formattedDates}
                formatCurrency={formatCurrency}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </TabsContent>
            <TabsContent value="recurring">
              <ExpensesTable
                expenses={recurringExpenses}
                formattedDates={formattedDates}
                formatCurrency={formatCurrency}
                onEdit={handleEdit}
                onDelete={handleDelete}
                showFrequency={true}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <ExpenseForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        transaction={selectedTransaction}
        properties={properties}
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
