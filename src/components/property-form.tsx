
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';

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
    const id = property?.id || `p${Date.now()}`;
    const updatedProperty: Property = {
      id: id,
      addressLine1: formData.get('addressLine1') as string,
      city: formData.get('city') as string,
      state: formData.get('state') as string,
      postalCode: formData.get('postalCode') as string,
      propertyType: formData.get('propertyType') as Property['propertyType'],
      buildingType: formData.get('buildingType') as Property['buildingType'],
      bedrooms: Number(formData.get('bedrooms')),
      bathrooms: Number(formData.get('bathrooms')),
      size: Number(formData.get('size')) || undefined,
      sizeUnit: formData.get('sizeUnit') as Property['sizeUnit'] || undefined,
      purchasePrice: Number(formData.get('purchasePrice')),
      purchaseTaxes: Number(formData.get('purchaseTaxes')) || 0,
      mortgage: Number(formData.get('mortgage')),
      currentValue: Number(formData.get('currentValue')),
      rentalValue: Number(formData.get('rentalValue')),
      imageUrl: property?.imageUrl || `https://picsum.photos/seed/${id}/600/400`,
      imageHint: property?.imageHint || 'new property',
    };
    onSubmit(updatedProperty);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{property ? 'Edit Property' : 'Add Property'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto pr-6 pl-1 py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="addressLine1">Address Line 1</Label>
              <Input id="addressLine1" name="addressLine1" defaultValue={property?.addressLine1} required />
            </div>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                 <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" name="city" defaultValue={property?.city} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="state">County/State</Label>
                    <Input id="state" name="state" defaultValue={property?.state} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="postalCode">Postcode</Label>
                    <Input id="postalCode" name="postalCode" defaultValue={property?.postalCode} required />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="propertyType">Property Type</Label>
                <Select name="propertyType" defaultValue={property?.propertyType || 'Domestic'} required>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Domestic">Domestic</SelectItem>
                        <SelectItem value="Commercial">Commercial</SelectItem>
                    </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                <Label htmlFor="buildingType">Building Type</Label>
                <Select name="buildingType" defaultValue={property?.buildingType} required>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                        <SelectLabel>Domestic</SelectLabel>
                        <SelectItem value="Studio">Studio</SelectItem>
                        <SelectItem value="Terraced House">Terraced House</SelectItem>
                        <SelectItem value="Semi-Detached House">Semi-Detached House</SelectItem>
                        <SelectItem value="Detached House">Detached House</SelectItem>
                        <SelectItem value="Bungalow">Bungalow</SelectItem>
                        <SelectItem value="Flat">Flat</SelectItem>
                        <SelectItem value="Maisonette">Maisonette</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                        <SelectLabel>Commercial</SelectLabel>
                        <SelectItem value="Office">Office</SelectItem>
                        <SelectItem value="Retail">Retail</SelectItem>
                        <SelectItem value="Industrial">Industrial</SelectItem>
                        </SelectGroup>
                        <SelectGroup>
                        <SelectItem value="Other">Other</SelectItem>
                        </SelectGroup>
                    </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="bedrooms">Bedrooms</Label>
                    <Input id="bedrooms" name="bedrooms" type="number" defaultValue={property?.bedrooms} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="bathrooms">Bathrooms</Label>
                    <Input id="bathrooms" name="bathrooms" type="number" defaultValue={property?.bathrooms} required />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="size">Size</Label>
                    <Input id="size" name="size" type="number" defaultValue={property?.size}/>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="sizeUnit">Size Unit</Label>
                     <Select name="sizeUnit" defaultValue={property?.sizeUnit || 'sqm'}>
                        <SelectTrigger>
                            <SelectValue placeholder="Unit" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="sqft">sq ft</SelectItem>
                            <SelectItem value="sqm">sq m</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="purchasePrice">Purchase Price</Label>
                    <Input id="purchasePrice" name="purchasePrice" type="number" defaultValue={property?.purchasePrice} required />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="purchaseTaxes">Purchase Taxes &amp; Fees</Label>
                    <Input id="purchaseTaxes" name="purchaseTaxes" type="number" defaultValue={property?.purchaseTaxes} />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="mortgage">Mortgage</Label>
                <Input id="mortgage" name="mortgage" type="number" defaultValue={property?.mortgage} required />
                </div>
                <div className="space-y-2">
                <Label htmlFor="currentValue">Current Value</Label>
                <Input id="currentValue" name="currentValue" type="number" defaultValue={property?.currentValue} required />
                </div>
            </div>
             <div className="space-y-2">
              <Label htmlFor="rentalValue">Target/Asking Monthly Rent</Label>
              <Input id="rentalValue" name="rentalValue" type="number" defaultValue={property?.rentalValue} required />
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
