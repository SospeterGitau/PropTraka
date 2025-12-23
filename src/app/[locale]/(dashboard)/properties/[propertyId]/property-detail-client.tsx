'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ArrowLeft, Bed, Bath, Square, MoreHorizontal } from 'lucide-react';
import { PropertyIcon } from '@/components/property-icon';
import { PropertyForm } from '@/components/property-form';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { deleteProperty } from '@/app/actions/properties';
import { formatCurrency } from '@/lib/utils';
import type { Property, UserSettings } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface PropertyDetailClientProps {
    property: Property;
    isOccupied: boolean;
    settings: UserSettings | null;
}

function formatAddress(property: Property) {
    return `${property.address.street}, ${property.address.city}, ${property.address.state}${property.address.zipCode ? ` ${property.address.zipCode}` : ''}`;
}

export function PropertyDetailClient({ property, isOccupied, settings }: PropertyDetailClientProps) {
    const router = useRouter();
    const { toast } = useToast();
    const currency = settings?.currency || 'KES';
    const locale = settings?.dateFormat || 'en-KE'; // Using dateFormat as locale proxy or default

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    const status = isOccupied ? 'Occupied' : 'Vacant';
    const isPlaceholder = property.imageUrl?.includes('picsum.photos');

    const confirmDelete = async () => {
        try {
            await deleteProperty(property.id!);
            toast({
                title: "Property Deleted",
                description: "The property and all associated records have been deleted.",
            });
            router.push('/properties');
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to delete property."
            });
        } finally {
            setIsDeleteDialogOpen(false);
        }
    };

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
                            <DropdownMenuItem onSelect={() => setIsFormOpen(true)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onSelect={() => setIsDeleteDialogOpen(true)} className="text-destructive">Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" asChild>
                        <Link href="/properties">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Link>
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
                                    <CardDescription>{property.type}</CardDescription>
                                </div>
                                <Badge variant={status === 'Occupied' ? 'secondary' : 'outline'}>{status}</Badge>
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
                                />
                            ) : (
                                <div className="flex aspect-video w-full items-center justify-center rounded-md bg-muted mb-4">
                                    <PropertyIcon type={property.type} className="h-24 w-24 text-muted-foreground" />
                                </div>
                            )}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                                <div className="p-4 bg-muted rounded-lg">
                                    <div className="text-sm text-muted-foreground">Bedrooms</div>
                                    <div className="text-2xl font-bold flex items-center justify-center gap-2"><Bed className="h-5 w-5" /> {property.bedrooms || 0}</div>
                                </div>
                                <div className="p-4 bg-muted rounded-lg">
                                    <div className="text-sm text-muted-foreground">Bathrooms</div>
                                    <div className="text-2xl font-bold flex items-center justify-center gap-2"><Bath className="h-5 w-5" /> {property.bathrooms || 0}</div>
                                </div>
                                {property.squareFootage && (
                                    <div className="p-4 bg-muted rounded-lg">
                                        <div className="text-sm text-muted-foreground">Size</div>
                                        <div className="text-2xl font-bold flex items-center justify-center gap-2"><Square className="h-5 w-5" />{property.squareFootage} sqft</div>
                                    </div>
                                )}
                                <div className="p-4 bg-muted rounded-lg">
                                    <div className="text-sm text-muted-foreground">Type</div>
                                    <div className="text-xl font-bold flex items-center justify-center h-full">
                                        <Badge variant="secondary">{property.type}</Badge>
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
                                <span className="font-medium">{formatCurrency(property.currentValue || 0, locale, currency)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Purchase Price</span>
                                <span className="font-medium">{formatCurrency(property.purchasePrice || 0, locale, currency)}</span>
                            </div>
                            {/* Removed Purchase Taxes as it wasn't in new Property Type or Form */}
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Mortgage</span>
                                <span className="font-medium">{formatCurrency(property.mortgageBalance || 0, locale, currency)}</span>
                            </div>
                            <hr className="my-2" />
                            <div className="flex justify-between font-bold">
                                <span>Equity</span>
                                <span>{formatCurrency((property.currentValue || 0) - (property.mortgageBalance || 0), locale, currency)}</span>
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Rental</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Target Rent</span>
                                <span className="font-medium">{formatCurrency(property.targetRent || 0, locale, currency)}/month</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <PropertyForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                property={property}
            />

            <DeleteConfirmationDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={confirmDelete}
                itemName={`property at ${formatAddress(property)}`}
            />
        </div>
    );
}
