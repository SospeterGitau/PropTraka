
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
import { Tenant } from '@/lib/types';
import { createTenant, updateTenant } from '@/app/actions/tenants';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

import { ArrowLeft, Sparkles, Loader2, PlayCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { assessTenantRisk } from '@/ai/flows/assess-tenant-risk';
import { useTransition } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

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

  // Risk Assessment State (Temporary fields not in DB)
  const [income, setIncome] = useState('');
  const [rentAmount, setRentAmount] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('Employed');
  const [riskAssessment, setRiskAssessment] = useState<any>(null);
  const [isAssessing, startAssessment] = useTransition();

  const handleAssessRisk = () => {
    if (!income || !rentAmount) {
      alert("Please enter Income and Proposed Rent for risk assessment.");
      return;
    }
    startAssessment(async () => {
      try {
        const result = await assessTenantRisk({
          personal: {},
          financial: {
            income: Number(income),
            rentAmount: Number(rentAmount),
            employmentType: employmentStatus === 'Self-Employed' ? 'Informal' :
              employmentStatus === 'Unemployed' ? 'Unemployed' : 'Formal',
            mobileMoneyData: {
              statementVerified: false
            }
          },
          verificationMethod: 'NONE'
        });
        setRiskAssessment(result);

        // Auto-append to notes
        const assessmentNote = `[AI Risk Assessment]\nScore: ${result.riskScore}/100 (${result.riskLevel})\nRecommendation: ${result.recommendation}\nFactors: ${result.factors.join(', ')}`;
        setNotes(prev => prev ? `${prev}\n\n${assessmentNote}` : assessmentNote);
      } catch (error) {
        console.error("Risk assessment failed", error);
      }
    });
  };

  useEffect(() => {
    if (initialTenant) {
      setFirstName(initialTenant.firstName);
      setLastName(initialTenant.lastName);
      setEmail(initialTenant.email);
      setPhoneNumber(initialTenant.phoneNumber);
      const dob = initialTenant.dateOfBirth;
      const dobString = typeof dob === 'object' && dob && 'toDate' in dob ? (dob as any).toDate().toISOString().split('T')[0] : (typeof dob === 'string' ? dob : '');
      setDateOfBirth(dobString);
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

    const tenantData = {
      firstName,
      lastName,
      email,
      phoneNumber,
      dateOfBirth: dateOfBirth || undefined,
      idType,
      idNumber,
      emergencyContactName: emergencyContactName || undefined,
      emergencyContactNumber: emergencyContactNumber || undefined,
      notes: notes || undefined,
    };

    try {
      if (onSubmit) {
        // If onSubmit is provided, use it (wrapping simple payload)
        // Ideally onSubmit shouldn't be used if we standardized on Action, but support legacy for now
        onSubmit({ ...tenantData, id: initialTenant?.id, ownerId: initialTenant?.ownerId } as any);
      } else {
        if (initialTenant?.id) {
          await updateTenant(initialTenant.id, tenantData);
        } else {
          await createTenant(tenantData as any);
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
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <div className="border rounded-md p-4 bg-muted/30 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-sm">AI Risk Assessment (Optional)</h3>
        </div>
        <p className="text-xs text-muted-foreground">
          Enter financial details to generate a preliminary risk profile. Results are saved to Notes.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="income" className="text-xs">Monthly Income</Label>
            <Input id="income" type="number" value={income} onChange={(e) => setIncome(e.target.value)} placeholder="e.g. 50000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rentAmount" className="text-xs">Proposed Rent</Label>
            <Input id="rentAmount" type="number" value={rentAmount} onChange={(e) => setRentAmount(e.target.value)} placeholder="e.g. 15000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="employmentStatus" className="text-xs">Employment</Label>
            <Select value={employmentStatus} onValueChange={setEmploymentStatus}>
              <SelectTrigger id="employmentStatus"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Employed">Employed</SelectItem>
                <SelectItem value="Self-Employed">Self-Employed</SelectItem>
                <SelectItem value="Unemployed">Unemployed</SelectItem>
                <SelectItem value="Student">Student</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end">
          <Button type="button" size="sm" variant="secondary" onClick={handleAssessRisk} disabled={isAssessing || !income || !rentAmount}>
            {isAssessing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PlayCircle className="w-4 h-4 mr-2" />}
            Run Assessment
          </Button>
        </div>

        {riskAssessment && (
          <Card className="bg-background border-l-4 data-[level=High]:border-l-red-500 data-[level=Medium]:border-l-yellow-500 data-[level=Low]:border-l-green-500" data-level={riskAssessment.riskLevel}>
            <CardContent className="pt-4 pb-4">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-bold text-lg flex items-center gap-2">
                    Risk Score: {riskAssessment.riskScore}/100
                    <Badge variant={riskAssessment.riskLevel === 'Low' ? 'default' : 'destructive'} className={riskAssessment.riskLevel === 'Low' ? 'bg-green-600' : ''}>
                      {riskAssessment.riskLevel} Risk
                    </Badge>
                  </p>
                </div>
              </div>
              <p className="text-sm font-medium mb-1">{riskAssessment.recommendation}</p>
              <ul className="text-xs text-muted-foreground list-disc pl-4">
                {riskAssessment.factors.map((f: string, i: number) => <li key={i}>{f}</li>)}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[100px]" />
      </div>
      <div className="items-top flex space-x-2 pt-2">
        <Checkbox id="hasConsented" checked={hasConsented} onCheckedChange={(checked) => setHasConsented(!!checked)} />
        <div className="grid gap-1.5 leading-none">
          <label htmlFor="hasConsented" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
            I confirm the tenant has consented to their personal data being collected and processed for tenancy management purposes. *
          </label>
          <p className="text-sm text-muted-foreground">
            This is required for KYC compliance. View the <Link href="/help-center/privacy-policy" className="text-primary underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
      <DialogFooter className="pt-4">
        {mode === 'page' ? (
          <div className="flex justify-end gap-3 w-full">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit">Save Tenant</Button>
          </div>
        ) : (
          <div className="flex justify-end gap-3 w-full">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Tenant</Button>
          </div>
        )}
      </DialogFooter>
    </form>
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
