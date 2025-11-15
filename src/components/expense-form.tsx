
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Property, Transaction, Contractor } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Check, ChevronsUpDown } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { useDataContext } from '@/context/data-context';
import { format } from 'date-fns';

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
  return `${property.addressLine1}, ${property.city}, ${property.state} ${property.postalCode}`;
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
  
  useEffect(() => {
    if (isOpen) {
      setCategory(transaction?.category || 'Maintenance');
      setExpenseType(transaction?.expenseType || 'one-off');
      setContractorId(transaction?.contractorId || '');
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
    
    const data: Omit<Transaction, 'id'> | Transaction = {
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
    };
    onSubmit(data);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{transaction?.id ? 'Edit' : 'Add'} Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <DatePicker date={date} setDate={setDate} locale={settings.locale} />
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
            <Label>Category</Label>
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
                onValueChange={(value: Transaction['expenseType']) => setExpenseType(value)}
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
                          {c.name} ({c.specialty})
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
            <Input id="amount" name="amount" type="number" step="0.01" defaultValue={transaction?.amount} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="receiptUrl">Receipt/File Link (optional)</Label>
            <Input id="receiptUrl" name="receiptUrl" type="url" defaultValue={transaction?.receiptUrl} placeholder="https://example.com/receipt.pdf" />
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
  );
}
