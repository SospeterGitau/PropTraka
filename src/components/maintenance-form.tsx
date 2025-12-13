
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

interface MaintenanceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<MaintenanceRequest, 'id'> | MaintenanceRequest) => void;
  request?: Partial<MaintenanceRequest> | null;
  properties: Property[];
  contractors: Contractor[];
}

function formatAddress(property: Property) {
  return `${property.addressLine1}, ${property.city}, ${property.postalCode}`;
}

export function MaintenanceForm({ isOpen, onClose, onSubmit, request, properties, contractors }: MaintenanceFormProps) {
  const [contractorId, setContractorId] = useState('');
  const [isContractorOpen, setIsContractorOpen] = useState(false);
  const { settings } = useDataContext();
  const [date, setDate] = useState<Date | undefined>();

  useEffect(() => {
    if (isOpen) {
      setContractorId((request as any)?.contractorId || '');
      setDate((request as any)?.dueDate ? new Date((request as any).dueDate) : new Date());
    }
  }, [isOpen, request]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const propertyId = formData.get('propertyId') as string;
    const selectedProperty = properties.find(p => p.id === propertyId);
    const selectedContractor = contractors.find(c => c.id === contractorId);
    const isEditing = !!request?.id;

    const data = {
      ...(isEditing ? { id: request.id } : {}),
      dueDate: format(date!, 'yyyy-MM-dd'),
      propertyId: propertyId,
      propertyName: selectedProperty ? formatAddress(selectedProperty) : 'General',
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      priority: formData.get('priority') as MaintenanceRequest['priority'],
      status: request?.status || 'pending',
      contractorId: contractorId || undefined,
      contractorName: selectedContractor?.name,
      estimatedCost: formData.get('estimatedCost') ? Number(formData.get('estimatedCost')) : undefined,
      notes: formData.get('notes') as string,
    } as unknown as Omit<MaintenanceRequest, 'id'> | MaintenanceRequest;

    onSubmit(data);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl" aria-describedby="maintenance-description">
        <DialogHeader>
          <DialogTitle>{request?.id ? 'Edit' : 'Add'} Maintenance Request</DialogTitle>
          <DialogDescription id="maintenance-description">
            Track and manage maintenance tasks for your properties.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2 py-4">
          <div className="space-y-2">
            <Label htmlFor="date">Due Date</Label>
            <DatePicker date={date} setDate={setDate} locale={settings?.locale || 'en-US'} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="propertyId">Property</Label>
            <Select name="propertyId" defaultValue={request?.propertyId || ''}>
              <SelectTrigger id="propertyId">
                <SelectValue placeholder="Select a property" />
              </SelectTrigger>
              <SelectContent>
                {properties.map(property => (
                  <SelectItem key={property.id} value={property.id}>{formatAddress(property)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={request?.title} required placeholder="e.g., Replace roof shingles" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" defaultValue={request?.description} required placeholder="Describe the maintenance needed..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Priority</Label>
            <Select name="priority" defaultValue={request?.priority || 'medium'} required>
              <SelectTrigger id="priority">
                <SelectValue placeholder="Select priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Contractor (optional)</Label>
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
            <Label htmlFor="estimatedCost">Estimated Cost (optional)</Label>
            <Input id="estimatedCost" name="estimatedCost" type="number" step="0.01" defaultValue={(request as any)?.estimatedCost} placeholder="0.00" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" name="notes" defaultValue={request?.notes} placeholder="Additional notes..." />
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
