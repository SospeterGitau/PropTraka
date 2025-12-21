
'use client';

import { useState, useEffect } from 'react';
import type { Contractor, Address } from '@/lib/types'; // Updated imports
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
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Timestamp } from 'firebase/firestore';
import { createContractor, updateContractor } from '@/app/actions/contractors';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/page-header';

interface ContractorFormProps {
  isOpen?: boolean; // Optional for page mode
  onClose?: () => void; // Optional for page mode
  onSubmit?: (data: Omit<Contractor, 'ownerId' | 'id' | 'createdAt' | 'updatedAt'> | Contractor) => void;
  contractor?: Contractor | null;
  mode?: 'dialog' | 'page';
}

export function ContractorForm({
  isOpen = false,
  onClose,
  onSubmit,
  contractor: initialContractor,
  mode = 'dialog'
}: ContractorFormProps) {
  const router = useRouter();

  const [companyName, setCompanyName] = useState('');
  const [contactPersonName, setContactPersonName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [serviceCategories, setServiceCategories] = useState(''); // As comma-separated string for input
  const [address, setAddress] = useState<Address>({
    street: '', city: '', state: '', zipCode: '', country: ''
  });
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialContractor) {
      setCompanyName(initialContractor.companyName);
      setContactPersonName(initialContractor.contactPersonName);
      setEmail(initialContractor.email);
      setPhoneNumber(initialContractor.phoneNumber);
      setServiceCategories(initialContractor.serviceCategories?.join(', ') || '');
      setAddress(initialContractor.address || { street: '', city: '', state: '', zipCode: '', country: '' });
      setNotes(initialContractor.notes || '');
    } else {
      resetForm();
    }
  }, [initialContractor, isOpen]);

  const resetForm = () => {
    setCompanyName(''); setContactPersonName(''); setEmail(''); setPhoneNumber('');
    setServiceCategories(''); setAddress({ street: '', city: '', state: '', zipCode: '', country: '' }); setNotes('');
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!companyName || !contactPersonName || !email || !phoneNumber || !serviceCategories) {
      alert('Please fill in all required fields.');
      return;
    }

    const contractorData: Omit<Contractor, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'> = {
      companyName,
      contactPersonName,
      email,
      phoneNumber,
      serviceCategories: serviceCategories.split(',').map(s => s.trim()).filter(s => s),
      address: address.street ? address : undefined, // Only include address if street is provided
      notes: notes || undefined,
    };

    try {
      if (onSubmit) {
        if (initialContractor?.id) {
          onSubmit({ ...contractorData, id: initialContractor.id, ownerId: initialContractor.ownerId, createdAt: initialContractor.createdAt, updatedAt: Timestamp.now() } as any);
        } else {
          onSubmit(contractorData);
        }
      } else {
        if (initialContractor?.id) {
          await updateContractor(initialContractor.id, contractorData);
        } else {
          await createContractor(contractorData);
        }
      }
      if (mode === 'dialog' && onClose) onClose();
      if (mode === 'page') router.push('/contractors');
    } catch (error) {
      console.error('Failed to save contractor:', error);
      alert('Failed to save contractor. Please try again.');
    }
  };

  const FormContent = (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="basic">Contact Info</TabsTrigger>
          <TabsTrigger value="business">Business Details</TabsTrigger>
        </TabsList>

        <div className={cn("py-4", mode === 'dialog' ? "max-h-[60vh] overflow-y-auto px-1" : "")}>
          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required placeholder="e.g. Acme Services LLC" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPersonName">Contact Person Name *</Label>
              <Input id="contactPersonName" value={contactPersonName} onChange={(e) => setContactPersonName(e.target.value)} required placeholder="e.g. John Doe" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="email@example.com" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input id="phoneNumber" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required placeholder="+1 (555) 000-0000" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="business" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serviceCategories">Service Categories (comma-separated) *</Label>
              <Input id="serviceCategories" value={serviceCategories} onChange={(e) => setServiceCategories(e.target.value)} required placeholder="e.g., Plumbing, Electrical, HVAC" />
            </div>

            <div className="space-y-4 pt-2">
              <Label>Business Address (optional)</Label>
              <div className="space-y-2">
                <Label htmlFor="street" className="text-xs text-muted-foreground">Street Address</Label>
                <Input id="street" name="street" value={address.street} onChange={handleAddressChange} placeholder="123 Main St" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-xs text-muted-foreground">City</Label>
                  <Input id="city" name="city" value={address.city} onChange={handleAddressChange} placeholder="City" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-xs text-muted-foreground">State/Province</Label>
                  <Input id="state" name="state" value={address.state} onChange={handleAddressChange} placeholder="State" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="zipCode" className="text-xs text-muted-foreground">Zip/Postal Code</Label>
                  <Input id="zipCode" name="zipCode" value={address.zipCode} onChange={handleAddressChange} placeholder="Zip Code" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country" className="text-xs text-muted-foreground">Country</Label>
                  <Input id="country" name="country" value={address.country} onChange={handleAddressChange} placeholder="Country" />
                </div>
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes, payment instructions, etc." />
            </div>
          </TabsContent>
        </div>
      </Tabs>

      <DialogFooter className="pt-4">
        {mode === 'page' ? (
          <div className="flex justify-end gap-3 w-full">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit">Save Contractor</Button>
          </div>
        ) : (
          <div className="flex justify-end gap-3 w-full">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Contractor</Button>
          </div>
        )}
      </DialogFooter>
    </form>
  );

  if (mode === 'page') {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title={initialContractor ? 'Edit Contractor' : 'Add New Contractor'}>
          <Button variant="outline" asChild>
            <Link href="/contractors">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Contractors
            </Link>
          </Button>
        </PageHeader>
        {FormContent}
      </div>
    );
  }

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="contractor-description">
        <DialogHeader>
          <DialogTitle>{initialContractor ? 'Edit' : 'Add'} Contractor</DialogTitle>
          <DialogDescription id="contractor-description">
            Manage the details of your trusted contractors and vendors.
          </DialogDescription>
        </DialogHeader>
        {FormContent}
      </DialogContent>
    </Dialog>
  );
}
