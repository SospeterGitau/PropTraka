
'use client';

import { useState, useEffect } from 'react';
import type { Contractor } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ContractorFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Contractor, 'id' | 'ownerId'> | Contractor) => void;
  contractor?: Contractor | null;
  mode?: 'dialog' | 'page';
}

const contractorTypes = [
  'Plumbing',
  'Electrical',
  'General',
  'HVAC',
  'Roofing',
  'Painting',
  'Landscaping',
  'Cleaning',
  'Other',
];

export function ContractorForm({ isOpen, onClose, onSubmit, contractor, mode = 'dialog' }: ContractorFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [businessName, setBusinessName] = useState('');
  
  // Structured Address State
  const [addressLine1, setAddressLine1] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('');
  
  const [taxId, setTaxId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (contractor) {
      setName(contractor.name || '');
      setType(contractor.type || '');
      setEmail(contractor.email || '');
      setPhone(contractor.phone || '');
      setBusinessName(contractor.businessName || '');
      
      setAddressLine1(contractor.addressLine1 || '');
      setCity(contractor.city || '');
      setState(contractor.state || '');
      setZipCode(contractor.zipCode || '');
      setCountry(contractor.country || '');
      
      setTaxId(contractor.taxId || '');
      setNotes(contractor.notes || '');
    }
  }, [contractor, isOpen]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isEditing = !!contractor;

    const data: Omit<Contractor, 'id' | 'ownerId'> | Contractor = {
      ...(isEditing ? { id: contractor.id } : {}),
      name,
      type,
      email: email || undefined,
      phone: phone || undefined,
      businessName: businessName || undefined,
      addressLine1: addressLine1 || undefined,
      city: city || undefined,
      state: state || undefined,
      zipCode: zipCode || undefined,
      country: country || undefined,
      taxId: taxId || undefined,
      notes: notes || undefined,
    };
    
    onSubmit(data);
    if (mode === 'dialog') {
        onClose();
    }
  };

  const FormContent = (
      <form onSubmit={handleSubmit} className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="business">Business Details</TabsTrigger>
            </TabsList>
            
            <div className={cn("py-4", mode === 'dialog' ? "max-h-[60vh] overflow-y-auto px-1" : "")}>
                <TabsContent value="basic" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Contact Name *</Label>
                            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. John Doe" />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="type">Specialty / Type *</Label>
                            <Select value={type} onValueChange={setType} required>
                                <SelectTrigger id="type">
                                    <SelectValue placeholder="Select contractor type" />
                                </SelectTrigger>
                                <SelectContent>
                                    {contractorTypes.map((t) => (
                                        <SelectItem key={t} value={t}>{t}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 (555) 000-0000" />
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="business" className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="businessName">Company / Business Name</Label>
                        <Input id="businessName" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Acme Services LLC" />
                    </div>

                    <div className="space-y-4 pt-2">
                        <Label>Business Address</Label>
                        
                        <div className="space-y-2">
                            <Label htmlFor="addressLine1" className="text-xs text-muted-foreground">Street Address</Label>
                            <Input id="addressLine1" value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} placeholder="123 Main St" />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="city" className="text-xs text-muted-foreground">City</Label>
                                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="state" className="text-xs text-muted-foreground">State/Province</Label>
                                <Input id="state" value={state} onChange={(e) => setState(e.target.value)} placeholder="State" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="zipCode" className="text-xs text-muted-foreground">Zip/Postal Code</Label>
                                <Input id="zipCode" value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="Zip Code" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="country" className="text-xs text-muted-foreground">Country</Label>
                                <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                        <Label htmlFor="taxId">Tax ID / VAT Number</Label>
                        <Input id="taxId" value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="e.g. 123-456-789" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Notes</Label>
                        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes, payment instructions, etc." />
                    </div>
                </TabsContent>
            </div>
        </Tabs>

        <div className={cn("pt-4 flex items-center gap-4", mode === 'dialog' ? "justify-end" : "justify-end border-t")}>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Contractor</Button>
        </div>
      </form>
  );

  if (mode === 'page') {
      return FormContent;
  }

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl" aria-describedby="contractor-description">
        <DialogHeader>
          <DialogTitle>{contractor ? 'Edit' : 'Add'} Contractor</DialogTitle>
          <DialogDescription id="contractor-description">
            Manage the details of your trusted contractors and vendors.
          </DialogDescription>
        </DialogHeader>
        {FormContent}
      </DialogContent>
    </Dialog>
  );
}
