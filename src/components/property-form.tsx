
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Property, Address } from '@/lib/db-types'; // Updated import
import { useDataContext } from '@/context/data-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Timestamp } from 'firebase/firestore'; // Import Timestamp

interface PropertyFormProps {
  property?: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit?: (data: Property | Omit<Property, "ownerId" | "id">) => void;
}

export function PropertyForm({
  property: initialProperty,
  isOpen,
  onClose,
  onSubmit,
}: PropertyFormProps) {
  const { addProperty, updateProperty, settings } = useDataContext();
  
  const getCurrencySymbol = (currencyCode: string) => {
    try {
      const parts = new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: currencyCode,
        currencyDisplay: 'narrowSymbol'
      }).formatToParts(1);
      return parts.find((part) => part.type === 'currency')?.value || parts.find((part) => part.type === 'literal')?.value || '$';
    } catch (e) {
      if (currencyCode === 'KES') return 'KSh';
      return '$';
    }
  };

  const currencySymbol = getCurrencySymbol(settings?.currency || 'USD');

  const [name, setName] = useState('');
  const [type, setType] = useState<'Residential' | 'Commercial' | 'Mixed-Use' | ''>(''); // New 'type' state
  const [address, setAddress] = useState<Address>({
    street: '', city: '', state: '', zipCode: '', country: ''
  });
  const [bedrooms, setBedrooms] = useState<number>(0);
  const [bathrooms, setBathrooms] = useState<number>(0);
  const [squareFootage, setSquareFootage] = useState<number>(0); // New 'squareFootage' state
  const [yearBuilt, setYearBuilt] = useState<number>(0); // New 'yearBuilt' state
  const [amenities, setAmenities] = useState<string>(''); // Stored as comma-separated string for input
  const [description, setDescription] = useState<string>(''); // New 'description' state
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [purchaseDate, setPurchaseDate] = useState<string>(''); // Stored as string for input
  const [currentValue, setCurrentValue] = useState<number>(0);
  const [mortgageBalance, setMortgageBalance] = useState<number>(0);
  const [targetRent, setTargetRent] = useState<number>(0);

  useEffect(() => {
    if (initialProperty) {
      setName(initialProperty.name);
      setType(initialProperty.type);
      setAddress(initialProperty.address);
      setBedrooms(initialProperty.bedrooms || 0);
      setBathrooms(initialProperty.bathrooms || 0);
      setSquareFootage(initialProperty.squareFootage || 0);
      setYearBuilt(initialProperty.yearBuilt || 0);
      setAmenities(initialProperty.amenities?.join(', ') || '');
      setDescription(initialProperty.description || '');
      setPurchasePrice(initialProperty.purchasePrice || 0);
      setPurchaseDate(initialProperty.purchaseDate ? initialProperty.purchaseDate.toDate().toISOString().split('T')[0] : '');
      setCurrentValue(initialProperty.currentValue || 0);
      setMortgageBalance(initialProperty.mortgageBalance || 0);
      setTargetRent(initialProperty.targetRent || 0);
    } else {
      resetForm();
    }
  }, [initialProperty, isOpen]);

  const resetForm = () => {
    setName(''); setType('');
    setAddress({ street: '', city: '', state: '', zipCode: '', country: '' });
    setBedrooms(0); setBathrooms(0); setSquareFootage(0); setYearBuilt(0); setAmenities(''); setDescription('');
    setPurchasePrice(0); setPurchaseDate(''); setCurrentValue(0); setMortgageBalance(0); setTargetRent(0);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!type || !name || !address.street || !address.city || !address.state || !address.zipCode || !address.country) {
        alert('Please fill in all required fields.');
        return;
    }

    const propertyData: Omit<Property, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'> = {
      name,
      type: type as 'Residential' | 'Commercial' | 'Mixed-Use',
      address,
      bedrooms: bedrooms || undefined,
      bathrooms: bathrooms || undefined,
      squareFootage: squareFootage || undefined,
      yearBuilt: yearBuilt || undefined,
      amenities: amenities.split(',').map(s => s.trim()).filter(s => s) || undefined,
      description: description || undefined,
      purchasePrice: purchasePrice || undefined,
      purchaseDate: purchaseDate ? Timestamp.fromDate(new Date(purchaseDate)) : (undefined as any), // Cast to any to satisfy type if undefined
      currentValue: currentValue || undefined,
      mortgageBalance: mortgageBalance || undefined,
      targetRent,
    };

    try {
      if (onSubmit) {
         if (initialProperty?.id) onSubmit({ ...propertyData, id: initialProperty.id, ownerId: initialProperty.ownerId, createdAt: initialProperty.createdAt, updatedAt: Timestamp.now() });
         else onSubmit(propertyData);
      } else {
        if (initialProperty?.id) await updateProperty(initialProperty.id, { ...propertyData, id: initialProperty.id, ownerId: initialProperty.ownerId, createdAt: initialProperty.createdAt, updatedAt: Timestamp.now() });
        else await addProperty(propertyData);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save property:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialProperty ? 'Edit Property' : 'Add New Property'}
          </DialogTitle>
          <DialogDescription>
            {initialProperty 
              ? 'Update the details of your property below.' 
              : 'Fill in the details to add a new property to your portfolio.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Property Details</TabsTrigger>
              <TabsTrigger value="address">Address</TabsTrigger>
              <TabsTrigger value="financials">Financials</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Property Name *</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Sunset Apartments" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Property Type *</Label>
                  <Select value={type} onValueChange={(value) => setType(value as 'Residential' | 'Commercial' | 'Mixed-Use')} required>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Residential">Residential</SelectItem>
                      <SelectItem value="Commercial">Commercial</SelectItem>
                      <SelectItem value="Mixed-Use">Mixed-Use</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bedrooms">Bedrooms</Label>
                  <Input id="bedrooms" type="number" min="0" value={bedrooms} onChange={(e) => setBedrooms(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bathrooms">Bathrooms</Label>
                  <Input id="bathrooms" type="number" min="0" step="0.5" value={bathrooms} onChange={(e) => setBathrooms(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="squareFootage">Square Footage</Label>
                  <Input id="squareFootage" type="number" min="0" value={squareFootage} onChange={(e) => setSquareFootage(Number(e.target.value))} placeholder="e.g., 1200" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearBuilt">Year Built</Label>
                <Input id="yearBuilt" type="number" min="1000" max={new Date().getFullYear()} value={yearBuilt} onChange={(e) => setYearBuilt(Number(e.target.value))} placeholder="e.g., 2005" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="amenities">Amenities (comma-separated)</Label>
                <Input id="amenities" value={amenities} onChange={(e) => setAmenities(e.target.value)} placeholder="e.g., Pool, Gym, Parking" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description of the property" />
              </div>
            </TabsContent>
            <TabsContent value="address" className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address *</Label>
                  <Input id="street" name="street" placeholder="e.g., 123 Main St" value={address.street} onChange={handleAddressChange} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input id="city" name="city" value={address.city} onChange={handleAddressChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State/Province *</Label>
                    <Input id="state" name="state" value={address.state} onChange={handleAddressChange} required />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="zipCode">Zip/Postal Code *</Label>
                    <Input id="zipCode" name="zipCode" value={address.zipCode} onChange={handleAddressChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country *</Label>
                    <Input id="country" name="country" value={address.country} onChange={handleAddressChange} required />
                  </div>
                </div>
            </TabsContent>
            <TabsContent value="financials" className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Purchase Price</Label>
                  <Input id="purchasePrice" type="number" min="0" prefixText={currencySymbol} value={purchasePrice} onChange={(e) => setPurchasePrice(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="purchaseDate">Purchase Date</Label>
                  <Input id="purchaseDate" type="date" value={purchaseDate} onChange={(e) => setPurchaseDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currentValue">Current Market Value</Label>
                  <Input id="currentValue" type="number" min="0" prefixText={currencySymbol} value={currentValue} onChange={(e) => setCurrentValue(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mortgageBalance">Mortgage Balance</Label>
                  <Input id="mortgageBalance" type="number" min="0" prefixText={currencySymbol} value={mortgageBalance} onChange={(e) => setMortgageBalance(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetRent">Target Monthly Rent *</Label>
                  <Input id="targetRent" type="number" min="0" prefixText={currencySymbol} value={targetRent} onChange={(e) => setTargetRent(Number(e.target.value))} required />
                </div>
              </div>
            </TabsContent>
          </Tabs>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">
              {initialProperty ? 'Save Changes' : 'Add Property'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
