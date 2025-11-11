
'use client';

import type { Property, MaintenanceRequest, Contractor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface MaintenanceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<MaintenanceRequest, 'id'> | MaintenanceRequest) => void;
  request?: MaintenanceRequest | null;
  properties: Property[];
  contractors: Contractor[];
}

function formatAddress(property: Property) {
  return `${property.addressLine1}, ${property.city}, ${property.state} ${property.postalCode}`;
}

export function MaintenanceForm({ isOpen, onClose, onSubmit, request, properties, contractors }: MaintenanceFormProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const propertyId = formData.get('propertyId') as string;
    const selectedProperty = properties.find(p => p.id === propertyId);
    const contractorId = formData.get('contractorId') as string;
    const selectedContractor = contractors.find(c => c.id === contractorId);
    const isEditing = !!request?.id;

    const data: Omit<MaintenanceRequest, 'id'> | MaintenanceRequest = {
      ...(isEditing ? { id: request.id } : {}), // include id if editing
      propertyId: propertyId !== 'none' ? propertyId : undefined,
      propertyName: selectedProperty ? formatAddress(selectedProperty) : 'General Task',
      description: formData.get('description') as string,
      status: formData.get('status') as MaintenanceRequest['status'],
      priority: formData.get('priority') as MaintenanceRequest['priority'],
      reportedDate: formData.get('reportedDate') as string,
      completedDate: (formData.get('completedDate') as string) || undefined,
      cost: Number(formData.get('cost')) || undefined,
      contractorId: contractorId !== 'none' ? contractorId : undefined,
      contractorName: selectedContractor ? selectedContractor.name : undefined,
    };
    onSubmit(data);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{request ? 'Edit' : 'Add'} Maintenance Request</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto pr-6 pl-1 py-4 space-y-4">
            <div className="space-y-2">
                <Label htmlFor="propertyId">Property (Optional)</Label>
                <Select name="propertyId" id="propertyId" defaultValue={request?.propertyId || 'none'}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a property" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">General Business Task</SelectItem>
                        {properties.map(property => (
                            <SelectItem key={property.id} value={property.id}>{formatAddress(property)}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" defaultValue={request?.description} required />
            </div>
            
             <div className="space-y-2">
                <Label htmlFor="contractorId">Assigned Contractor (Optional)</Label>
                <Select name="contractorId" id="contractorId" defaultValue={request?.contractorId || 'none'}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a contractor" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {contractors.map(contractor => (
                            <SelectItem key={contractor.id} value={contractor.id}>{contractor.name} ({contractor.specialty})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select name="priority" id="priority" defaultValue={request?.priority || 'Medium'} required>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Low">Low</SelectItem>
                            <SelectItem value="Medium">Medium</SelectItem>
                            <SelectItem value="High">High</SelectItem>
                            <SelectItem value="Emergency">Emergency</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status" id="status" defaultValue={request?.status || 'To Do'} required>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="To Do">To Do</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Done">Done</SelectItem>
                            <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="reportedDate">Date Reported</Label>
                    <Input id="reportedDate" name="reportedDate" type="date" defaultValue={request?.reportedDate ? request.reportedDate.split('T')[0] : new Date().toISOString().split('T')[0]} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="completedDate">Date Completed</Label>
                    <Input id="completedDate" name="completedDate" type="date" defaultValue={request?.completedDate ? request.completedDate.split('T')[0] : ''} />
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="cost">Cost (Optional)</Label>
                <Input id="cost" name="cost" type="number" step="0.01" defaultValue={request?.cost} placeholder="Enter the final cost" />
            </div>
          
          <DialogFooter className="pt-6">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
