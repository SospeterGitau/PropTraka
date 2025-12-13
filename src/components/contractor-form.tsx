
'use client';


import type { Contractor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
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


interface ContractorFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Contractor, 'id' | 'ownerId'> | Contractor) => void;
  contractor?: Contractor | null;
}


export function ContractorForm({ isOpen, onClose, onSubmit, contractor }: ContractorFormProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const isEditing = !!contractor;


    const data: Omit<Contractor, 'id' | 'ownerId'> | Contractor = {
      ...(isEditing ? { id: contractor.id } : {}),
      name: formData.get('name') as string,
      type: formData.get('type') as Contractor['type'],
      email: (formData.get('email') as string) || undefined,
      phone: (formData.get('phone') as string) || undefined,
    };
    
    onSubmit(data);
    onClose();
  };


  if (!isOpen) return null;


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl" aria-describedby="contractor-description">
        <DialogHeader>
          <DialogTitle>{contractor ? 'Edit' : 'Add'} Contractor</DialogTitle>
          <DialogDescription id="contractor-description">
            Add or edit contractor details for your maintenance network.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" name="name" defaultValue={contractor?.name} required />
          </div>


          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select defaultValue={contractor?.type || ''} name="type" required>
              <SelectTrigger id="type">
                <SelectValue placeholder="Select contractor type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plumbing">Plumbing</SelectItem>
                <SelectItem value="electrical">Electrical</SelectItem>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="hvac">HVAC</SelectItem>
                <SelectItem value="roofing">Roofing</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>


          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" defaultValue={contractor?.email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" name="phone" type="tel" defaultValue={contractor?.phone} />
            </div>
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
