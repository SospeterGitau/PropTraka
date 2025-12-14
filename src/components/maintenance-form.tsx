
'use client';

import { useState, useEffect } from 'react';
import type { Property, MaintenanceRequest, Contractor } from '@/lib/types';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { useDataContext } from '@/context/data-context';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface MaintenanceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<MaintenanceRequest, 'id'> | MaintenanceRequest) => void;
  request?: Partial<MaintenanceRequest> | null;
  properties: Property[];
  contractors: Contractor[];
  mode?: 'dialog' | 'page';
}

function formatAddress(property: Property) {
  const address = property.address || {};
  return [address.line1, address.city, address.zipCode].filter(Boolean).join(', ');
}

export function MaintenanceForm({ isOpen, onClose, onSubmit, request, properties, contractors, mode = 'dialog' }: MaintenanceFormProps) {
  const { settings } = useDataContext();
  const getCurrencySymbol = (currencyCode: string) => {
    try {
      const parts = new Intl.NumberFormat(undefined, { style: 'currency', currency: currencyCode, currencyDisplay: 'narrowSymbol' }).formatToParts(1);
      return parts.find((part) => part.type === 'currency')?.value || '$';
    } catch (e) { return '$'; }
  };
  const currencySymbol = getCurrencySymbol(settings?.currency || 'USD');

  // State for each field
  const [propertyId, setPropertyId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<MaintenanceRequest['priority']>('medium');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [contractorId, setContractorId] = useState('');
  const [estimatedCost, setEstimatedCost] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  const [isContractorOpen, setIsContractorOpen] = useState(false);

  useEffect(() => {
    // Initialize defaults or load data
    if (request) {
      setPropertyId(request.propertyId || '');
      setTitle(request.title || '');
      setDescription(request.description || '');
      setPriority(request.priority || 'medium');
      setDueDate(request.dueDate ? new Date(request.dueDate) : new Date());
      setContractorId(request.contractorId || '');
      setEstimatedCost(request.estimatedCost || '');
      setNotes(request.notes || '');
    } else {
        // Defaults for new request
        if (!dueDate) setDueDate(new Date());
    }
  }, [request]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const selectedProperty = properties.find(p => p.id === propertyId);
    const selectedContractor = contractors.find(c => c.id === contractorId);

    const data: Omit<MaintenanceRequest, 'id'> | MaintenanceRequest = {
      ...(request?.id ? { id: request.id } : {}),
      propertyId,
      propertyName: selectedProperty ? formatAddress(selectedProperty) : 'General',
      title,
      description,
      priority,
      dueDate: dueDate ? format(dueDate, 'yyyy-MM-dd') : '',
      status: request?.status || 'pending',
      contractorId: contractorId || undefined,
      contractorName: selectedContractor?.name,
      estimatedCost: estimatedCost ? Number(estimatedCost) : undefined,
      notes,
    };

    onSubmit(data);
    if (mode === 'dialog') {
        onClose();
    }
  };

  const FormContent = (
      <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs defaultValue="details">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Request Details</TabsTrigger>
              <TabsTrigger value="assignment">Assignment & Cost</TabsTrigger>
            </TabsList>
            <div className={cn("py-4 px-1", mode === 'dialog' ? "max-h-[60vh] overflow-y-auto" : "")}>
              <TabsContent value="details" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="propertyId">Property *</Label>
                  <Select name="propertyId" value={propertyId} onValueChange={setPropertyId} required>
                    <SelectTrigger id="propertyId"><SelectValue placeholder="Select a property" /></SelectTrigger>
                    <SelectContent>
                      {properties.map(property => (
                        <SelectItem key={property.id} value={property.id}>{formatAddress(property)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="e.g., Replace roof shingles" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Describe the maintenance needed..." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority *</Label>
                  <Select name="priority" value={priority} onValueChange={(v) => setPriority(v as any)} required>
                    <SelectTrigger id="priority"><SelectValue placeholder="Select priority" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              <TabsContent value="assignment" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date *</Label>
                  <DatePicker date={dueDate} setDate={setDueDate} />
                </div>
                <div className="space-y-2">
                  <Label>Contractor (optional)</Label>
                  <Popover open={isContractorOpen} onOpenChange={setIsContractorOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" aria-expanded={isContractorOpen} className="w-full justify-between">
                        {contractorId ? contractors.find(c => c.id === contractorId)?.name : "Select a contractor..."}
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
                                onSelect={() => { setContractorId(c.id === contractorId ? "" : c.id); setIsContractorOpen(false); }}
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
                  <Label htmlFor="estimatedCost">Estimated Cost (optional)</Label>
                  <Input
                    id="estimatedCost"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    prefixText={currencySymbol}
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value ? Number(e.target.value) : '')}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..." />
                </div>
              </TabsContent>
            </div>
          </Tabs>
          <div className={cn("pt-4 flex items-center gap-4", mode === 'dialog' ? "justify-end" : "justify-end border-t")}>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Request</Button>
          </div>
        </form>
  );

  if (mode === 'page') {
      return FormContent;
  }
  
  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl" aria-describedby="maintenance-description">
        <DialogHeader>
          <DialogTitle>{request?.id ? 'Edit' : 'Add'} Maintenance Request</DialogTitle>
          <DialogDescription id="maintenance-description">
            Track and manage maintenance tasks for your properties.
          </DialogDescription>
        </DialogHeader>
        {FormContent}
      </DialogContent>
    </Dialog>
  );
}
