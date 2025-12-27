
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

  const FormContent = (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="grid grid-cols-2 gap-4">
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
          <Label htmlFor="emergencyContactName">Emergency Contact Name (optional)</Label>
          <Input id="emergencyContactName" value={emergencyContactName} onChange={(e) => setEmergencyContactName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergencyContactNumber">Emergency Contact Number (optional)</Label>
          <Input id="emergencyContactNumber" type="tel" value={emergencyContactNumber} onChange={(e) => setEmergencyContactNumber(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[100px]" />
      </div>
      <div className="space-y-4 pt-4 border-t">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Risk Assessment</h3>
          {/* Power Law Feature: AI Risk Score */}
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              // In a real implementation, we'd use a transition and loading state
              const { getTenantRiskScore } = await import('@/lib/actions');
              const toast = (await import('@/components/ui/use-toast')).toast;

              try {
                toast({ title: "Analyzing Risk...", description: "Consulting AI Risk Model..." });
                const data = {
                  firstName, lastName, email, phoneNumber, idNumber,
                  // mocked extra data for demo
                  creditScore: 650, income: 50000, rent: 1200, history: "Clean"
                };
                const result = await getTenantRiskScore(data);

                if (result.error) {
                  toast({ variant: "destructive", title: "Error", description: result.error });
                } else {
                  alert(`Risk Score: ${result.riskScore}/100\nLevel: ${result.riskLevel}\nVerdict: ${result.recommendation}\n\nAnalysis: ${result.analysis}`);
                  // In real app, save this to state or DB
                }
              } catch (e: any) {
                toast({ variant: "destructive", title: "Error", description: e.message });
              }
            }}
          >
            <span className="mr-2">⚡</span> Assess Risk (AI)
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Use the AI to detect "Fat Tail" risks (evictions, fraud) that standard checks miss.
        </p>
      </div>

      <div className="items-top flex space-x-2 pt-2">
        <Checkbox id="hasConsented" checked={hasConsented} onCheckedChange={(checked) => setHasConsented(!!checked)} />
        <div className="grid gap-1.5 leading-none">
          <label htmlFor="hasConsented" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            I confirm the tenant has consented to their personal data being collected and processed for tenancy management purposes. *
          </label>
          <p className="text-sm text-muted-foreground">
            This is required for KYC compliance. View the <Link href="/privacy-policy" className="text-primary underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-3 w-full">
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">Save Tenant</Button>
      </div>
    </DialogFooter>
    </form >
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
          <DialogTitle>{initialTenant ? 'Edit Tenant' : 'Add New Tenant'}</DialogTitle>
          <DialogDescription>Enter the tenant's details for record keeping and KYC.</DialogDescription>
        </DialogHeader>
        {FormContent}
      </DialogContent>
    </Dialog>
  );
}
