'use client';

import { useState, useEffect, memo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format, eachMonthOfInterval } from 'date-fns';
import type { Property, Transaction, ServiceCharge } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { PlusCircle, Trash2, ArrowLeft } from 'lucide-react';
import { useUser, useFirestore } from '@/firebase';
import { useCollection } from '@/firebase/firestore/use-collection';
import { collection, query, where, addDoc, doc, serverTimestamp, writeBatch, getDocs } from 'firebase/firestore';

function formatAddress(property: Property) {
  return `${property.addressLine1}, ${property.city}, ${property.state} ${property.postalCode}`;
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
  const [serviceCharges, setServiceCharges] = useState<ServiceCharge[]>([]);

  useEffect(() => {
    if (tenancyToEdit) {
      setServiceCharges(tenancyToEdit.serviceCharges || []);
    } else {
      setServiceCharges([]);
    }
  }, [tenancyToEdit]);

  const addServiceCharge = () => {
    setServiceCharges([...serviceCharges, { name: '', amount: 0 }]);
  };

  const removeServiceCharge = (index: number) => {
    setServiceCharges(serviceCharges.filter((_, i) => i !== index));
  };

  const handleServiceChargeChange = (index: number, field: 'name' | 'amount', value: string) => {
    const newCharges = [...serviceCharges];
    if (field === 'amount') {
      const numericValue = value === '' ? 0 : parseFloat(value);
      (newCharges[index] as any)[field] = numericValue;
    } else {
      (newCharges[index] as any)[field] = value;
    }
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
    if (!user || !revenue) return;
    const formData = new FormData(event.currentTarget);
    const isEditing = !!tenancyToEdit;

    const tenancyStartDateStr = formData.get('tenancyStartDate') as string;
    const tenancyEndDateStr = formData.get('tenancyEndDate') as string;
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

    if (!isEditing && !consent) {
      toast({
        variant: "destructive",
        title: "Consent Required",
        description: "You must confirm the tenant has consented to their data being stored.",
      });
      return;
    }

    if (!isEditing) {
      const existingTenancy = revenue.find(
        (t) =>
          t.tenant?.toLowerCase() === tenant.toLowerCase() &&
          t.propertyId === propertyId
      );
      if (existingTenancy) {
        toast({
          variant: "destructive",
          title: "Duplicate Tenancy",
          description: `A tenancy for "${tenant}" already exists at this property.`,
        });
        return;
      }
    }

    if (!tenancyStartDateStr || !tenancyEndDateStr) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Tenancy start and end dates are required.",
      });
      return;
    }
    
    const [startYear, startMonth, startDay] = tenancyStartDateStr.split('-').map(Number);
    const [endYear, endMonth, endDay] = tenancyEndDateStr.split('-').map(Number);
    const tenancyStartDate = new Date(Date.UTC(startYear, startMonth - 1, startDay));
    const tenancyEndDate = new Date(Date.UTC(endYear, endMonth - 1, endDay));

    if (tenancyEndDate < tenancyStartDate) {
      toast({
        variant: "destructive",
        title: "Invalid Date Range",
        description: "Tenancy end date cannot be before the start date.",
      });
      return;
    }

    const months = eachMonthOfInterval({ start: tenancyStartDate, end: tenancyEndDate });
    const tenancyId = tenancyToEdit?.tenancyId || `t${Date.now()}`;
    const existingTransactions = isEditing ? revenue.filter(t => t.tenancyId === tenancyToEdit.tenancyId) : [];

    const finalServiceCharges = serviceCharges
      .map(sc => ({ name: sc.name, amount: Number(sc.amount) || 0 }))
      .filter(sc => sc.name && sc.amount > 0);

    const transactionsData = months.map((monthStartDate, index) => {
      const dateStr = format(monthStartDate, 'yyyy-MM-dd');
      const existingTx = isEditing ? existingTransactions.find(tx => format(new Date(tx.date), 'yyyy-MM') === format(monthStartDate, 'yyyy-MM')) : undefined;

      const newTxData: Partial<Transaction> = {
        tenancyId,
        date: dateStr,
        rent,
        serviceCharges: finalServiceCharges,
        amountPaid: existingTx?.amountPaid || 0,
        propertyId,
        propertyName: selectedProperty ? formatAddress(selectedProperty) : 'N/A',
        tenant, tenantEmail, tenantPhone,
        type: 'revenue' as const,
        deposit: index === 0 ? deposit : 0,
        tenancyStartDate: tenancyStartDateStr,
        tenancyEndDate: tenancyEndDateStr,
        contractUrl,
        ownerId: tenancyToEdit?.ownerId || user.uid,
      };
      
      if (existingTx?.id) newTxData.id = existingTx.id;
      if (index === 0 && notes) newTxData.notes = notes;

      return newTxData;
    });

    const batch = writeBatch(firestore);
    if (isEditing) {
        const existingTxIdsInTenancy = existingTransactions.map(tx => tx.id);
        const newTxDates = new Set(transactionsData.map(tx => format(new Date(tx.date), 'yyyy-MM')));
        
        existingTxIdsInTenancy.forEach(id => {
            const originalTx = revenue.find(t => t.id === id);
            if (originalTx && !newTxDates.has(format(new Date(originalTx.date), 'yyyy-MM'))) {
                batch.delete(doc(firestore, 'revenue', id));
            }
        });
    }

    transactionsData.forEach(tx => {
      const { id, ...txData } = tx;
      const docRef = id ? doc(firestore, 'revenue', id) : doc(collection(firestore, 'revenue'));
      batch.set(docRef, { ...txData, ownerId: user.uid });
    });
    
    await batch.commit();
    
    addChangeLogEntry({
      type: 'Tenancy',
      action: isEditing ? 'Updated' : 'Created',
      description: `Tenancy for "${transactionsData[0].tenant}" at "${transactionsData[0].propertyName}" was ${isEditing ? 'updated' : 'created'}.`,
      entityId: tenancyId,
    });
    
    router.push('/revenue');
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="propertyId">Property</Label>
            <Select name="propertyId" id="propertyId" defaultValue={tenancyToEdit?.propertyId} required>
              <SelectTrigger><SelectValue placeholder="Select a property" /></SelectTrigger>
              <SelectContent>
                {properties.map(property => (
                  <SelectItem key={property.id} value={property.id}>{formatAddress(property)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenantName">Tenant Name</Label>
            <Input id="tenantName" name="tenantName" defaultValue={tenancyToEdit?.tenant} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenantEmail">Tenant Email</Label>
            <Input id="tenantEmail" name="tenantEmail" type="email" defaultValue={tenancyToEdit?.tenantEmail} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tenantPhone">Tenant Phone</Label>
            <Input id="tenantPhone" name="tenantPhone" type="tel" defaultValue={tenancyToEdit?.tenantPhone} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="tenancyStartDate">Tenancy Start Date</Label>
                <Input id="tenancyStartDate" name="tenancyStartDate" type="date" defaultValue={tenancyToEdit?.tenancyStartDate ? format(new Date(tenancyToEdit.tenancyStartDate), 'yyyy-MM-dd') : ''} required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="tenancyEndDate">Tenancy End Date</Label>
                <Input id="tenancyEndDate" name="tenancyEndDate" type="date" defaultValue={tenancyToEdit?.tenancyEndDate ? format(new Date(tenancyToEdit.tenancyEndDate), 'yyyy-MM-dd') : ''} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="rent">Monthly Rent</Label>
            <Input id="rent" name="rent" type="number" defaultValue={tenancyToEdit?.rent} required />
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
          <div className="space-y-2">
            <Label htmlFor="deposit">Deposit (due with first month's rent)</Label>
            <Input id="deposit" name="deposit" type="number" defaultValue={tenancyToEdit?.deposit} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contractUrl">Contract Link (optional)</Label>
            <Input id="contractUrl" name="contractUrl" type="url" defaultValue={tenancyToEdit?.contractUrl} placeholder="https://docs.google.com/..." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea id="notes" name="notes" defaultValue={tenancyToEdit?.notes} />
          </div>
          {!tenancyToEdit && (
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
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" asChild><Link href="/revenue">Cancel</Link></Button>
            <Button type="submit">Save Tenancy</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
});

export default function AddTenancyPage() {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();

  // Defer query creation until user is available.
  const propertiesQuery = user ? query(collection(firestore, 'properties'), where('ownerId', '==', user.uid)) : null;
  const revenueQuery = user ? query(collection(firestore, 'revenue'), where('ownerId', '==', user.uid)) : null;
  
  const { data: properties, loading: isPropertiesLoading } = useCollection<Property>(propertiesQuery);
  const { data: revenue, loading: isRevenueLoading } = useCollection<Transaction>(revenueQuery);

  // Master loading state: wait for auth AND data fetching.
  if (isUserLoading || isPropertiesLoading || isRevenueLoading) {
    return <div>Loading...</div>;
  }
  
  // This check is now safe because we know loading is complete.
  if (!properties || properties.length === 0) {
      return (
          <>
            <PageHeader title="Add New Tenancy" />
            <div className="text-center py-12">
                <h2 className="text-2xl font-semibold mb-2">No Properties Found</h2>
                <p className="text-muted-foreground mb-4">You need to add a property before you can create a tenancy.</p>
                <Button asChild>
                    <Link href="/properties">Go to Properties</Link>
                </Button>
            </div>
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
      <TenancyForm properties={properties} revenue={revenue || []} />
    </>
  );
}
