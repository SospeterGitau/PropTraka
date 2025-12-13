
'use client';


import { useState, useEffect, useMemo, useTransition } from 'react';
import type { Property, Transaction, Contractor } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown, Sparkles, Loader2 } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { useDataContext } from '@/context/data-context';
import { format } from 'date-fns';
import { categorizeExpense } from '@/lib/actions';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';


const defaultCategories = [
  'Accounting',
  'Insurance',
  'Legal Fees',
  'Maintenance',
  'Management Fees',
  'Marketing',
  'Office Supplies',
  'Repairs',
  'Salaries',
  'Subscriptions',
  'Travel',
  'Utilities',
];


const frequencies = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'bi-weekly', label: 'Bi-weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly' },
];


function formatAddress(property: Property) {
  return `${property.addressLine1}, ${property.city}, ${property.postalCode}`;
}


function CategoryAssistantDialog({ open, onOpenChange, onCategorySelect }: { open: boolean, onOpenChange: (open: boolean) => void, onCategorySelect: (category: string) => void }) {
    const [description, setDescription] = useState('');
    const [isPending, startTransition] = useTransition();
    const [suggestion, setSuggestion] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);


    const handleGetSuggestion = () => {
        if (!description) return;
        startTransition(async () => {
            setError(null);
            setSuggestion(null);
            const result = await categorizeExpense({ description });
            if (result.category) {
                setSuggestion(result.category);
            } else {
                setError("Could not get a suggestion. Please try again.");
            }
        });
    }


    const handleApply = () => {
        if (suggestion) {
            onCategorySelect(suggestion);
        }
    }


    useEffect(() => {
        if (open) {
            setDescription('');
            setSuggestion(null);
            setError(null);
        }
    }, [open]);


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent aria-describedby="assistant-description">
                <DialogHeader>
                    <DialogTitle>AI Expense Categorization Assistant</DialogTitle>
                    <DialogDescription id="assistant-description">
                        Describe the expense, and the AI will suggest the best category.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="expense-description">Expense Description</Label>
                        <Textarea
                            id="expense-description"
                            placeholder="e.g., Paid a plumber to fix the kitchen sink at..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                    <Button onClick={handleGetSuggestion} disabled={!description || isPending} className="w-full">
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Get Suggestion
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


export function ExpenseForm({
  isOpen,
  onClose,
  onSubmit,
  transaction,
  properties,
  contractors,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Transaction, 'id'> | Transaction) => void;
  transaction?: Partial<Transaction> | null;
  properties: Property[];
  contractors: Contractor[];
}) {
  const [category, setCategory] = useState('');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [expenseType, setExpenseType] = useState<Transaction['expenseType']>('one-off');
  const [contractorId, setContractorId] = useState('');
  const [isContractorOpen, setIsContractorOpen] = useState(false);
  const { settings } = useDataContext();
  const [date, setDate] = useState<Date | undefined>();
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  
  useEffect(() => {
    if (isOpen) {
      setCategory(transaction?.category || '');
      setExpenseType(transaction?.expenseType || 'one-off');
      setContractorId((transaction as any)?.contractorId || '');
      setDate(transaction?.date ? new Date(transaction.date) : new Date());
    }
  }, [isOpen, transaction]);


  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const propertyId = formData.get('propertyId') as string;
    const selectedProperty = properties.find(p => p.id === propertyId);
    const selectedContractor = contractors.find(c => c.id === contractorId);
    const isEditing = !!transaction?.id;
    
    const data = {
      ...(isEditing ? { id: transaction.id } : {}),
      date: format(date!, 'yyyy-MM-dd'),
      amount: Number(formData.get('amount')),
      propertyName: selectedProperty ? formatAddress(selectedProperty) : 'General Expense',
      propertyId: propertyId !== 'none' ? propertyId : undefined,
      category: category,
      contractorId: contractorId || undefined,
      contractorName: selectedContractor?.name,
      notes: formData.get('notes') as string,
      type: 'expense',
      expenseType: expenseType,
      frequency: expenseType === 'recurring' ? formData.get('frequency') as Transaction['frequency'] : undefined,
      receiptUrl: formData.get('receiptUrl') as string,
      rent: 0,
    } as unknown as Omit<Transaction, 'id'> | Transaction;
    
    onSubmit(data);
    onClose();
  };


  const handleCategorySelected = (selectedCategory: string) => {
    setCategory(selectedCategory);
    setIsAssistantOpen(false);
  }


  if (!isOpen) return null;


  return (
    <>
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl" aria-describedby="expense-description">
        <DialogHeader>
          <DialogTitle>{transaction?.id ? 'Edit' : 'Add'} Expense</DialogTitle>
          <DialogDescription id="expense-description">
             Record and categorize your property expenses.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 py-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <DatePicker date={date} setDate={setDate} locale={settings?.locale || 'en-US'} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="propertyId">Property (optional)</Label>
            <Select name="propertyId" defaultValue={transaction?.propertyId || 'none'}>
              <SelectTrigger id="propertyId">
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None (General Business Expense)</SelectItem>
                {properties.map(property => (
                  <SelectItem key={property.id} value={property.id}>{formatAddress(property)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
                <Label>Category</Label>
                <Button type="button" variant="link" size="sm" className="h-auto p-0" onClick={() => setIsAssistantOpen(true)}>
                    <Sparkles className="mr-2 h-4 w-4"/>
                    Suggest Category
                </Button>
            </div>
            <Popover open={isCategoryOpen} onOpenChange={setIsCategoryOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={isCategoryOpen} className="w-full justify-between">
                  {category ? category : "Select a category..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput 
                    placeholder="Select or create category..." 
                    onValueChange={(currentValue) => setCategory(currentValue)}
                  />
                  <CommandList>
                    <CommandEmpty>
                        {category ? `Create "${category}"` : "No category found."}
                    </CommandEmpty>
                    <CommandGroup>
                      {defaultCategories.map((cat) => (
                        <CommandItem
                          key={cat}
                          value={cat}
                          onSelect={(currentValue) => {
                            setCategory(currentValue.toLowerCase() === category.toLowerCase() ? "" : currentValue);
                            setIsCategoryOpen(false);
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
          <div className="space-y-2">
              <Label>Expense Type</Label>
              <RadioGroup
                value={expenseType}
                onValueChange={(value) => setExpenseType(value as Transaction['expenseType'])}
                className="flex gap-4 pt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="one-off" id="r1" />
                  <Label htmlFor="r1">One-off</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="recurring" id="r2" />
                  <Label htmlFor="r2">Recurring</Label>
                </div>
              </RadioGroup>
          </div>
          
          {expenseType === 'recurring' && (
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <Select name="frequency" defaultValue={transaction?.frequency || 'monthly'} required>
                <SelectTrigger id="frequency">
                  <SelectValue placeholder="Select a frequency" />
                </SelectTrigger>
                <SelectContent>
                  {frequencies.map(f => (
                    <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Vendor / Contractor</Label>
             <Popover open={isContractorOpen} onOpenChange={setIsContractorOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={isContractorOpen} className="w-full justify-between">
                  {contractorId
                    ? contractors.find(c => c.id === contractorId)?.name
                    : "Select a contractor..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search contractors..." />
                  <CommandList>
                    <CommandEmpty>No contractor found.</CommandEmpty>
                    <CommandGroup>
                      {contractors.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={c.name}
                          onSelect={() => {
                            setContractorId(c.id === contractorId ? "" : c.id);
                            setIsContractorOpen(false);
                          }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", contractorId === c.id ? "opacity-100" : "opacity-0")} />
                          {c.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>


          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" name="amount" type="number" step="0.01" defaultValue={(transaction as any)?.amount} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receiptUrl">Receipt/Document Link (optional)</Label>
            <Input id="receiptUrl" name="receiptUrl" type="url" defaultValue={transaction?.receiptUrl} placeholder="https://example.com/receipt.pdf" />
            <p className="text-xs text-muted-foreground">This is for linking to external document storage like Google Drive or Dropbox.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" name="notes" defaultValue={transaction?.notes} />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
    <CategoryAssistantDialog 
        open={isAssistantOpen}
        onOpenChange={setIsAssistantOpen}
        onCategorySelect={handleCategorySelected}
    />
    </>
  );
}
