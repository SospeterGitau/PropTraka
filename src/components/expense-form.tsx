
'use client';

import { useState, useEffect, useTransition } from 'react';
import type { Property, Expense, Contractor, UserSettings } from '@/lib/types'; // Updated imports
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox'; // Using Checkbox for isRecurring
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, Sparkles, Loader2, CalendarIcon, ArrowLeft } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { useDataContext } from '@/context/data-context';
import { format } from 'date-fns';
import { categorizeExpense } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp

const defaultCategories: Expense['category'][] = [
  'Repairs', 'Utilities', 'Insurance', 'Taxes', 'Management Fees', 'Cleaning', 'Other',
];

const frequencies = [
  { value: 'weekly', label: 'Weekly' }, { value: 'bi-weekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' }, { value: 'quarterly', label: 'Quarterly' }, { value: 'yearly', label: 'Yearly' },
];

function formatAddress(property: Property) {
  const address = property.address; // Use the new Address interface
  return [address.street, address.city, address.zipCode].filter(Boolean).join(', ');
}

function CategoryAssistantDialog({ open, onOpenChange, onCategorySelect }: { open: boolean, onOpenChange: (open: boolean) => void, onCategorySelect: (category: string) => void }) {
  const [description, setDescription] = useState('');
  const [isPending, startTransition] = useTransition();
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGetSuggestion = () => {
    if (!description) return;
    startTransition(async () => {
      setError(null); setSuggestion(null);
      const result = await categorizeExpense({ description });
      // Ensure the suggested category is one of the valid ones, or default to 'Other'
      const validCategory = defaultCategories.includes(result.category as Expense['category']) ? result.category : 'Other';
      if (validCategory) setSuggestion(validCategory);
      else setError("Could not get a suggestion. Please try again.");
    });
  }

  const handleApply = () => {
    if (suggestion) onCategorySelect(suggestion);
  }

  useEffect(() => {
    if (open) { setDescription(''); setSuggestion(null); setError(null); }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby="assistant-description">
        <DialogHeader>
          <DialogTitle>AI Expense Categorization Assistant</DialogTitle>
          <DialogDescription id="assistant-description">Describe the expense, and the AI will suggest the best category.</DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expense-description">Expense Description</Label>
            <Textarea id="expense-description" placeholder="e.g., Paid a plumber to fix the kitchen sink at..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <Button onClick={handleGetSuggestion} disabled={!description || isPending} className="w-full">
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />} Get Suggestion
          </Button>
          {suggestion && (
            <Alert>
              <Sparkles className="h-4 w-4" />
              <AlertTitle>Suggested Category</AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                <span className="font-bold text-lg">{suggestion}</span>
                <Button size="sm" onClick={handleApply}>Apply</Button>
              </AlertDescription>
            </Alert>
          )}
          {error && <Alert variant="destructive">{error}</Alert>}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ExpenseForm({ isOpen, onClose, onSubmit, transaction: initialExpense, properties, contractors, mode = 'dialog' }: {
  isOpen: boolean; onClose: () => void; onSubmit: (data: Omit<Expense, 'ownerId' | 'createdAt' | 'updatedAt'> | Expense) => void;
  transaction?: Partial<Expense> | null; properties: Property[]; contractors: Contractor[]; mode?: 'dialog' | 'page';
}) {
  const { settings } = useDataContext();
  const router = useRouter();
  const getCurrencySymbol = (currencyCode: string) => {
    try {
      const parts = new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode, currencyDisplay: 'narrowSymbol' }).formatToParts(1);
      return parts.find((part) => part.type === 'currency')?.value || '$';
    } catch (e) { return '$'; }
  };
  const currencySymbol = getCurrencySymbol(settings?.currency || 'USD');

  const [date, setDate] = useState<Date | undefined>();
  const [propertyId, setPropertyId] = useState('');
  const [category, setCategory] = useState<Expense['category']>('Other'); // Default to 'Other'
  const [isRecurring, setIsRecurring] = useState(false); // New state for isRecurring
  const [frequency, setFrequency] = useState('monthly'); // Still used for display if recurring
  const [contractorId, setContractorId] = useState('');
  const [amount, setAmount] = useState<number | ''>('');
  const [vendorName, setVendorName] = useState(''); // New state for vendorName
  const [invoiceNumber, setInvoiceNumber] = useState(''); // New state for invoiceNumber
  const [receiptUrl, setReceiptUrl] = useState('');
  const [notes, setNotes] = useState('');

  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isContractorOpen, setIsContractorOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const handleCategorySelected = (category: string) => {
    setCategory(category as Expense['category']);
    setIsAssistantOpen(false);
  }

  useEffect(() => {
    if (initialExpense) {
      setDate(initialExpense.date ? ((initialExpense.date as any) instanceof Timestamp ? (initialExpense.date as any).toDate() : new Date(initialExpense.date)) : new Date());
      setPropertyId(initialExpense.propertyId || 'none');
      setCategory(initialExpense.category || 'Other');
      setIsRecurring(initialExpense.isRecurring || false);
      // frequency is not directly in new schema, but if we assume monthly if recurring, or add it back if needed for display
      // For now, if initialExpense.isRecurring, we default frequency to monthly.
      setFrequency(initialExpense.isRecurring ? (initialExpense as any).frequency || 'monthly' : 'monthly');
      setContractorId(initialExpense.contractorId || '');
      setAmount(initialExpense.amount || '');
      setVendorName(initialExpense.vendorName || ''); // New field
      setInvoiceNumber(initialExpense.invoiceNumber || ''); // New field
      setReceiptUrl(initialExpense.receiptUrl || '');
      setNotes(initialExpense.notes || '');
    } else {
      if (!date) setDate(new Date());
      setCategory('Other'); // Default for new expense
      setPropertyId('none');
    }
  }, [initialExpense, isOpen]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!date || !amount || !category) {
      alert('Please fill in all required fields: Date, Amount, and Category.');
      return;
    }

    const expenseData: Omit<Expense, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'> = {
      date: date.toISOString(),
      amount: Number(amount),
      propertyId: propertyId !== 'none' ? propertyId : undefined,
      category,
      contractorId: contractorId || undefined,
      vendorName: vendorName || undefined,
      invoiceNumber: invoiceNumber || undefined,
      receiptUrl: receiptUrl || undefined,
      isRecurring,
      notes: notes || undefined,
    };

    onSubmit(expenseData as any);
    if (mode === 'dialog') {
      onClose();
    }
  };

  const FormContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
          <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => { setDate(d); setIsCalendarOpen(false); }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="amount">Amount *</Label>
          <Input
            id="amount"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
            required
            placeholder="0.00"
            prefixText={currencySymbol}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="propertyId">Property (optional)</Label>
          <Select value={propertyId} onValueChange={setPropertyId}>
            <SelectTrigger id="propertyId"><SelectValue placeholder="Select a property" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None (General Business Expense)</SelectItem>
              {properties.map(property => (<SelectItem key={property.id} value={property.id!}>{formatAddress(property)}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Category *</Label>
            <Button type="button" variant="ghost" size="sm" className="h-auto p-0 text-primary hover:text-primary/80" onClick={() => setIsAssistantOpen(true)}>
              <Sparkles className="mr-1 h-3 w-3" />
              AI Suggest
            </Button>
          </div>
          <Popover open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                {category || "Select a category..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search category..." onValueChange={(value) => setCategory(value as Expense['category'])} />
                <CommandList>
                  <CommandEmpty>{category ? <span className="cursor-pointer" onClick={() => { setCategory(category); setIsCategoryOpen(false); }}>Use "{category}"</span> : "No category found."}</CommandEmpty>
                  <CommandGroup>
                    {defaultCategories.map((cat) => (
                      <CommandItem key={cat} value={cat} onSelect={(val) => { setCategory(val as Expense['category']); setIsCategoryOpen(false); }}>
                        <Check className={cn("mr-2 h-4 w-4", category === cat ? "opacity-100" : "opacity-0")} />{cat}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2 col-span-1 md:col-span-2">
          <div className="items-top flex space-x-2">
            <Checkbox id="isRecurring" checked={isRecurring} onCheckedChange={(checked) => setIsRecurring(!!checked)} />
            <div className="grid gap-1.5 leading-none">
              <Label htmlFor="isRecurring" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Is this a recurring expense?
              </Label>
              <p className="text-sm text-muted-foreground">
                If checked, this expense may be automatically generated in the future.
              </p>
            </div>
          </div>
        </div>

        {isRecurring && (
          <div className="space-y-2">
            <Label htmlFor="frequency">Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency} required={isRecurring}>
              <SelectTrigger id="frequency"><SelectValue placeholder="Select a frequency" /></SelectTrigger>
              <SelectContent>
                {frequencies.map(f => (<SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="vendorName">Vendor Name (optional)</Label>
          <Input id="vendorName" value={vendorName} onChange={(e) => setVendorName(e.target.value)} placeholder="e.g., John's Plumbing" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="invoiceNumber">Invoice Number (optional)</Label>
          <Input id="invoiceNumber" value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="e.g., INV-2023-001" />
        </div>

        <div className="space-y-2">
          <Label>Contractor (optional)</Label>
          <Popover open={isContractorOpen} onOpenChange={setIsContractorOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                {contractorId ? contractors.find(c => c.id === contractorId)?.companyName : "Select a contractor..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search contractors..." />
                <CommandList>
                  <CommandEmpty>No contractor found.</CommandEmpty>
                  <CommandGroup>
                    {contractors.map((c) => (
                      <CommandItem key={c.id} value={c.companyName} onSelect={() => { setContractorId(c.id === contractorId ? "" : (c.id || "")); setIsContractorOpen(false); }}>
                        <Check className={cn("mr-2 h-4 w-4", contractorId === c.id ? "opacity-100" : "opacity-0")} />{c.companyName}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="receiptUrl">Receipt/Document Link (optional)</Label>
          <Input id="receiptUrl" value={receiptUrl} onChange={(e) => setReceiptUrl(e.target.value)} type="url" placeholder="https://example.com/receipt.pdf" />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="notes">Notes (optional)</Label>
          <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[100px]" />
        </div>
      </div>

      <div className="flex items-center justify-end gap-4 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">Save Expense</Button>
      </div>
    </form>
  );

  if (mode === 'page') {
    return (
      <>
        <PageHeader title={initialExpense?.id ? 'Edit Expense' : 'Add New Expense'}>
          <Button variant="outline" asChild>
            <Link href="/expenses">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Expenses
            </Link>
          </Button>
        </PageHeader>
        {FormContent}
        <CategoryAssistantDialog open={isAssistantOpen} onOpenChange={setIsAssistantOpen} onCategorySelect={handleCategorySelected} />
      </>
    )
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-3xl" aria-describedby="expense-description">
          <DialogHeader>
            <DialogTitle>{initialExpense?.id ? 'Edit' : 'Add'} Expense</DialogTitle>
            <DialogDescription id="expense-description">Record and categorize your property expenses.</DialogDescription>
          </DialogHeader>
          <div className="max-h-[80vh] overflow-y-auto px-1">
            {FormContent}
          </div>
        </DialogContent>
      </Dialog>

      <CategoryAssistantDialog open={isAssistantOpen} onOpenChange={setIsAssistantOpen} onCategorySelect={handleCategorySelected} />
    </>
  );
}
