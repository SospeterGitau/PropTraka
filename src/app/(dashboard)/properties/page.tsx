'use client';

import { useState } from 'react';
import Image from 'next/image';
import { MoreHorizontal } from 'lucide-react';
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


export default function PropertiesPage() {
  const { properties, setProperties } = useDataContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 }).format(amount);

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
                <TableHead>Address</TableHead>
                <TableHead>Current Value</TableHead>
                <TableHead className="hidden md:table-cell">Rental Value</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {properties.map((property) => (
                <TableRow key={property.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt="Property image"
                      className="aspect-square rounded-md object-cover"
                      height="64"
                      src={property.imageUrl}
                      width="64"
                      data-ai-hint={property.imageHint}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{property.address}</TableCell>
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
              ))}
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
        itemName={`property at ${selectedProperty?.address}`}
      />
    </>
  );
}
