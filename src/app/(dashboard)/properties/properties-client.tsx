
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PropertyForm } from '@/components/property-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { PlusCircle, Loader2, Home, BarChart2, TrendingUp, AlertCircle, Percent } from 'lucide-react';
import { PropertyIcon } from '@/components/property-icon';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/firebase/auth'; // Corrected import
import { firestore } from '@/firebase'; // Corrected import
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Query, getDocs, query, where, writeBatch } from 'firebase/firestore';
import { useDataContext } from '@/context/data-context';
import { createUserQuery } from '@/firebase/firestore/query-builder';
import { formatCurrency } from '@/lib/utils';
import type { Property } from '@/lib/types';
import { KpiCard } from '@/components/dashboard/kpi-card';

export function PropertiesClient() {
    const { user } = useUser();
    const { properties: dataContextProperties, loading: dataContextLoading, error: dataContextError } = useDataContext();
    const router = useRouter();

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProperty, setEditingProperty] = useState<Property | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
    const [propertyToDelete, setPropertyToDelete] = useState<Property | null>(null);

    const propertiesCollectionRef = useMemo(() => {
        if (!user) return null; // Ensure user is available
        return collection(firestore, 'properties');
    }, [user]);

    const propertiesQuery = useMemo(() => {
        if (!propertiesCollectionRef || !user) return null;
        return createUserQuery(firestore, 'properties', user.uid);
    }, [propertiesCollectionRef, user]);

    const [propertiesSnapshot, loading, error] = useCollection(propertiesQuery);

    // Use properties from DataContext which is already filtered by ownerId and live-synced
    const properties = dataContextProperties;
    const propertiesLoading = dataContextLoading;
    const propertiesError = dataContextError || error;


    const handleAddProperty = () => {
        setEditingProperty(null);
        setIsFormOpen(true);
    };

    const handleEditProperty = (property: Property) => {
        setEditingProperty(property);
        setIsFormOpen(true);
    };

    const handleSubmitForm = async (formData: Property | Omit<Property, 'id' | 'ownerId'>) => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            if (editingProperty) {
                // Update existing property
                const propertyRef = doc(firestore, 'properties', editingProperty.id!); // Use firestore directly
                await updateDoc(propertyRef, {
                    ...formData,
                    updatedAt: serverTimestamp(),
                });
            } else {
                // Add new property
                await addDoc(collection(firestore, 'properties'), {
                    ...formData,
                    ownerId: user.uid,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                });
            }
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
        if (!propertyToDelete || !user) return;
        setIsSubmitting(true);
        try {
            // Delete related documents first (tenancies, revenue, expenses, maintenance requests, app documents)
            // This is a simplified example; in a real app, you'd use Firebase Functions
            // to recursively delete subcollections and related data securely on the backend.
            
            // Fetch and delete tenancies
            const tenanciesSnapshot = await getDocs(query(collection(firestore, 'tenancies'), where('propertyId', '==', propertyToDelete.id), where('ownerId', '==', user.uid)));
            const batch = writeBatch(firestore); // Use firestore directly
            tenanciesSnapshot.docs.forEach(doc => batch.delete(doc.ref));

            // Fetch and delete revenue transactions
            const revenueSnapshot = await getDocs(query(collection(firestore, 'revenue'), where('propertyId', '==', propertyToDelete.id), where('ownerId', '==', user.uid)));
            revenueSnapshot.docs.forEach(doc => batch.delete(doc.ref));

            // Fetch and delete expenses
            const expensesSnapshot = await getDocs(query(collection(firestore, 'expenses'), where('propertyId', '==', propertyToDelete.id), where('ownerId', '==', user.uid)));
            expensesSnapshot.docs.forEach(doc => batch.delete(doc.ref));

            // Fetch and delete maintenance requests
            const maintenanceSnapshot = await getDocs(query(collection(firestore, 'maintenanceRequests'), where('propertyId', '==', propertyToDelete.id), where('ownerId', '==', user.uid)));
            maintenanceSnapshot.docs.forEach(doc => batch.delete(doc.ref));

            // Fetch and delete app documents related to the property
            const appDocsSnapshot = await getDocs(query(collection(firestore, 'appDocuments'), where('associatedEntityId', '==', propertyToDelete.id), where('associatedEntityType', '==', 'property'), where('ownerId', '==', user.uid)));
            appDocsSnapshot.docs.forEach(doc => batch.delete(doc.ref));

            // Delete the property itself
            batch.delete(doc(firestore, 'properties', propertyToDelete.id!)); // Use firestore directly
            await batch.commit();
            
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


    if (propertiesLoading) {
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

    if (propertiesError) {
        const msg = typeof propertiesError === 'string' ? propertiesError : (propertiesError as any)?.message || String(propertiesError);
        return <div className="text-destructive">Error loading properties: {msg}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">My Properties</h1>
                <Button onClick={handleAddProperty}>
                    <PlusCircle className="mr-2 h-5 w-5" /> Add New Property
                </Button>
            </div>

            {properties.length === 0 && !propertiesLoading ? (
                <Card className="text-center py-8">
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

                    {properties.map((property) => (
                        <Card key={property.id} className="relative group">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <div className="flex items-center space-x-2">
                                    <PropertyIcon type={property.type} className="h-5 w-5 text-muted-foreground" />
                                    <CardTitle className="text-lg font-semibold">{property.name}</CardTitle>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {property.address.city}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(property.currentValue || 0, 'en-KE', 'KES')}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Target Rent: {formatCurrency(property.targetRent || 0, 'en-KE', 'KES')}/month
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    Status: <span className="capitalize">{property.status}</span>
                                </p>
                                <div className="flex justify-end gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="outline" size="sm" onClick={() => handleEditProperty(property)}>Edit</Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDeleteProperty(property)}>Delete</Button>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href={`/properties/${property.id}`}>View</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
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
