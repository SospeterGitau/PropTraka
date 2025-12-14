
'use client';

import { useState, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, getDaysInMonth, isSameMonth } from 'date-fns';
import type { Property, RevenueTransaction, Tenancy, Tenant, UserSettings } from '@/lib/db-types'; // Updated imports
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Trash2, ArrowLeft, Building, Loader2 } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, addDoc, doc, serverTimestamp, writeBatch, getDocs, Timestamp } from 'firebase/firestore'; // Added Timestamp
import { useCollection } from 'react-firebase-hooks/firestore';
import { createUserQuery } from '@/firebase/firestore/query-builder';
import { DatePicker } from '@/components/ui/date-picker';
import { useDataContext } from '@/context/data-context';

// Local type for form state management to handle string inputs for service charges
type FormServiceCharge = {
  name: string;
  amount: string;
};

function formatAddress(property: Property) {
  const address = property.address; // Use the new Address interface
  return `${address.street}, ${address.city}, ${address.state}${address.zipCode ? ` ${address.zipCode}` : ''}`;
}

// Safely creates a date for a specific day of the month, handling cases where the day doesn't exist (e.g., Feb 30th).
function createSafeMonthDate(year: number, month: number, day: number): Date {
  const date = new Date(year, month, day);
  if (date.getDate() !== day) {
    return new Date(year, month + 1, 0);
  }
  return date;
}

const TenancyForm = memo(function TenancyForm({
  properties,
}: {
  properties: Property[];
}) {
  const { toast } = useToast();
  const router = useRouter();
  const { user } = useUser();
  const firestore = useFirestore();
  const { settings } = useDataContext();
  const [serviceCharges, setServiceCharges] = useState<FormServiceCharge[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tenancy State
  const [propertyId, setPropertyId] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [rentAmount, setRentAmount] = useState<string>('');
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [paymentFrequency, setPaymentFrequency] = useState<Tenancy['paymentFrequency']>('Monthly'); // New field
  const [leaseAgreementUrl, setLeaseAgreementUrl] = useState('');
  const [moveInChecklistUrl, setMoveInChecklistUrl] = useState('');

  // Tenant State (New Fields)
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [idType, setIdType] = useState<Tenant['idType']>('National ID');
  const [idNumber, setIdNumber] = useState('');
  const [tenantNotes, setTenantNotes] = useState(''); // Differentiating from tenancy notes
  const [consent, setConsent] = useState(false);
  const [rentDueDateDay, setRentDueDateDay] = useState<string>('1'); // Day of month for rent due

  const addServiceCharge = () => {
    setServiceCharges([...serviceCharges, { name: '', amount: '0' }]);
  };

  const removeServiceCharge = (index: number) => {
    setServiceCharges(serviceCharges.filter((_, i) => i !== index));
  };

  const handleServiceChargeChange = (index: number, field: 'name' | 'amount', value: string) => {
    const newCharges = [...serviceCharges];
    newCharges[index][field] = value;
    setServiceCharges(newCharges);
  };

  const addChangeLogEntry = async (log: Omit<any, 'id' | 'date' | 'ownerId'>) => {
    if (!user) return;
    await addDoc(collection(firestore, 'changelog'), {
      ...log,
      ownerId: user.uid,
      date: serverTimestamp(),
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    if (!startDate || !endDate || !rentAmount || !depositAmount || !propertyId || !firstName || !lastName || !email || !phoneNumber || !idNumber || !consent) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please fill in all required tenancy and tenant details.",
      });
      setIsSubmitting(false);
      return;
    }

    const rent = Number(rentAmount);
    const deposit = Number(depositAmount);
    const rentDueDay = Number(rentDueDateDay);

    if (isNaN(rent) || rent <= 0 || isNaN(deposit) || deposit < 0) {
        toast({
            variant: "destructive",
            title: "Validation Error",
            description: "Rent and Deposit must be valid positive numbers.",
        });
        setIsSubmitting(false);
        return;
    }

    if (endDate < startDate) {
      toast({
        variant: "destructive",
        title: "Invalid Date Range",
        description: "Tenancy end date cannot be before the start date.",
      });
      setIsSubmitting(false);
      return;
    }

    if (rentDueDay < 1 || rentDueDay > 31) {
        toast({
            variant: "destructive",
            title: "Invalid Rent Due Day",
            description: "Rent due day must be between 1 and 31.",
        });
        setIsSubmitting(false);
        return;
    }

    const batch = writeBatch(firestore);
    const now = Timestamp.now();

    // 1. Create Tenant Document
    const tenantRef = doc(collection(firestore, 'tenants'));
    const newTenant: Tenant = {
      id: tenantRef.id,
      ownerId: user.uid,
      firstName,
      lastName,
      email,
      phoneNumber,
      idType,
      idNumber,
      notes: tenantNotes || undefined,
      createdAt: now,
      updatedAt: now,
    };
    batch.set(tenantRef, newTenant);

    // 2. Create Tenancy Document
    const tenancyRef = doc(collection(firestore, 'tenancies'));
    const newTenancy: Tenancy = {
      id: tenancyRef.id,
      ownerId: user.uid,
      propertyId,
      tenantId: tenantRef.id,
      startDate: Timestamp.fromDate(startDate),
      endDate: Timestamp.fromDate(endDate),
      rentAmount: rent,
      depositAmount: deposit,
      serviceChargeAmount: finalServiceCharges.reduce((sum, sc) => sum + sc.amount, 0) || undefined,
      paymentFrequency,
      status: 'Active',
      leaseAgreementUrl: leaseAgreementUrl || undefined,
      moveInChecklistUrl: moveInChecklistUrl || undefined,
      createdAt: now,
      updatedAt: now,
    };
    batch.set(tenancyRef, newTenancy);

    // 3. Generate initial Revenue Transactions
    const finalServiceCharges = serviceCharges
      .map(sc => ({ name: sc.name, amount: Number(sc.amount) || 0 }))
      .filter(sc => sc.name && sc.amount > 0);

    let currentDate = new Date(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1);
    
    while (currentDate <= endDate) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const transactionDate = createSafeMonthDate(year, month, rentDueDay);
        
        // Only generate transactions within the tenancy period
        if (transactionDate >= startDate && transactionDate <= endDate) {
            const newRevenueTx: RevenueTransaction = {
                ownerId: user.uid,
                tenancyId: tenancyRef.id,
                propertyId,
                tenantId: tenantRef.id,
                amount: rent, // This will be the base rent for the month
                date: Timestamp.fromDate(transactionDate),
                type: 'Rent',
                paymentMethod: 'N/A', // Default, to be updated upon payment
                status: 'Overdue', // Initial status
                invoiceNumber: `INV-${tenancyRef.id}-${format(transactionDate, 'yyyyMMdd')}`,
                notes: '',
                createdAt: now,
                updatedAt: now,
            };
            batch.set(doc(collection(firestore, 'revenue')), newRevenueTx);

            // Add service charge transactions for this month if applicable
            if (newTenancy.serviceChargeAmount && newTenancy.serviceChargeAmount > 0) {
                const newServiceChargeTx: RevenueTransaction = {
                    ownerId: user.uid,
                    tenancyId: tenancyRef.id,
                    propertyId,
                    tenantId: tenantRef.id,
                    amount: newTenancy.serviceChargeAmount,
                    date: Timestamp.fromDate(transactionDate),
                    type: 'Service Charge',
                    paymentMethod: 'N/A',
                    status: 'Overdue',
                    invoiceNumber: `SC-${tenancyRef.id}-${format(transactionDate, 'yyyyMMdd')}`,
                    notes: 'Monthly Service Charge',
                    createdAt: now,
                    updatedAt: now,
                };
                batch.set(doc(collection(firestore, 'revenue')), newServiceChargeTx);
            }
        }

        currentDate = new Date(year, month + 1, 1);
    }

    try {
      await batch.commit();
      addChangeLogEntry({
        type: 'Tenancy',
        action: 'Created',
        description: `Tenancy for "${firstName} ${lastName}" at "${properties.find(p => p.id === propertyId)?.name}" was created.`,
        entityId: tenancyRef.id,
      });
      toast({
        title: 'Tenancy Created',
        description: 'New tenancy and associated transactions added successfully.',
      });
      router.push('/revenue');
    } catch (error: any) {
      console.error('Failed to save tenancy:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to save tenancy: ${error.message}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Tenant Details</CardTitle>
                <CardDescription>Enter the tenant's personal and contact information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Phone Number *</Label>
                        <Input id="phoneNumber" type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                 <div className="space-y-2">
                    <Label htmlFor="tenantNotes">Tenant Notes (optional)</Label>
                    <Textarea id="tenantNotes" value={tenantNotes} onChange={(e) => setTenantNotes(e.target.value)} placeholder="Any relevant notes about the tenant..." />
                </div>
                <div className="items-top flex space-x-2 pt-2">
                    <Checkbox id="consent" checked={consent} onCheckedChange={(checked) => setConsent(!!checked)} />
                    <div className="grid gap-1.5 leading-none">
                        <label htmlFor="consent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        I confirm I have the tenant's consent to store and process their personal information.
                        </label>
                        <p className="text-sm text-muted-foreground">
                        You can view the <Link href="/privacy-policy" className="text-primary underline">Privacy Policy</Link> for details.
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Tenancy Details</CardTitle>
                <CardDescription>Select the property and enter the lease specifics.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
                <div className="space-y-2">
                    <Label htmlFor="propertyId">Property *</Label>
                    <Select value={propertyId} onValueChange={setPropertyId} required>
                        <SelectTrigger id="propertyId"><SelectValue placeholder="Select a property" /></SelectTrigger>
                        <SelectContent>
                            {properties.map(property => (
                            <SelectItem key={property.id} value={property.id}>{formatAddress(property)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label>Tenancy Start Date *</Label>
                        <DatePicker date={startDate} setDate={setStartDate} locale={settings?.dateFormat || 'en-KE'} />
                    </div>
                    <div className="space-y-2">
                        <Label>Tenancy End Date *</Label>
                        <DatePicker date={endDate} setDate={setEndDate} locale={settings?.dateFormat || 'en-KE'} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="rentDueDateDay">Rent Due Day of Month *</Label>
                        <Input id="rentDueDateDay" type="number" min="1" max="31" value={rentDueDateDay} onChange={(e) => setRentDueDateDay(e.target.value)} required />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="rentAmount">Monthly Rent *</Label>
                        <Input id="rentAmount" value={rentAmount} onChange={(e) => setRentAmount(e.target.value)} type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="depositAmount">Deposit Amount *</Label>
                        <Input id="depositAmount" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" required />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="paymentFrequency">Payment Frequency *</Label>
                    <Select value={paymentFrequency} onValueChange={(value) => setPaymentFrequency(value as Tenancy['paymentFrequency'])} required>
                        <SelectTrigger id="paymentFrequency"><SelectValue placeholder="Select frequency" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Monthly">Monthly</SelectItem>
                            <SelectItem value="Quarterly">Quarterly</SelectItem>
                            <SelectItem value="Annually">Annually</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label>Fixed Monthly Service Charges (optional)</Label>
                    <div className="space-y-2 rounded-md border p-4">
                    {serviceCharges.map((charge, index) => (
                        <div key={index} className="flex items-center gap-2">
                        <Input placeholder="Charge Name (e.g., Security)" value={charge.name} onChange={(e) => handleServiceChargeChange(index, 'name', e.target.value)} />
                        <Input type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" placeholder="Amount" value={charge.amount} onChange={(e) => handleServiceChargeChange(index, 'amount', e.target.value)} className="w-32" />
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeServiceCharge(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={addServiceCharge} className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Service Charge
                    </Button>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
             <CardHeader>
                <CardTitle>Document Links</CardTitle>
                <CardDescription>
                    Please provide links to tenancy-related documents.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
                 <div className="space-y-2">
                    <Label htmlFor="leaseAgreementUrl">Lease Agreement URL (optional)</Label>
                    <Input id="leaseAgreementUrl" value={leaseAgreementUrl} onChange={(e) => setLeaseAgreementUrl(e.target.value)} type="url" placeholder="https://docs.google.com/..." />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="moveInChecklistUrl">Move-in Checklist URL (optional)</Label>
                    <Input id="moveInChecklistUrl" value={moveInChecklistUrl} onChange={(e) => setMoveInChecklistUrl(e.target.value)} type="url" placeholder="https://docs.google.com/..." />
                </div>
            </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" asChild className="min-w-24"><Link href="/revenue">Cancel</Link></Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-32">
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Tenancy
            </Button>
        </div>
    </form>
  );
});

export default function AddTenancyPage() {
  const { user, isAuthLoading } = useUser();
  const firestore = useFirestore();

  const propertiesQuery = useMemo(() => 
    user?.uid ? createUserQuery(firestore, 'properties', user.uid) : null
  , [firestore, user?.uid]);

  const [propertiesSnapshot, isPropertiesLoading] = useCollection(propertiesQuery);
  const properties = useMemo(() => propertiesSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property)) || [], [propertiesSnapshot]);

  const isLoading = isAuthLoading || isPropertiesLoading;

  if (isLoading) {
    return (
        <div className="flex h-[calc(100vh-200px)] w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin" />
        </div>
    );
  }
  
  if (!properties || properties.length === 0) {
      return (
          <>
            <PageHeader title="Add New Tenancy" />
             <Card className="text-center py-16">
                <CardHeader>
                    <div className="mx-auto bg-muted rounded-full p-4 w-fit">
                        <Building className="w-12 h-12 text-muted-foreground" />
                    </div>
                    <CardTitle className="mt-4 !text-2xl">No Properties Found</CardTitle>
                    <CardDescription>You need to add a property before you can create a tenancy.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/properties">Add Your First Property</Link>
                    </Button>
                </CardContent>
            </Card>
          </>
      )
  }

  return (
    <>
      <PageHeader title="Add New Tenancy">
        <Button variant="outline" asChild>
          <Link href="/revenue">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Revenue
          </Link>
        </Button>
      </PageHeader>
      <TenancyForm properties={properties} />
    </>
  );
}
