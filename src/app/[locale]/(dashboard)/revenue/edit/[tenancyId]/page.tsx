
'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import { useRouter, useParams, notFound } from 'next/navigation';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlusCircle, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, addDoc, doc, serverTimestamp, writeBatch, getDocs, Query } from 'firebase/firestore';
import { createUserQuery } from '@/firebase/firestore/query-builder';
import { DatePicker } from '@/components/ui/date-picker';
import { useDataContext } from '@/context/data-context';

// Local type for form state management to handle string inputs
type FormServiceCharge = {
  name: string;
  amount: string;
};

function formatAddress(property: Property) {
  return `${property.addressLine1}, ${property.city}, ${property.county}${property.postalCode ? ` ${property.postalCode}` : ''}`;
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

function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

const TenancyForm = memo(function TenancyForm({
  tenancyToEdit,
  properties,
  revenue,
}: {
  tenancyToEdit?: Transaction | null;
  properties: Property[];
  revenue: Transaction[];
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
  const [rentDueDate, setRentDueDate] = useState<Date | undefined>();
  const [documentUrls, setDocumentUrls] = useState({
    contractUrl: '',
    applicationFormUrl: '',
    moveInChecklistUrl: '',
    moveOutChecklistUrl: ''
  });

  const initialDeposit = useMemo(() => {
    const tCheck = tenancyToEdit as any;
    if (!tCheck?.tenancyId || !revenue) return 0;
    const firstTransaction = revenue
      .filter(t => (t as any).tenancyId === tCheck.tenancyId)
      .sort((a, b) => new Date(a.date || new Date()).getTime() - new Date(b.date || new Date()).getTime())[0];
    return (firstTransaction as any)?.deposit || 0;
  }, [tenancyToEdit, revenue]);

  useEffect(() => {
    if (tenancyToEdit) {
      const tEdit = tenancyToEdit as any;
      setServiceCharges(
        (tEdit.serviceCharges || []).map((sc: any) => ({ name: sc.name || sc.description || '', amount: sc.amount.toString() }))
      );
      const initialStartDate = tEdit.tenancyStartDate ? parseLocalDate(tEdit.tenancyStartDate) : new Date();
      setStartDate(initialStartDate);
      setEndDate(tEdit.tenancyEndDate ? parseLocalDate(tEdit.tenancyEndDate) : undefined);
      setRentDueDate(
        tEdit.rentDueDate
          ? new Date(initialStartDate.getFullYear(), initialStartDate.getMonth(), tEdit.rentDueDate)
          : undefined
      );
      setDocumentUrls({
        contractUrl: tEdit.contractUrl || '',
        applicationFormUrl: tEdit.applicationFormUrl || '',
        moveInChecklistUrl: tEdit.moveInChecklistUrl || '',
        moveOutChecklistUrl: tEdit.moveOutChecklistUrl || ''
      });
    } else {
      setServiceCharges([]);
      setStartDate(undefined);
      setEndDate(undefined);
      setRentDueDate(undefined);
      setDocumentUrls({ contractUrl: '', applicationFormUrl: '', moveInChecklistUrl: '', moveOutChecklistUrl: '' });
    }
  }, [tenancyToEdit]);

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

  const handleUrlChange = (field: keyof typeof documentUrls, value: string) => {
    setDocumentUrls(prev => ({ ...prev, [field]: value }));
  };

  const handleClearUrl = (field: keyof typeof documentUrls) => {
    setDocumentUrls(prev => ({ ...prev, [field]: '' }));
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
    if (!user || !revenue || !tenancyToEdit) return;
    setIsSubmitting(true);

    if (!startDate || !endDate || !rentDueDate) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Tenancy start date, end date, and rent payment date are required.",
      });
      setIsSubmitting(false);
      return;
    }
    const dayOfMonth = rentDueDate.getDate();

    const tenancyStartDateStr = format(startDate, 'yyyy-MM-dd');
    const tenancyEndDateStr = format(endDate, 'yyyy-MM-dd');

    const formData = new FormData(event.currentTarget);
    const propertyId = formData.get('propertyId') as string;
    const selectedProperty = properties.find(p => p.id === propertyId);
    const tenant = formData.get('tenantName') as string;
    const tenantEmail = formData.get('tenantEmail') as string;
    const tenantPhone = formData.get('tenantPhone') as string;
    const rent = Number(formData.get('rent'));
    const deposit = Number(formData.get('deposit'));
    const notes = formData.get('notes') as string;

    if (!dayOfMonth || dayOfMonth < 1 || dayOfMonth > 31) {
      toast({
        variant: "destructive",
        title: "Invalid Due Date",
        description: "Please enter a valid rent due day (1-31).",
      });
      setIsSubmitting(false);
      return;
    }

    const tenancyStartDate = startDate;
    const tenancyEndDate = endDate;

    if (tenancyEndDate < tenancyStartDate) {
      toast({
        variant: "destructive",
        title: "Invalid Date Range",
        description: "Tenancy end date cannot be before the start date.",
      });
      setIsSubmitting(false);
      return;
    }

    const tenancyId = (tenancyToEdit as any).tenancyId!;
    const existingTransactions = revenue.filter(t => (t as any).tenancyId === tenancyId);

    const finalServiceCharges: ApiServiceCharge[] = serviceCharges
      .map(sc => ({ name: sc.name, amount: Number(sc.amount) || 0 }))
      .filter(sc => sc.name && sc.amount > 0);

    const transactionsData: (Partial<Transaction> & { id?: string })[] = [];
    let currentDate = new Date(tenancyStartDate.getUTCFullYear(), tenancyStartDate.getUTCMonth(), 1);

    while (currentDate <= tenancyEndDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const isFirstMonth = isSameMonth(currentDate, tenancyStartDate);
      const isLastMonth = isSameMonth(currentDate, tenancyEndDate);

      const dueDate = createSafeMonthDate(year, month, dayOfMonth);
      let proRataNotes: string | undefined = undefined;

      const existingTx = existingTransactions.find(tx => {
        if (!tx.date) return false;
        const txDate = parseLocalDate(tx.date);
        return txDate.getFullYear() === dueDate.getFullYear() && txDate.getMonth() === dueDate.getMonth();
      });

      let rentForPeriod = rent; // Default to full rent

      if (isFirstMonth && isLastMonth) { // Tenancy starts and ends in the same month
        const startDay = tenancyStartDate.getDate();
        const endDay = tenancyEndDate.getDate();
        const occupiedDays = endDay - startDay + 1;
        const daysInBillingPeriod = getDaysInMonth(currentDate);
        const dailyRent = rent / daysInBillingPeriod;
        rentForPeriod = dailyRent * occupiedDays;
        proRataNotes = `Pro-rated rent for ${occupiedDays} days.`;
      } else if (isFirstMonth) { // First month of a multi-month tenancy
        const startDay = tenancyStartDate.getDate();

        // CRITICAL: Only pro-rate if tenancy start date is different from rent due date
        if (startDay !== dayOfMonth) {
          // Calculate days from start date to the day before next due date
          const nextMonth = month + 1 > 11 ? 0 : month + 1;
          const nextYear = month + 1 > 11 ? year + 1 : year;
          const nextDueDate = createSafeMonthDate(nextYear, nextMonth, dayOfMonth);
          const oneDayBeforeNextDue = new Date(nextDueDate);
          oneDayBeforeNextDue.setDate(oneDayBeforeNextDue.getDate() - 1);

          const periodDays = Math.round((oneDayBeforeNextDue.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          const occupiedDays = Math.round((oneDayBeforeNextDue.getTime() - tenancyStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

          const dailyRent = rent / periodDays;
          rentForPeriod = dailyRent * occupiedDays;
          proRataNotes = `Pro-rated rent for ${occupiedDays} days in the first month.`;
        }
        // If startDay === dayOfMonth, rentForPeriod stays as full rent, no notes added
      } else if (isLastMonth) { // Last month of a multi-month tenancy
        const endDay = tenancyEndDate.getDate();

        // If the end date falls before the due date in the same month, tenant pays nothing
        if (endDay < dayOfMonth) {
          rentForPeriod = 0;
          proRataNotes = `Tenancy ended before rent due date.`;
        } else {
          // Calculate occupied days FROM due date TO end date
          const occupiedDays = endDay - dayOfMonth + 1;

          // Calculate full period days (due date to day before next due)
          const nextMonth = month + 1 > 11 ? 0 : month + 1;
          const nextYear = month + 1 > 11 ? year + 1 : year;
          const nextDueDate = createSafeMonthDate(nextYear, nextMonth, dayOfMonth);
          const periodDays = Math.round((nextDueDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

          const dailyRent = rent / periodDays;
          rentForPeriod = dailyRent * occupiedDays;
          proRataNotes = `Pro-rated rent for ${occupiedDays} days in the final month.`;
        }
      }

      rentForPeriod = Math.round(rentForPeriod * 100) / 100;

      const txNotes = proRataNotes || (isFirstMonth ? notes : undefined);

      const newTxData: any = {
        tenancyId,
        date: format(dueDate, 'yyyy-MM-dd'),
        rent: rentForPeriod,
        rentDueDate: dayOfMonth,
        serviceCharges: finalServiceCharges,
        amountPaid: (existingTx as any)?.amountPaid || 0,
        propertyId,
        propertyName: selectedProperty ? formatAddress(selectedProperty) : 'N/A',
        tenant,
        tenantEmail,
        tenantPhone,
        type: 'revenue' as any,
        deposit: isFirstMonth ? deposit : 0,
        tenancyStartDate: tenancyStartDateStr,
        tenancyEndDate: tenancyEndDateStr,
        contractUrl: documentUrls.contractUrl,
        applicationFormUrl: documentUrls.applicationFormUrl,
        moveInChecklistUrl: documentUrls.moveInChecklistUrl,
        moveOutChecklistUrl: documentUrls.moveOutChecklistUrl,
        ownerId: user.uid,
      };

      if (txNotes) {
        newTxData.notes = txNotes;
      }

      if (existingTx?.id) newTxData.id = existingTx.id;

      transactionsData.push(newTxData);

      let newMonth = month + 1;
      let newYear = year;
      if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      }
      currentDate = new Date(newYear, newMonth, 1);
    }

    const batch = writeBatch(firestore);

    const newTxDates = new Set(transactionsData.map(tx => format(parseLocalDate(tx.date!), 'yyyy-MM')));

    existingTransactions.forEach(tx => {
      if (tx.date) {
        const txDate = format(parseLocalDate(tx.date), 'yyyy-MM');
        if (!newTxDates.has(txDate)) {
          if (tx.id) {
            batch.delete(doc(firestore, 'revenue', tx.id));
          }
        }
      }
    });

    transactionsData.forEach(tx => {
      const { id, ...txData } = tx;
      const docRef = id ? doc(firestore, 'revenue', id) : doc(collection(firestore, 'revenue'));
      const payload = { ...txData, ownerId: user.uid } as any;
      // Ensure new documents get a revenueTransactionId for Firestore schema compatibility
      if (!id) {
        payload.id = docRef.id;
        payload.revenueTransactionId = docRef.id;
      }
      batch.set(docRef, payload, { merge: true });
    });

    await batch.commit();

    addChangeLogEntry({
      type: 'Tenancy',
      action: 'Updated',
      description: `Tenancy for "${(transactionsData[0] as any)?.tenant}" at "${(transactionsData[0] as any)?.propertyName}" was updated.`,
      entityId: tenancyId,
    });

    setIsSubmitting(false);
    router.push('/revenue');
  };

  if (!tenancyToEdit) return <div>Loading tenancy...</div>

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
            <Select name="propertyId" defaultValue={(tenancyToEdit as any)?.propertyId} required>
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
            <Input id="tenantName" name="tenantName" defaultValue={(tenancyToEdit as any)?.tenant} required />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="tenantEmail">Tenant Email</Label>
              <Input id="tenantEmail" name="tenantEmail" type="email" defaultValue={(tenancyToEdit as any)?.tenantEmail} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tenantPhone">Tenant Phone</Label>
              <Input id="tenantPhone" name="tenantPhone" type="tel" defaultValue={(tenancyToEdit as any)?.tenantPhone || ''} />
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Tenancy Start Date</Label>
              <DatePicker date={startDate} setDate={setStartDate} locale={settings?.locale || 'en-KE'} />
            </div>
            <div className="space-y-2">
              <Label>Rent Payment Date</Label>
              <DatePicker date={rentDueDate} setDate={setRentDueDate} locale={settings?.locale || 'en-KE'} />
            </div>
            <div className="space-y-2">
              <Label>Tenancy End Date</Label>
              <DatePicker date={endDate} setDate={setEndDate} locale={settings?.locale || 'en-KE'} />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="rent">Monthly Rent</Label>
              <Input id="rent" name="rent" type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" defaultValue={(tenancyToEdit as any)?.rent || ''} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deposit">Deposit (due with first month's rent)</Label>
              <Input id="deposit" name="deposit" type="text" inputMode="decimal" pattern="[0-9]*\.?[0-9]*" defaultValue={initialDeposit} />
            </div>
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
          <CardTitle>Additional Information & Documents</CardTitle>
          <CardDescription>
            Please provide links to your documents stored in your cloud storage provider (e.g., Google Drive, Dropbox).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="space-y-2">
            <Label htmlFor="contractUrl">Tenancy Agreement</Label>
            <div className="relative">
              <Input id="contractUrl" name="contractUrl" type="url" value={documentUrls.contractUrl} onChange={(e) => handleUrlChange('contractUrl', e.target.value)} placeholder="https://docs.google.com/..." />
              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleClearUrl('contractUrl')}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="applicationFormUrl">Application Form</Label>
            <div className="relative">
              <Input id="applicationFormUrl" name="applicationFormUrl" type="url" value={documentUrls.applicationFormUrl} onChange={(e) => handleUrlChange('applicationFormUrl', e.target.value)} placeholder="https://docs.google.com/..." />
              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleClearUrl('applicationFormUrl')}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="moveInChecklistUrl">Move-in Checklist</Label>
            <div className="relative">
              <Input id="moveInChecklistUrl" name="moveInChecklistUrl" type="url" value={documentUrls.moveInChecklistUrl} onChange={(e) => handleUrlChange('moveInChecklistUrl', e.target.value)} placeholder="https://docs.google.com/..." />
              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleClearUrl('moveInChecklistUrl')}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="moveOutChecklistUrl">Move-out Checklist</Label>
            <div className="relative">
              <Input id="moveOutChecklistUrl" name="moveOutChecklistUrl" type="url" value={documentUrls.moveOutChecklistUrl} onChange={(e) => handleUrlChange('moveOutChecklistUrl', e.target.value)} placeholder="https://docs.google.com/..." />
              <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => handleClearUrl('moveOutChecklistUrl')}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" name="notes" defaultValue={(tenancyToEdit as any)?.notes || ''} />
            <p className="text-xs text-muted-foreground">Notes will only be added to the first month's invoice.</p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" asChild className="min-w-24"><Link href="/revenue">Cancel</Link></Button>
        <Button type="submit" disabled={isSubmitting} className="min-w-32">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save Changes
        </Button>
      </div>
    </form>
  );
});

export default function EditTenancyPage() {
  const { tenancyId } = useParams();
  const { user } = useUser();
  const firestore = useFirestore();

  const propertiesQuery = useMemo(() =>
    user?.uid ? createUserQuery(firestore, 'properties', user.uid) : null
    , [firestore, user?.uid]);

  const revenueQuery = useMemo(() =>
    user?.uid ? createUserQuery(firestore, 'revenue', user.uid) : null
    , [firestore, user?.uid]);

  const [propertiesSnapshot, isPropertiesLoading] = useCollection(propertiesQuery as Query<Property> | null);
  const [revenueSnapshot, isRevenueLoading] = useCollection(revenueQuery as Query<Transaction> | null);

  const properties = useMemo(() => propertiesSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Property)) || [], [propertiesSnapshot]);
  const revenue = useMemo(() => revenueSnapshot?.docs.map(doc => {
    const data = doc.data();
    // Safely handle date (Timestamp -> Date -> string)
    const dateVal = data.date ? new Date(data.date) : new Date();
    return {
      ...data,
      id: doc.id,
      date: dateVal.toISOString()
    } as Transaction;
  }) || [], [revenueSnapshot]);

  const tenancyToEdit = useMemo(() => {
    if (!revenue) return null;
    return revenue.find(t => (t as any).tenancyId === tenancyId);
  }, [revenue, tenancyId]);

  if (isPropertiesLoading || isRevenueLoading) {
    return <div>Loading...</div>;
  }

  if (!tenancyToEdit && !isRevenueLoading) {
    notFound();
  }

  return (
    <>
      <PageHeader title={`Edit Tenancy: ${(tenancyToEdit as any)?.tenant || 'Tenancy'}`}>
        <Button variant="outline" asChild>
          <Link href="/revenue">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Revenue
          </Link>
        </Button>
      </PageHeader>
      {properties && revenue && <TenancyForm tenancyToEdit={tenancyToEdit} properties={properties} revenue={revenue} />}
    </>
  );
}
