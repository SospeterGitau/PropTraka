
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tenant } from '@/lib/db-types';
import { useDataContext } from '@/context/data-context';
import { Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { TenantVerification } from './tenant-verification';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TenantFormProps {
  tenant?: Tenant | null;
  isOpen?: boolean; // Optional, for dialog mode
  onClose?: () => void; // Optional, for dialog mode
  onSubmit?: (data: Omit<Tenant, "ownerId" | "id" | "createdAt" | "updatedAt"> | Tenant) => void;
  mode?: 'dialog' | 'page'; // New prop to determine rendering mode
}

export function TenantForm({
  tenant: initialTenant,
  isOpen = false,
  onClose,
  onSubmit,
  mode = 'dialog',
}: TenantFormProps) {
  const { addTenant, updateTenant } = useDataContext();
  const router = useRouter();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<string>(''); // As string for input
  const [idType, setIdType] = useState<Tenant['idType']>('National ID');
  const [idNumber, setIdNumber] = useState('');
  const [emergencyContactName, setEmergencyContactName] = useState('');
  const [emergencyContactNumber, setEmergencyContactNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [hasConsented, setHasConsented] = useState(false); // For KYC consent

  useEffect(() => {
    if (initialTenant) {
      setFirstName(initialTenant.firstName);
      setLastName(initialTenant.lastName);
      setEmail(initialTenant.email);
      setPhoneNumber(initialTenant.phoneNumber);
      setDateOfBirth(initialTenant.dateOfBirth ? initialTenant.dateOfBirth.toDate().toISOString().split('T')[0] : '');
      setIdType(initialTenant.idType);
      setIdNumber(initialTenant.idNumber);
      setEmergencyContactName(initialTenant.emergencyContactName || '');
      setEmergencyContactNumber(initialTenant.emergencyContactNumber || '');
      setNotes(initialTenant.notes || '');
      // Assume consent for existing tenants, or add a specific field to schema if needed
      setHasConsented(true);
    } else {
      resetForm();
    }
  }, [initialTenant, isOpen]);

  const resetForm = () => {
    setFirstName(''); setLastName(''); setEmail(''); setPhoneNumber(''); setDateOfBirth('');
    setIdType('National ID'); setIdNumber(''); setEmergencyContactName(''); setEmergencyContactNumber('');
    setNotes(''); setHasConsented(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!firstName || !lastName || !email || !phoneNumber || !idType || !idNumber || !hasConsented) {
      alert('Please fill in all required fields and confirm consent for KYC.');
      return;
    }

    const tenantData: Omit<Tenant, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'> = {
      firstName,
      lastName,
      email,
      phoneNumber,
      dateOfBirth: dateOfBirth ? Timestamp.fromDate(new Date(dateOfBirth)) : undefined,
      idType,
      idNumber,
      emergencyContactName: emergencyContactName || undefined,
      emergencyContactNumber: emergencyContactNumber || undefined,
      notes: notes || undefined,
    };

    try {
      if (onSubmit) {
        // For external onSubmit, assume ownerId, createdAt, updatedAt are handled upstream
        if (initialTenant?.id) {
          onSubmit({ ...tenantData, id: initialTenant.id, ownerId: initialTenant.ownerId, createdAt: initialTenant.createdAt, updatedAt: Timestamp.now() });
        } else {
          onSubmit(tenantData);
        }
      } else {
        if (initialTenant?.id) {
          await updateTenant(initialTenant.id, { ...tenantData, id: initialTenant.id, ownerId: initialTenant.ownerId, createdAt: initialTenant.createdAt, updatedAt: Timestamp.now() });
        } else {
          await addTenant(tenantData);
        }
      }
      if (mode === 'dialog' && onClose) onClose();
      if (mode === 'page') router.push('/tenants'); // Redirect after page submission
    } catch (error) {
      console.error('Failed to save tenant:', error);
      alert('Failed to save tenant. Please try again.');
    }
  };

  const handleVerificationUpdate = async (updates: Partial<Tenant>) => {

    if (!initialTenant?.id) return;

    // Update local state (optimistic)
    // In a real app, this should re-fetch or update context
    const updatedTenant = { ...initialTenant, ...updates, updatedAt: Timestamp.now() } as Tenant;
    await updateTenant(initialTenant.id, updatedTenant);

    // Notify user
    alert("Verification status updated!");
  };

  const FormContent = (
    <div className="py-4">
      <Tabs defaultValue="details" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="verification" disabled={!initialTenant?.id} title={!initialTenant?.id ? "Save tenant first" : ""}>
            Verification
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {/* ... existing input fields ... */}
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Phone Number *</Label>
                <Input id="phoneNumber" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
              </div>
            </div>
            {/* ... (Rest of existing form fields can be copy-pasted or preserved if I use replace carefully, but since I'm wrapping in Tabs, I need to render them here. 
                  To avoid massive copy-paste in this prompt, I will assume I can write the full content or use a more surgical replace if I could, 
                  but wrapping essentially changes the structure. I will re-emit the form fields.) */}

            {/* Condensed for brevity in this tool call - I must ensure I don't break the existing fields */}
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth (optional)</Label>
              <Input id="dateOfBirth" type="date" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="idType">ID Type *</Label>
                <Select value={idType} onValueChange={(value) => setIdType(value as Tenant['idType'])} required>
                  <SelectTrigger id="idType"><SelectValue placeholder="Select ID Type" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="National ID">National ID</SelectItem>
                    <SelectItem value="Passport">Passport</SelectItem>
                    <SelectItem value="Driving License">Driving License</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="idNumber">ID Number *</Label>
                <Input id="idNumber" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} required />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="emergencyContactName">Emergency Contact</Label>
                <Input id="emergencyContactName" value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="emergencyContactNumber">Emergency Number</Label>
                <Input id="emergencyContactNumber" type="tel" value={emergencyContactNumber} onChange={(e) => setEmergencyContactNumber(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[100px]" />
            </div>

            {/* Risk Score & Consent Section */}
            <div className="items-top flex space-x-2 pt-2">
              <Checkbox id="hasConsented" checked={hasConsented} onCheckedChange={(checked) => setHasConsented(!!checked)} />
              <div className="grid gap-1.5 leading-none">
                <label htmlFor="hasConsented" className="text-sm font-medium leading-none">
                  Confirm KYC Consent.
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 w-full pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
              <Button type="submit">Save Tenant</Button>
            </div>
          </form>
        </TabsContent>

        <TabsContent value="verification">
          {initialTenant ? (
            <TenantVerification
              tenant={initialTenant}
              onUpdate={handleVerificationUpdate}
            />
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              Please save the tenant details first.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );

  if (mode === 'page') {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title={initialTenant ? 'Edit Tenant' : 'Add New Tenant'}>
          <Button variant="outline" asChild>
            <Link href="/tenants">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Tenants
            </Link>
          </Button>
        </PageHeader>
        {FormContent}
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialTenant ? 'Edit Tenant / Verify' : 'Add New Tenant'}</DialogTitle>
          <DialogDescription>Manage tenant details and identity verification.</DialogDescription>
        </DialogHeader>
        {FormContent}
      </DialogContent>
    </Dialog>
  );
}
