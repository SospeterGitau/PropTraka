
'use client';

import { useState, useMemo, memo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { MoreHorizontal, Bed, Bath, Square, Building } from 'lucide-react';
import type { Property, Transaction } from '@/lib/types';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { PropertyForm } from '@/components/property-form';
import { Badge } from '@/components/ui/badge';
import { PropertyIcon } from '@/components/property-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore } from '@/firebase';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useDataContext } from '@/context/data-context';

function formatAddress(property: Property) {
  return `${property.addressLine1}, ${property.city}, ${property.state} ${property.postalCode}`;
}

const PropertiesClient = memo(function PropertiesClient() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { settings } = useDataContext();
  const { locale, currency } = settings;

  // Data Fetching
  const propertiesQuery = useMemo(() => user ? query(collection(firestore, 'properties'), where('ownerId', '==', user.uid)) : null, [firestore, user]);
  const revenueQuery = useMemo(() => user ? query(collection(firestore, 'revenue'), where('ownerId', '==', user.uid)) : null, [firestore, user]);
  const [propertiesSnapshot, isPropertiesLoading] = useCollection(propertiesQuery);
  const [revenueSnapshot, isRevenueLoading] = useCollection(revenueQuery);
  const isDataLoading = isPropertiesLoading || isRevenueLoading;

  // State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  
  const properties = useMemo(() => propertiesSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Property)), [propertiesSnapshot]);
  const revenue = useMemo(() => revenueSnapshot?.docs.map(doc => doc.data() as Transaction), [revenueSnapshot]);

  // Formatters
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  };
  
  // Actions
  const addChangeLogEntry = async (log: Omit<any, 'id' | 'date' | 'ownerId'>) => {
    if (!user) return;
    try {
        await addDoc(collection(firestore, 'changelog'), {
          ...log,
          ownerId: user.uid,
          date: serverTimestamp(),
        });
    } catch(error) {
        console.error("Failed to add changelog entry:", error);
    }
  };

  const handleAdd = () => {
    setSelectedProperty(null);
    setIsFormOpen(true);
  };

  const handleEdit = (property: Property) => {
    setSelectedProperty(property);
    setIsFormOpen(true);
  };

  const handleDelete = (property: Property) => {
    setSelectedProperty(property);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedProperty) {
      await deleteDoc(doc(firestore, 'properties', selectedProperty.id));
      addChangeLogEntry({
        type: 'Property',
        action: 'Deleted',
        description: `Property "${formatAddress(selectedProperty)}" was deleted.`,
        entityId: selectedProperty.id,
      });
      setIsDeleteDialogOpen(false);
      setSelectedProperty(null);
    }
  };

  const handleFormSubmit = async (data: Property) => {
    if (!user) return;
    const isEditing = !!data.id && properties?.some(p => p.id === data.id);

    if (isEditing) {
      const { id, ...propertyData } = data;
      await updateDoc(doc(firestore, 'properties', id), propertyData);
      addChangeLogEntry({
        type: 'Property',
        action: 'Updated',
        description: `Property "${formatAddress(data)}" was updated.`,
        entityId: data.id,
      });
    } else {
      const { id, ...propertyData } = data; // Omit id for creation
      const docRef = await addDoc(collection(firestore, 'properties'), { ...propertyData, ownerId: user.uid });
      addChangeLogEntry({
        type: 'Property',
        action: 'Created',
        description: `Property "${formatAddress(data)}" was created.`,
        entityId: docRef.id, 
      });
    }
    setIsFormOpen(false);
  };
  
  const occupiedPropertyIds = useMemo(() => {
    if (!revenue) return new Set<string>();
    const today = new Date();
    const occupiedIds = new Set<string>();
    revenue.forEach(t => {
      if (
        t.propertyId &&
        t.tenancyStartDate &&
        t.tenancyEndDate &&
        new Date(t.tenancyStartDate) <= today &&
        new Date(t.tenancyEndDate) >= today
      ) {
        occupiedIds.add(t.propertyId);
      }
    });
    return occupiedIds;
  }, [revenue]);
  
  if (isDataLoading) {
    return (
       <>
        <PageHeader title="Properties">
          <Button disabled>Add Property</Button>
        </PageHeader>
        <Card>
          <CardHeader>
            <CardTitle>Property Portfolio</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-16 w-16 rounded-md" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-8" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHeader title="Properties">
        <Button onClick={handleAdd}>Add Property</Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Property Portfolio</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {properties && properties.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="hidden w-[100px] sm:table-cell">
                    <span className="sr-only">Image</span>
                  </TableHead>
                  <TableHead>Property Details</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead className="hidden md:table-cell text-right">Rental Value</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {properties.map((property) => {
                  const isPlaceholder = property.imageUrl?.includes('picsum.photos');
                  const status = occupiedPropertyIds.has(property.id) ? 'Occupied' : 'Vacant';
                  return (
                    <TableRow key={property.id}>
                      <TableCell className="hidden sm:table-cell">
                        {property.imageUrl && !isPlaceholder ? (
                           <Image
                            alt="Property image"
                            className="aspect-square rounded-md object-cover"
                            height="64"
                            src={property.imageUrl}
                            width="64"
                            data-ai-hint={property.imageHint}
                          />
                        ) : (
                          <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted">
                            <PropertyIcon type={property.buildingType} className="h-8 w-8 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Link href={`/properties/${property.id}`} className="font-medium hover:underline">{formatAddress(property)}</Link>
                        <div className="text-sm text-muted-foreground">{property.buildingType}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                           <div className="flex items-center gap-1">
                            <Bed className="h-4 w-4" />
                            <span>{property.bedrooms}</span>
                           </div>
                           <div className="flex items-center gap-1">
                            <Bath className="h-4 w-4" />
                            <span>{property.bathrooms}</span>
                           </div>
                           {property.size && (
                            <div className="flex items-center gap-1">
                              <Square className="h-4 w-4" />
                              <span>{property.size} {property.sizeUnit}</span>
                            </div>
                           )}
                        </div>
                      </TableCell>
                      <TableCell>
                         <Badge variant="secondary">{property.propertyType}</Badge>
                      </TableCell>
                      <TableCell>
                         <Badge variant={status === 'Occupied' ? 'secondary' : 'outline'}>
                           {status}
                         </Badge>
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(property.currentValue)}</TableCell>
                      <TableCell className="hidden md:table-cell text-right">{formatCurrency(property.rentalValue)}/month</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Toggle menu</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onSelect={() => handleEdit(property)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => handleDelete(property)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })
                }
              </TableBody>
            </Table>
            ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Building className="w-16 h-16 text-muted-foreground mb-4" />
                    <h3 className="text-xl font-semibold">No Properties Added Yet</h3>
                    <p className="text-muted-foreground mb-4">Click the button below to add your first property.</p>
                    <Button onClick={handleAdd}>Add Property</Button>
                </div>
            )}
        </CardContent>
      </Card>
      
      <PropertyForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        property={selectedProperty}
      />

      <DeleteConfirmationDialog 
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        itemName={`property at ${selectedProperty ? formatAddress(selectedProperty) : ''}`}
      />
    </>
  );
});

export default PropertiesClient;
