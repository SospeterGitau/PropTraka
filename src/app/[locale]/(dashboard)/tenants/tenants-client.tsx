'use client';

import React, { useState, useMemo, memo } from 'react';
import type { Tenant } from '@/lib/types';
import { deleteTenant } from '@/app/actions/tenants';
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, Search, Mail, Phone, Edit2, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { TenantForm } from '@/components/tenant-form';

const TenantsClient = memo(function TenantsClient({ initialTenants = [] }: { initialTenants?: Tenant[] }) {
  const [tenants, setTenants] = useState<Tenant[]>(initialTenants);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const router = useRouter();

  const filteredTenants = useMemo(() => {
    return tenants.filter(tenant =>
      tenant.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tenant.phoneNumber && tenant.phoneNumber.includes(searchTerm))
    );
  }, [tenants, searchTerm]);

  const handleEditTenant = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setIsEditOpen(true);
  };

  const handleDeleteTenant = async (tenant: Tenant) => {
    if (confirm(`Are you sure you want to delete ${tenant.firstName} ${tenant.lastName}?`)) {
      try {
        if (tenant.id) {
          // Optimistic update
          setTenants(prev => prev.filter(t => t.id !== tenant.id));
          await deleteTenant(tenant.id);
        }
      } catch (error) {
        console.error("Failed to delete tenant:", error);
        alert("Failed to delete tenant");
      }
    }
  };

  const handleAddTenant = () => {
    router.push('/tenants/add');
  };



  return (
    <div className="space-y-6">
      <PageHeader title="Tenants" />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Tenants Directory</CardTitle>
              <CardDescription>Manage your tenants and their details.</CardDescription>
            </div>
            <Button size="sm" onClick={handleAddTenant}>
              <Plus className="mr-2 h-4 w-4" />
              Add Tenant
            </Button>
          </div>

          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Contact</TableHead>
                <TableHead className="hidden lg:table-cell">ID Type</TableHead>
                <TableHead className="hidden lg:table-cell">ID Number</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTenants.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    {searchTerm ? 'No tenants found matching your search.' : 'No tenants yet. Add your first tenant!'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id}>
                    <TableCell>
                      <div className="font-medium">{tenant.firstName} {tenant.lastName}</div>
                      <div className="text-sm text-muted-foreground md:hidden">
                        {tenant.email}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex flex-col gap-1 text-sm">
                        {tenant.email && (
                          <a href={`mailto:${tenant.email}`} className="flex items-center gap-1 hover:text-primary">
                            <Mail className="h-3 w-3" />
                            {tenant.email}
                          </a>
                        )}
                        {tenant.phoneNumber && (
                          <a href={`tel:${tenant.phoneNumber}`} className="flex items-center gap-1 hover:text-primary">
                            <Phone className="h-3 w-3" />
                            {tenant.phoneNumber}
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {tenant.idType}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {tenant.idNumber}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditTenant(tenant)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTenant(tenant)}
                          className="h-8 w-8 p-0 text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <TenantForm
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        tenant={selectedTenant}
        mode="dialog"
      />
    </div>
  );
});

export default TenantsClient;
