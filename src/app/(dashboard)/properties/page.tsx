
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MoreHorizontal, Bed, Bath } from 'lucide-react';
import { useDataContext } from '@/context/data-context';
import type { Property } from '@/lib/types';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { PropertyForm } from '@/components/property-form';
import { Badge } from '@/components/ui/badge';
import { PropertyIcon } from '@/components/property-icon';

function formatAddress(property: Property) {
  return `${property.addressLine1}, ${property.city}, ${property.state} ${property.postalCode}`;
}

export default function PropertiesPage() {
  const { properties, setProperties, formatCurrency } = useDataContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

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

  const confirmDelete = () => {
    if (selectedProperty) {
      setProperties(properties.filter((p) => p.id !== selectedProperty.id));
      setIsDeleteDialogOpen(false);
      setSelectedProperty(null);
    }
  };

  const handleFormSubmit = (data: Property) => {
    if (data.id.startsWith('p') && !properties.find(p => p.id === data.id)) {
      // Add
      setProperties([data, ...properties]);
    } else {
      // Update
      setProperties(properties.map((p) => (p.id === data.id ? data : p)));
    }
  };


  return (
    <>
      <PageHeader title="Properties">
        <Button onClick={handleAdd}>Add Property</Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Property Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">
                  <span className="sr-only">Image</span>
                </TableHead>
                <TableHead>Property Details</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Value</TableHead>
                <TableHead className="hidden md:table-cell">Rental Value</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => {
                const isPlaceholder = property.imageUrl?.includes('picsum.photos');
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
                      <div className="font-medium">{formatAddress(property)}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                         <div className="flex items-center gap-1">
                          <Bed className="h-4 w-4" />
                          <span>{property.bedrooms}</span>
                         </div>
                         <div className="flex items-center gap-1">
                          <Bath className="h-4 w-4" />
                          <span>{property.bathrooms}</span>
                         </div>
                      </div>
                    </TableCell>
                    <TableCell>
                       <Badge variant="outline">{property.propertyType}</Badge>
                       <div className="text-sm text-muted-foreground mt-1">{property.buildingType}</div>
                    </TableCell>
                    <TableCell>{formatCurrency(property.currentValue)}</TableCell>
                    <TableCell className="hidden md:table-cell">{formatCurrency(property.rentalValue)}/month</TableCell>
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
              })}
            </TableBody>
          </Table>
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
}
