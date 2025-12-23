
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PropertyForm } from '@/components/property-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PlusCircle, Loader2, Home, BarChart2, TrendingUp, AlertCircle, Percent, Search, Edit2, Trash2 } from 'lucide-react';
import { PropertyIcon } from '@/components/property-icon';
import { Skeleton } from '@/components/ui/skeleton';

import { formatCurrency } from '@/lib/utils';
import type { Property } from '@/lib/types';
import { KpiCard } from '@/components/dashboard/kpi-card';
import { createProperty, updateProperty, deleteProperty } from '@/app/actions/properties';


export function PropertiesClient({ initialProperties = [] }: { initialProperties?: Property[] }) {
    const [properties, setProperties] = useState<Property[]>(initialProperties);
    const loading = false; // Server Side Pre-fetched
    const error = null;
    const router = useRouter();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
    const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProperties = useMemo(() => {
        if (!searchTerm) return properties;
        const lowerTerm = searchTerm.toLowerCase();
        return properties.filter(property =>
            property.name.toLowerCase().includes(lowerTerm) ||
            property.address.city?.toLowerCase().includes(lowerTerm) ||
            property.type.toLowerCase().includes(lowerTerm)
        );
    }, [properties, searchTerm]);




    const handleAddProperty = () => {
        setEditingProperty(null);
        setIsFormOpen(true);
    };

    const handleEditProperty = (property: Property) => {
        setEditingProperty(property);
        setIsFormOpen(true);
    };

    const handleSubmitForm = async (formData: Property | Omit<Property, 'id' | 'ownerId'>) => {
        setIsSubmitting(true);
        try {
            if (editingProperty) {
                // Update existing property
                await updateProperty(editingProperty.id!, formData);
            } else {
                // Add new property
                await createProperty(formData as Property);
            }
            router.refresh();
            setIsFormOpen(false);
        } catch (e) {
            console.error("Error adding/updating property: ", e);
            // Handle error, maybe show a toast
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProperty = (property: Property) => {
        setPropertyToDelete(property);
        setDeleteConfirmationOpen(true);
    };

    const confirmDelete = async () => {
        if (!propertyToDelete) return;
        setIsSubmitting(true);
        try {
            // Optimistic Delete from UI
            setProperties(prev => prev.filter(p => p.id !== propertyToDelete.id));

            // Server Action for Cascading Delete
            await deleteProperty(propertyToDelete.id!);

            router.refresh();
            // batch commit removed - handled in server action

            setPropertyToDelete(null);
            setDeleteConfirmationOpen(false);
        } catch (e) {
            console.error("Error deleting property and related data: ", e);
            // Handle error
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalPropertyValue = useMemo(() => {
        return properties.reduce((sum, p) => sum + (p.currentValue || 0), 0);
    }, [properties]);

    const totalProperties = properties.length;
    const averageOccupancyRate = useMemo(() => {
        if (properties.length === 0) return 0;
        const occupiedCount = properties.filter(p => p.status === 'occupied').length;
        return (occupiedCount / properties.length) * 100;
    }, [properties]);


    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                        <CardContent><Skeleton className="h-10 w-1/2" /></CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (error) {
        const msg = String(error);
        return <div className="text-destructive">Error loading properties: {msg}</div>;
    }

    return (
        <div className="space-y-6">
            <PageHeader title="My Properties">
                <Button onClick={handleAddProperty}>
                    <PlusCircle className="mr-2 h-5 w-5" /> Add New Property
                </Button>
            </PageHeader>

            {properties.length === 0 && !loading ? (
                <Card className="text-center py-8 border-0 shadow-md">
                    <CardHeader>
                        <CardTitle className="text-2xl font-semibold">No Properties Added Yet</CardTitle>
                        <CardDescription>It looks like you haven't added any properties to your portfolio.</CardDescription>
                    </CardHeader>
                    <CardContent className="mt-4">
                        <Button onClick={handleAddProperty}>
                            <PlusCircle className="mr-2 h-5 w-5" /> Add Your First Property
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-6">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <KpiCard
                            icon={Home}
                            title="Total Properties"
                            value={totalProperties}
                            description="Currently managed"
                            formatAs="integer"
                        />
                        <KpiCard
                            icon={TrendingUp}
                            title="Total Portfolio Value"
                            value={totalPropertyValue}
                            description="Estimated current market value"
                            formatAs="currency"
                        />
                        <KpiCard
                            icon={Percent}
                            title="Average Occupancy"
                            value={averageOccupancyRate}
                            description="Across all properties"
                            formatAs="percent"
                        />
                    </div>

                    <Card className="border-0 shadow-md">
                        <CardHeader>
                            <CardTitle>Properties List</CardTitle>
                            <CardDescription>Manage your portfolio properties.</CardDescription>

                            <div className="relative mt-4">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="Search by name, address, or type..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="relative w-full overflow-auto">
                                <Table className="hidden md:table">
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Property</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Value</TableHead>
                                            <TableHead>Target Rent</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredProperties.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                                    {searchTerm ? 'No properties found matching your search.' : 'No properties found.'}
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredProperties.map((property) => (
                                                <TableRow key={property.id} className="h-14"> {/* Min height 56px for rows */}
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-semibold">{property.name}</span>
                                                            <span className="text-xs text-muted-foreground">{property.address.city}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-2">
                                                            <PropertyIcon type={property.type} className="h-4 w-4 text-muted-foreground" />
                                                            <span>{property.type}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="secondary" className={`capitalize ${property.status === 'occupied' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : ''}`}>
                                                            {property.status}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatCurrency(property.currentValue || 0, 'en-KE', 'KES')}
                                                    </TableCell>
                                                    <TableCell>
                                                        {formatCurrency(property.targetRent || 0, 'en-KE', 'KES')}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex justify-end gap-2">
                                                            <Button variant="ghost" size="sm" onClick={() => handleEditProperty(property)} className="h-9 w-9 p-0 rounded-full hover:bg-muted" aria-label={`Edit ${property.name}`}><Edit2 className="h-4 w-4" /></Button>
                                                            <Button variant="ghost" size="sm" onClick={() => handleDeleteProperty(property)} className="h-9 w-9 p-0 rounded-full text-destructive hover:bg-destructive/10" aria-label={`Delete ${property.name}`}><Trash2 className="h-4 w-4" /></Button>
                                                            <Button variant="outline" size="sm" asChild className="h-9">
                                                                <Link href={`/properties/${property.id}`}>View</Link>
                                                            </Button>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>

                                {/* Mobile Card View */}
                                <div className="md:hidden space-y-4">
                                    {filteredProperties.length === 0 ? (
                                        <div className="text-center text-muted-foreground py-8">
                                            {searchTerm ? 'No properties found matching your search.' : 'No properties found.'}
                                        </div>
                                    ) : (
                                        filteredProperties.map((property) => (
                                            <div key={property.id} className="bg-card rounded-lg p-4 shadow-md flex flex-col gap-3">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex gap-3">
                                                        <div className="p-2 bg-muted rounded-md h-fit">
                                                            <PropertyIcon type={property.type} className="h-5 w-5 text-foreground" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-base">{property.name}</h3>
                                                            <p className="text-sm text-muted-foreground">{property.address.city}, {property.address.state}</p>
                                                        </div>
                                                    </div>
                                                    <Badge variant="secondary" className={`capitalize ${property.status === 'occupied' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : ''}`}>
                                                        {property.status}
                                                    </Badge>
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-sm">
                                                    <div>
                                                        <p className="text-muted-foreground text-xs">Target Rent</p>
                                                        <p className="font-medium">{formatCurrency(property.targetRent || 0, 'en-KE', 'KES')}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-muted-foreground text-xs">Value</p>
                                                        <p className="font-medium">{formatCurrency(property.currentValue || 0, 'en-KE', 'KES')}</p>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 mt-2 pt-3 border-t">
                                                    <Button variant="outline" className="flex-1 h-11" onClick={() => handleEditProperty(property)}>
                                                        Edit
                                                    </Button>
                                                    <Button variant="default" className="flex-1 h-11" asChild>
                                                        <Link href={`/properties/${property.id}`}>View Details</Link>
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <AlertDialog open={deleteConfirmationOpen} onOpenChange={setDeleteConfirmationOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the property
                            <span className="font-bold">{propertyToDelete?.name}</span> and all its associated data
                            (tenancies, revenue, expenses, maintenance requests, and documents).
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} disabled={isSubmitting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Delete Property
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {isFormOpen && (
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
                        <DialogHeader>
                            <DialogTitle>{editingProperty ? 'Edit Property' : 'Add New Property'}</DialogTitle>
                            <DialogDescription>
                                {editingProperty ? 'Update the details of your property.' : 'Fill in the details to add a new property to your portfolio.'}
                            </DialogDescription>
                        </DialogHeader>
                        <PropertyForm
                            initialData={editingProperty}
                            onSubmit={handleSubmitForm}
                            onCancel={() => setIsFormOpen(false)}
                            isSubmitting={isSubmitting}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
