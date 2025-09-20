
'use client';

import type { Property } from '@/lib/types';
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

interface PropertyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (property: Property) => void;
  property?: Property | null;
}

export function PropertyForm({ isOpen, onClose, onSubmit, property }: PropertyFormProps) {
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const updatedProperty: Property = {
      id: property?.id || `p${Date.now()}`,
      addressLine1: formData.get('addressLine1') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      postalCode: formData.get('postalCode') as string,
      purchasePrice: Number(formData.get('purchasePrice')),
      mortgage: Number(formData.get('mortgage')),
      currentValue: Number(formData.get('currentValue')),
      rentalValue: Number(formData.get('rentalValue')),
      imageUrl: property?.imageUrl || 'https://picsum.photos/seed/new/600/400',
      imageHint: property?.imageHint || 'new property',
    };
    onSubmit(updatedProperty);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{property ? 'Edit Property' : 'Add Property'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="addressLine1" className="text-right">Address</Label>
              <Input id="addressLine1" name="addressLine1" defaultValue={property?.addressLine1} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="city" className="text-right">City</Label>
              <Input id="city" name="city" defaultValue={property?.city} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="state" className="text-right">State</Label>
              <Input id="state" name="state" defaultValue={property?.state} className="col-span-3" required />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="postalCode" className="text-right">Postal Code</Label>
              <Input id="postalCode" name="postalCode" defaultValue={property?.postalCode} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currentValue" className="text-right">Current Value</Label>
              <Input id="currentValue" name="currentValue" type="number" defaultValue={property?.currentValue} className="col-span-3" required />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="rentalValue" className="text-right">Rental Value</Label>
              <Input id="rentalValue" name="rentalValue" type="number" defaultValue={property?.rentalValue} className="col-span-3" required />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="purchasePrice" className="text-right">Purchase Price</Label>
              <Input id="purchasePrice" name="purchasePrice" type="number" defaultValue={property?.purchasePrice} className="col-span-3" required />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="mortgage" className="text-right">Mortgage</Label>
              <Input id="mortgage" name="mortgage" type="number" defaultValue={property?.mortgage} className="col-span-3" required />
            </div>
          </div>
          <DialogFooter>
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
