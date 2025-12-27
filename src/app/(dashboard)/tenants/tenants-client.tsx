'use client';

import { useState } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Search, Mail, User, Phone, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useDataContext } from '@/context/data-context';
import { InviteTenantDialog } from '@/components/invite-tenant-dialog';
import dynamic from 'next/dynamic';

const TenantForm = dynamic(() => import('@/components/tenant-form').then(mod => mod.TenantForm), {
    loading: () => <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto" /></div>,
    ssr: false
});
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export default function TenantsClient() {
    const { tenants, loading, error } = useDataContext();
    const [searchTerm, setSearchTerm] = useState('');
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingTenant, setEditingTenant] = useState<any>(null); // Replace 'any' with Tenant type if imported

    const filteredTenants = tenants.filter((tenant) =>
        (tenant.firstName + ' ' + tenant.lastName).toLowerCase().includes(searchTerm.toLowerCase()) ||
        tenant.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleAddTenant = () => {
        setEditingTenant(null);
        setIsAddDialogOpen(true);
    };

    const handleEditTenant = (tenant: any) => {
        setEditingTenant(tenant);
        setIsAddDialogOpen(true);
    };

    const getInitials = (firstName: string, lastName: string) => {
        return ((firstName?.[0] || '') + (lastName?.[0] || '')).toUpperCase();
    };

    if (loading) {
        return <div className="p-8 text-center">Loading tenants...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-500">Error: {error}</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <h1 className="text-3xl font-bold">Tenants</h1>
                <Button onClick={handleAddTenant}>
                    <PlusCircle className="mr-2 h-5 w-5" /> Add Tenant
                </Button>
            </div>

            <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-muted-foreground" />
                <Input
                    placeholder="Search tenants..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                />
            </div>

            {filteredTenants.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                        <User className="h-12 w-12 mb-4 opacity-20" />
                        <p className="text-lg">No tenants found.</p>
                        {searchTerm && <p className="text-sm">Try adjusting your search.</p>}
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {/* Mobile Card View */}
                    <div className="grid grid-cols-1 gap-4 md:hidden">
                        {filteredTenants.map((tenant) => (
                            <Card key={tenant.id} className="overflow-hidden">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src="" />
                                                <AvatarFallback>{getInitials(tenant.firstName, tenant.lastName)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="font-semibold text-lg">{tenant.firstName} {tenant.lastName}</div>
                                                <div className="text-sm text-muted-foreground">{tenant.email}</div>
                                            </div>
                                        </div>
                                        {tenant.invitationStatus === 'Accepted' ? (
                                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                                        ) : tenant.invitationStatus === 'Pending' ? (
                                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Invited</Badge>
                                        ) : (
                                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Not Invited</Badge>
                                        )}
                                    </div>

                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Phone className="h-4 w-4 text-muted-foreground" />
                                            <span>{tenant.phoneNumber}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <div className="flex-1">
                                            <InviteTenantDialog tenant={tenant} trigger={<Button size="sm" variant="outline" className="w-full">Invite</Button>} />
                                        </div>
                                        <Button size="sm" variant="secondary" className="flex-1" onClick={() => handleEditTenant(tenant)}>
                                            Edit
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTenants.map((tenant) => (
                                    <TableRow key={tenant.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar>
                                                    <AvatarImage src="" />
                                                    <AvatarFallback>{getInitials(tenant.firstName, tenant.lastName)}</AvatarFallback>
                                                </Avatar>
                                                <div className="font-medium">
                                                    {tenant.firstName} {tenant.lastName}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col text-sm">
                                                <div className="flex items-center gap-1">
                                                    <Mail className="h-3 w-3 text-muted-foreground" />
                                                    {tenant.email}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3 text-muted-foreground" />
                                                    {tenant.phoneNumber}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {tenant.invitationStatus === 'Accepted' ? (
                                                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Active</Badge>
                                            ) : tenant.invitationStatus === 'Pending' ? (
                                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Invited</Badge>
                                            ) : (
                                                <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Not Invited</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <InviteTenantDialog tenant={tenant} />
                                                <Button variant="outline" size="sm" onClick={() => handleEditTenant(tenant)}>
                                                    Edit
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogContent className="max-w-3xl overflow-y-auto max-h-[90vh]">
                    <DialogHeader>
                        <DialogTitle>{editingTenant ? 'Edit Tenant' : 'Add New Tenant'}</DialogTitle>
                        <DialogDescription>
                            {editingTenant ? 'Update the details of this tenant.' : 'Add a new tenant to your records.'}
                        </DialogDescription>
                    </DialogHeader>
                    <TenantForm
                        tenant={editingTenant}
                        isOpen={isAddDialogOpen} // Passing isOpen though checking TenantForm it might not use it fully if logic is internal
                        onClose={() => setIsAddDialogOpen(false)}
                        mode="dialog"
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
