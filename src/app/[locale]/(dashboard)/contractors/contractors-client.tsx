
'use client';

import React, { useState, useMemo, memo } from 'react';
import type { Contractor } from '@/lib/types';
import { useDataContext } from '@/context/data-context';
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
import { Plus, Search, Mail, Phone, Edit2, Trash2, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';

const ContractorsClient = memo(function ContractorsClient() {
  const { contractors, loading } = useDataContext();
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  const filteredContractors = useMemo(() => {
    return contractors.filter(contractor =>
      contractor.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contractor.serviceCategories || []).join(' ').toLowerCase().includes(searchTerm.toLowerCase()) ||
      contractor.contactPersonName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [contractors, searchTerm]);

  const handleEditContractor = (contractor: Contractor) => {
    console.log('Edit contractor:', contractor.id);
    // TODO: Implement edit functionality
  };

  const handleDeleteContractor = (contractor: Contractor) => {
    if (confirm(`Are you sure you want to delete ${contractor.companyName || contractor.contactPersonName || 'this contractor'}?`)) {
      console.log('Delete contractor:', contractor.id);
      // TODO: Implement delete functionality with Firebase
    }
  };

  const handleAddContractor = () => {
    router.push('/contractors/add');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Contractors" />
        <Card>
          <CardHeader>
            <CardTitle><Skeleton className="h-6 w-1/2" /></CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Contractors" />

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Contractors & Service Providers</CardTitle>
              <CardDescription>Manage your list of trusted contractors</CardDescription>
            </div>
            <Button size="sm" onClick={handleAddContractor}>
              <Plus className="mr-2 h-4 w-4" />
              Add Contractor
            </Button>
          </div>

          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name, type, or business..."
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
                <TableHead className="w-[150px]">Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden md:table-cell">Business</TableHead>
                <TableHead className="hidden lg:table-cell">Contact</TableHead>
                <TableHead className="hidden sm:table-cell">Rating</TableHead>
                <TableHead className="text-right w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredContractors.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {searchTerm ? 'No contractors found matching your search.' : 'No contractors yet. Add your first contractor!'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredContractors.map((contractor) => (
                  <TableRow key={contractor.id}>
                    <TableCell>
                      <div className="font-medium">{contractor.companyName}</div>
                      <div className="text-sm text-muted-foreground sm:hidden">
                        {(contractor.serviceCategories || []).join(', ')}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary" className="capitalize">
                        {contractor.serviceCategories?.[0] || '—'}
                      </Badge>
                    </TableCell>
                      <TableCell className="hidden md:table-cell">
                      {contractor.contactPersonName || '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="flex flex-col gap-1 text-sm">
                        {contractor.email && (
                          <a href={`mailto:${contractor.email}`} className="flex items-center gap-1 hover:text-primary">
                            <Mail className="h-3 w-3" />
                            {contractor.email}
                          </a>
                        )}
                        {contractor.phoneNumber && (
                          <a href={`tel:${contractor.phoneNumber}`} className="flex items-center gap-1 hover:text-primary">
                            <Phone className="h-3 w-3" />
                            {contractor.phoneNumber}
                          </a>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="text-muted-foreground">—</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditContractor(contractor)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteContractor(contractor)}
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
    </div>
  );
});

export default ContractorsClient;
