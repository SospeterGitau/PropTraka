
'use client';

import { useParams, notFound, useRouter } from 'next/navigation';
import { useDataContext } from '@/context/data-context';
import { PageHeader } from '@/components/page-header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Bed, Bath, Square, MoreHorizontal } from 'lucide-react';
import Image from 'next/image';
import { PropertyIcon } from '@/components/property-icon';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useState } from 'react';
import { PropertyForm } from '@/components/property-form';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import type { Property } from '@/lib/types';


function formatAddress(property: Property) {
  return `${property.addressLine1}, ${property.city}, ${property.state} ${property.postalCode}`;
}

function PropertyDetailPageContent() {
  const { propertyId } = useParams();
  const router = useRouter();
  const { properties, revenue, formatCurrency, updateProperty, deleteProperty, addChangeLogEntry, isDataLoading } = useDataContext();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const property = properties?.find(p => p.id === propertyId);

  const handleEdit = () => {
    setIsFormOpen(true);
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDelete = async () => {
    if (property) {
      await deleteProperty(property.id);
      addChangeLogEntry({
        type: 'Property',
        action: 'Deleted',
        description: `Property "${formatAddress(property)}" was deleted.`,
        entityId: property.id,
      });
      setIsDeleteDialogOpen(false);
      router.push('/properties');
    }
  };

  const handleFormSubmit = async (data: Property) => {
    await updateProperty(data);
    addChangeLogEntry({
      type: 'Property',
      action: 'Updated',
      description: `Property "${formatAddress(data)}" was updated.`,
      entityId: data.id,
    });
  };

  if (isDataLoading) {
    return (
        <div>
            <PageHeader title="Property Details">
                <Button variant="outline" disabled><ArrowLeft className="mr-2 h-4 w-4"/> Back</Button>
            </PageHeader>
            <Skeleton className="h-[400px] w-full" />
        </div>
    );
  }

  if (!property) {
    notFound();
  }
  
  const today = new Date();
  const isOccupied = revenue?.some(t => 
      t.propertyId === property.id && 
      t.tenancyStartDate && 
      t.tenancyEndDate && 
      new Date(t.tenancyStartDate) <= today && 
      new Date(t.tenancyEndDate) >= today
  );
  const status = isOccupied ? 'Occupied' : 'Vacant';
  const isPlaceholder = property.imageUrl?.includes('picsum.photos');

  return (
    <div>
      <PageHeader title="Property Details">
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button aria-haspopup="true" size="icon" variant="outline">
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onSelect={handleEdit}>Edit</DropdownMenuItem>
                <DropdownMenuItem onSelect={handleDelete} className="text-destructive">Delete</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={() => router.back()}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
            </Button>
          </div>
      </PageHeader>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-start">
                        <div>
                            <CardTitle className="text-2xl">{formatAddress(property)}</CardTitle>
                            <CardDescription>{property.buildingType}</CardDescription>
                        </div>
                        <Badge variant={status === 'Occupied' ? 'secondary' : 'default'}>{status}</Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {property.imageUrl && !isPlaceholder ? (
                        <Image
                            alt="Property image"
                            className="aspect-video w-full rounded-md object-cover mb-4"
                            height="400"
                            src={property.imageUrl}
                            width="600"
                            data-ai-hint={property.imageHint}
                        />
                    ) : (
                        <div className="flex aspect-video w-full items-center justify-center rounded-md bg-muted mb-4">
                            <PropertyIcon type={property.buildingType} className="h-24 w-24 text-muted-foreground" />
                        </div>
                    )}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                        <div className="p-4 bg-muted rounded-lg">
                            <div className="text-sm text-muted-foreground">Bedrooms</div>
                            <div className="text-2xl font-bold flex items-center justify-center gap-2"><Bed /> {property.bedrooms}</div>
                        </div>
                        <div className="p-4 bg-muted rounded-lg">
                            <div className="text-sm text-muted-foreground">Bathrooms</div>
                            <div className="text-2xl font-bold flex items-center justify-center gap-2"><Bath /> {property.bathrooms}</div>
                        </div>
                         {property.size && (
                            <div className="p-4 bg-muted rounded-lg">
                                <div className="text-sm text-muted-foreground">Size</div>
                                <div className="text-2xl font-bold flex items-center justify-center gap-2"><Square />{property.size} {property.sizeUnit}</div>
                            </div>
                         )}
                         <div className="p-4 bg-muted rounded-lg">
                            <div className="text-sm text-muted-foreground">Type</div>
                            <div className="text-xl font-bold flex items-center justify-center h-full">
                                <Badge variant="outline">{property.propertyType}</Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Financials</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Current Value</span>
                        <span className="font-medium">{formatCurrency(property.currentValue)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Purchase Price</span>
                        <span className="font-medium">{formatCurrency(property.purchasePrice)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Purchase Fees</span>
                        <span className="font-medium">{formatCurrency(property.purchaseTaxes || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Mortgage</span>
                        <span className="font-medium">{formatCurrency(property.mortgage)}</span>
                    </div>
                     <hr className="my-2"/>
                    <div className="flex justify-between font-bold">
                        <span >Equity</span>
                        <span>{formatCurrency(property.currentValue - property.mortgage)}</span>
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Rental</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Asking Rent</span>
                        <span className="font-medium">{formatCurrency(property.rentalValue)}/month</span>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
      
       <PropertyForm 
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        property={property}
      />

      <DeleteConfirmationDialog 
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        itemName={`property at ${property ? formatAddress(property) : ''}`}
      />
    </div>
  );
}

export default function PropertyDetailPage() {
    return (
        <PropertyDetailPageContent />
    )
}
