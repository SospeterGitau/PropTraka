

'use client';

import { useState, useMemo, memo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, getDaysInMonth, isSameMonth } from 'date-fns';
import type { Property, Transaction, ServiceCharge as ApiServiceCharge } from '@/lib/types';
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
import { collection, query, where, addDoc, doc, serverTimestamp, writeBatch, getDocs } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { createUserQuery } from '@/firebase/firestore/query-builder';
import { DatePicker } from '@/components/ui/date-picker';
import { useDataContext } from '@/context/data-context';

// Local type for form state management to handle string inputs
type FormServiceCharge = {
  name: string;
  amount: string;
};

function formatAddress(property: Property) {
  return `${property.addressLine1}, ${property.city}, ${property.state} ${property.postalCode}`;
}

// Safely creates a date for a specific day of the month, handling cases where the day doesn't exist (e.g., Feb 30th).
function createSafeMonthDate(year: number, month: number, day: number): Date {
  const date = new Date(year, month, day);
  // If the created date's day doesn't match, it means the day was invalid for that month (e.g. day 31 in a 30 day month).
  // In that case, we roll back to the last day of the correct month.
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
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();

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

    const formData = new FormData(event.currentTarget);
    
    if (!startDate || !endDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Tenancy start and end dates are required.",
      });
      setIsSubmitting(false);
      return;
    }

    const tenancyStartDateStr = format(startDate, 'yyyy-MM-dd');
    const tenancyEndDateStr = format(endDate, 'yyyy-MM-dd');

    const propertyId = formData.get('propertyId') as string;
    const selectedProperty = properties.find(p => p.id === propertyId);
    const tenant = formData.get('tenantName') as string;
    const tenantEmail = formData.get('tenantEmail') as string;
    const tenantPhone = formData.get('tenantPhone') as string;
    const rent = Number(formData.get('rent'));
    const deposit = Number(formData.get('deposit'));
    const contractUrl = formData.get('contractUrl') as string;
    const notes = formData.get('notes') as string;
    const consent = formData.get('consent') as string;

    if (!consent) {
      toast({
        variant: "destructive",
        title: "Consent Required",
        description: "You must confirm the tenant has consented to their data being stored.",
      });
      setIsSubmitting(false);
      return;
    }

    // On-demand check for duplicates
    const q = query(
      collection(firestore, 'revenue'),
      where('ownerId', '==', user.uid),
      where('propertyId', '==', propertyId),
      where('tenant', '==', tenant)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
       toast({
        variant: "destructive",
        title: "Duplicate Tenancy",
        description: `A tenancy for "${tenant}" already exists at this property.`,
      });
      setIsSubmitting(false);
      return;
    }
    
    const tenancyStartDate = startDate;
    const tenancyEndDate = endDate;
    const dayOfMonth = tenancyStartDate.getDate();

    if (tenancyEndDate < tenancyStartDate) {
      toast({
        variant: "destructive",
        title: "Invalid Date Range",
        description: "Tenancy end date cannot be before the start date.",
      });
      setIsSubmitting(false);
      return;
    }

    const tenancyId = `t${Date.now()}`;

    const finalServiceCharges: ApiServiceCharge[] = serviceCharges
      .map(sc => ({ name: sc.name, amount: Number(sc.amount) || 0 }))
      .filter(sc => sc.name && sc.amount > 0);
      
    const transactionsData = [];
    let currentDate = new Date(tenancyStartDate.getUTCFullYear(), tenancyStartDate.getUTCMonth(), 1);
    
    while (currentDate <= tenancyEndDate) {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const isFirstMonth = year === tenancyStartDate.getFullYear() && month === tenancyStartDate.getMonth();
        const isLastMonth = isSameMonth(currentDate, tenancyEndDate);
        
        const dueDate = createSafeMonthDate(year, month, dayOfMonth);
        const daysInMonth = getDaysInMonth(currentDate);
        let proRataNotes: string | undefined = undefined;
        let rentForPeriod = rent; // Default to full rent

        if (isFirstMonth && isLastMonth) { // Tenancy starts and ends in the same month
            const startDay = tenancyStartDate.getDate();
            const endDay = tenancyEndDate.getDate();
            const occupiedDays = endDay - startDay + 1;
            const dailyRent = rent / daysInMonth;
            rentForPeriod = dailyRent * occupiedDays;
            proRataNotes = `Pro-rated rent for ${occupiedDays} days.`;
        } else if (isFirstMonth) { // First month of a multi-month tenancy
            const startDay = tenancyStartDate.getDate();

            // Only pro-rate if the tenancy doesn't start on the rent due day
            if (startDay !== dayOfMonth) {
                // Calculate days from start date to the day before next due date
                const nextMonth = month + 1 > 11 ? 0 : month + 1;
                const nextYear = month + 1 > 11 ? year + 1 : year;
                const nextDueDate = createSafeMonthDate(nextYear, nextMonth, dayOfMonth);
                const oneDayBeforeNextDue = new Date(nextDueDate);
                oneDayBeforeNextDue.setDate(oneDayBeforeNextDue.getDate() - 1);
                
                // Days in this rental period (from due date to day before next due)
                const periodDays = Math.round((oneDayBeforeNextDue.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                
                // Days tenant actually occupies (from move-in to day before next due)
                const occupiedDays = Math.round((oneDayBeforeNextDue.getTime() - tenancyStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                
                const dailyRent = rent / periodDays;
                rentForPeriod = dailyRent * occupiedDays;
                proRataNotes = `Pro-rated rent for ${occupiedDays} days in the first month.`;
            }
            // If startDay === dayOfMonth, rentForPeriod remains full rent (no pro-rating)
        } else if (isLastMonth) { // Last month of a multi-month tenancy
            const endDay = tenancyEndDate.getDate();
            // The "full" period ends the day before the next due date.
            const lastDayOfFullPeriod = (dayOfMonth === 1) ? getDaysInMonth(new Date(year, month - 1)) : dayOfMonth - 1;
            // Only pro-rate if the end date is not the last day of a full rental period
            if (endDay !== lastDayOfFullPeriod) {
                const occupiedDays = endDay;
                const dailyRent = rent / daysInMonth;
                rentForPeriod = dailyRent * occupiedDays;
                proRataNotes = `Pro-rated rent for ${occupiedDays} days in the final month.`;
            }
        }
        
        rentForPeriod = Math.round(rentForPeriod * 100) / 100;
        
        const txNotes = proRataNotes ? proRataNotes : (isFirstMonth ? notes : undefined);

        const newTxData: Partial<Transaction> = {
            tenancyId,
            date: format(dueDate, 'yyyy-MM-dd'),
            rent: rentForPeriod,
            serviceCharges: finalServiceCharges,
            amountPaid: 0,
            propertyId,
            propertyName: selectedProperty ? formatAddress(selectedProperty) : 'N/A',
            tenant, tenantEmail, tenantPhone,
            type: 'revenue' as const,
            deposit: isFirstMonth ? deposit : 0,
            tenancyStartDate: tenancyStartDateStr,
            tenancyEndDate: tenancyEndDateStr,
            contractUrl,
            ownerId: user.uid,
        };

        if (txNotes) {
          newTxData.notes = txNotes;
        }
      
        transactionsData.push(newTxData);

        // Move to the next month
        let newMonth = month + 1;
        let newYear = year;
        if (newMonth > 11) {
            newMonth = 0;
            newYear++;
        }
        currentDate = new Date(newYear, newMonth, 1);
    }

    const batch = writeBatch(firestore);
    
    transactionsData.forEach(tx => {
      const docRef = doc(collection(firestore, 'revenue'));
      batch.set(docRef, { ...tx, ownerId: user.uid });
    });
    
    await batch.commit();
    
    addChangeLogEntry({
      type: 'Tenancy',
      action: 'Created',
      description: `Tenancy for "${transactionsData[0].tenant}" at "${transactionsData[0].propertyName}" was created.`,
      entityId: tenancyId,
    });
    
    setIsSubmitting(false);
    router.push('/revenue');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Tenancy Details</CardTitle>
                <CardDescription>Select the property and enter the tenant's information.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
                <div className="space-y-2">
                    <Label htmlFor="propertyId">Property</Label>
                    <Select name="propertyId" required>
                    <SelectTrigger id="propertyId"><SelectValue placeholder="Select a property" /></SelectTrigger>
                    <SelectContent>
                        {properties.map(property => (
                        <SelectItem key={property.id} value={property.id}>{formatAddress(property)}</SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="tenantName">Tenant Name</Label>
                    <Input id="tenantName" name="tenantName" required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="tenantEmail">Tenant Email</Label>
                        <Input id="tenantEmail" name="tenantEmail" type="email" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="tenantPhone">Tenant Phone</Label>
                        <Input id="tenantPhone" name="tenantPhone" type="tel" />
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Lease & Financials</CardTitle>
                <CardDescription>Set the lease duration, rent, and any service charges.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label>Tenancy Start Date</Label>
                        <DatePicker date={startDate} setDate={setStartDate} locale={settings.locale} />
                    </div>
                    <div className="space-y-2">
                        <Label>Tenancy End Date</Label>
                        <DatePicker date={endDate} setDate={setEndDate} locale={settings.locale} />
                    </div>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="rent">Monthly Rent</Label>
                        <Input id="rent" name="rent" type="number" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="deposit">Deposit (due with first month's rent)</Label>
                        <Input id="deposit" name="deposit" type="number" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label>Fixed Monthly Service Charges (optional)</Label>
                    <div className="space-y-2 rounded-md border p-4">
                    {serviceCharges.map((charge, index) => (
                        <div key={index} className="flex items-center gap-2">
                        <Input placeholder="Charge Name (e.g., Security)" value={charge.name} onChange={(e) => handleServiceChargeChange(index, 'name', e.target.value)} />
                        <Input type="number" placeholder="Amount" value={charge.amount} onChange={(e) => handleServiceChargeChange(index, 'amount', e.target.value)} className="w-32" />
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
                <CardTitle>Additional Information</CardTitle>
                <CardDescription>Add a contract link, notes, and confirm tenant consent.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
                 <div className="space-y-2">
                    <Label htmlFor="contractUrl">Contract Link (optional)</Label>
                    <Input id="contractUrl" name="contractUrl" type="url" placeholder="https://docs.google.com/..." />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="notes">Notes (optional)</Label>
                    <Textarea id="notes" name="notes" placeholder="Any initial notes about this tenancy..." />
                </div>
                <div className="items-top flex space-x-2 pt-2">
                    <Checkbox id="consent" name="consent" />
                    <div className="grid gap-1.5 leading-none">
                        <label htmlFor="consent" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                        I confirm I have the tenant's consent to store and process their personal information.
                        </label>
                        <p className="text-sm text-muted-foreground">
                        You can view the <Link href="/privacy" className="text-primary underline">Privacy Policy</Link> for details.
                        </p>
                    </div>
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

    


