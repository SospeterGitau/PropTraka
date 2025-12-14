
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
import {
  Property,
  PropertyType,
  domesticBuildingTypes,
  commercialBuildingTypes,
  Address,
} from '@/lib/types';
import { useDataContext } from '@/context/data-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
      // Fallback for invalid currency codes
      if (currencyCode === 'KES') return 'KSh';
      return '$';
    }
  };

  const currencySymbol = getCurrencySymbol(settings?.currency || 'USD');

  const [name, setName] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType | ''>('');
  const [buildingType, setBuildingType] = useState('');
  const [address, setAddress] = useState<Address>({ line1: '', line2: '', city: '', state: '', zipCode: '', country: '' });
  const [bedrooms, setBedrooms] = useState<number>(0);
  const [bathrooms, setBathrooms] = useState<number>(0);
  const [size, setSize] = useState<number>(0);
  const [sizeUnit, setSizeUnit] = useState<'sqft' | 'sqm'>('sqft');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [purchaseDate, setPurchaseDate] = useState<string>('');
  const [marketValue, setMarketValue] = useState<number>(0);
  const [mortgageBalance, setMortgageBalance] = useState<number>(0);
  const [targetRent, setTargetRent] = useState<number>(0);

  useEffect(() => {
    if (initialProperty) {
      setName(initialProperty.name);
      setPropertyType(initialProperty.propertyType);
      setBuildingType(initialProperty.buildingType);
      setAddress(initialProperty.address);
      setBedrooms(initialProperty.bedrooms);
      setBathrooms(initialProperty.bathrooms);
      setSize(initialProperty.size || 0);
      setSizeUnit(initialProperty.sizeUnit || 'sqft');
      setPurchasePrice(initialProperty.purchasePrice || 0);
      setPurchaseDate(initialProperty.purchaseDate || '');
      setMarketValue(initialProperty.marketValue || 0);
      setMortgageBalance(initialProperty.mortgageBalance || 0);
      setTargetRent(initialProperty.targetRent || 0);
    } else {
      resetForm();
    }
  }, [initialProperty, isOpen]);

  const resetForm = () => {
    setName(''); setPropertyType(''); setBuildingType('');
    setAddress({ line1: '', line2: '', city: '', state: '', zipCode: '', country: '' });
    setBedrooms(0); setBathrooms(0); setSize(0); setSizeUnit('sqft');
    setPurchasePrice(0); setPurchaseDate(''); setMarketValue(0); setMortgageBalance(0); setTargetRent(0);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handlePropertyTypeChange = (value: string) => {
    const newPropertyType = value as PropertyType;
    setPropertyType(newPropertyType);
    setBuildingType('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propertyType) return;
    const propertyData: Omit<Property, 'id'> = {
      name, address, propertyType, buildingType, bedrooms, bathrooms, size, sizeUnit,
      purchasePrice, purchaseDate, marketValue, mortgageBalance, targetRent,
      status: initialProperty?.status || 'vacant',
    };
    try {
      if (onSubmit) {
         if (initialProperty?.id) onSubmit({ ...propertyData, id: initialProperty.id });
         else onSubmit(propertyData);
      } else {
        if (initialProperty?.id) await updateProperty(initialProperty.id, { ...propertyData, id: initialProperty.id });
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
                  <Label htmlFor="propertyType">Property Type *</Label>
                  <Select value={propertyType} onValueChange={handlePropertyTypeChange} required>
                    <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PropertyType.Domestic}>Residential</SelectItem>
                      <SelectItem value={PropertyType.Commercial}>Commercial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {propertyType && (
                <div className="space-y-2">
                  <Label htmlFor="buildingType">Building Type *</Label>
                  <Select value={buildingType} onValueChange={setBuildingType} required>
                    <SelectTrigger><SelectValue placeholder="Select building type" /></SelectTrigger>
                    <SelectContent>
                      {propertyType === PropertyType.Domestic && (
                        <SelectGroup>
                          <SelectLabel>Residential</SelectLabel>
                          {domesticBuildingTypes.map((type, i) => (<SelectItem key={`${type}-${i}`} value={type}>{type}</SelectItem>))}
                        </SelectGroup>
                      )}
                      {propertyType === PropertyType.Commercial && (
                        <SelectGroup>
                          <SelectLabel>Commercial</SelectLabel>
                          {commercialBuildingTypes.map((type, i) => (<SelectItem key={`${type}-${i}`} value={type}>{type}</SelectItem>))}
                        </SelectGroup>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              )}
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
                  <Label htmlFor="size">Size</Label>
                  <div className="flex gap-2">
                    <Input id="size" type="number" min="0" value={size} onChange={(e) => setSize(Number(e.target.value))} className="flex-1" />
                    <Select value={sizeUnit} onValueChange={(val: 'sqft' | 'sqm') => setSizeUnit(val)}>
                      <SelectTrigger className="w-[80px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="sqft">sq ft</SelectItem>
                        <SelectItem value="sqm">m²</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="address" className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Street Address *</Label>
                  <Input name="line1" placeholder="Line 1" value={address.line1} onChange={handleAddressChange} required />
                  <Input name="line2" placeholder="Line 2 (Optional)" value={address.line2 || ''} onChange={handleAddressChange} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>City *</Label>
                    <Input name="city" value={address.city} onChange={handleAddressChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label>State/Province *</Label>
                    <Input name="state" value={address.state} onChange={handleAddressChange} required />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Zip/Postal Code *</Label>
                    <Input name="zipCode" value={address.zipCode} onChange={handleAddressChange} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Country *</Label>
                    <Input name="country" value={address.country} onChange={handleAddressChange} required />
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
                  <Label htmlFor="marketValue">Current Market Value</Label>
                  <Input id="marketValue" type="number" min="0" prefixText={currencySymbol} value={marketValue} onChange={(e) => setMarketValue(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mortgageBalance">Mortgage Balance</Label>
                  <Input id="mortgageBalance" type="number" min="0" prefixText={currencySymbol} value={mortgageBalance} onChange={(e) => setMortgageBalance(Number(e.target.value))} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="targetRent">Target Monthly Rent</Label>
                  <Input id="targetRent" type="number" min="0" prefixText={currencySymbol} value={targetRent} onChange={(e) => setTargetRent(Number(e.target.value))} />
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
