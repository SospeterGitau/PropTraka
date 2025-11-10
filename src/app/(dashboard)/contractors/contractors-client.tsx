
'use client';

import { useState, memo, useMemo } from 'react';
import { MoreHorizontal, User, Mail, Phone, Wrench } from 'lucide-react';
import type { Contractor } from '@/lib/types';
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
import { Skeleton } from '@/components/ui/skeleton';
import { ContractorForm } from '@/components/contractor-form';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';

const ContractorsClient = memo(function ContractorsClient() {
  const { user } = useUser();
  const firestore = useFirestore();

  const contractorsQuery = useMemo(() => user?.uid ? query(collection(firestore, 'contractors'), where('ownerId', '==', user.uid)) : null, [firestore, user]);
  const { data: contractors, loading: isDataLoading } = useCollection<Contractor>(contractorsQuery);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedContractor, setSelectedContractor] = useState<Contractor | null>(null);

  const handleAdd = () => {
    setSelectedContractor(null);
    setIsFormOpen(true);
  };

  const handleEdit = (contractor: Contractor) => {
    setSelectedContractor(contractor);
    setIsFormOpen(true);
  };

  const handleDelete = (contractor: Contractor) => {
    setSelectedContractor(contractor);
    setIsDeleteDialogOpen(true);
  };
  
  const addChangeLogEntry = async (log: Omit<any, 'id' | 'date' | 'ownerId'>) => {
    if (!user) return;
    await addDoc(collection(firestore, 'changelog'), {
      ...log,
      ownerId: user.uid,
      date: serverTimestamp(),
    });
  };

  const confirmDelete = () => {
    if (selectedContractor) {
      deleteDoc(doc(firestore, 'contractors', selectedContractor.id));
      addChangeLogEntry({
        type: 'Contractor',
        action: 'Deleted',
        description: `Contractor "${selectedContractor.name}" was deleted.`,
        entityId: selectedContractor.id,
      });
      setIsDeleteDialogOpen(false);
      setSelectedContractor(null);
    }
  };

  const handleFormSubmit = async (data: Omit<Contractor, 'id'>) => {
    if (!user) return;
    const isEditing = !!selectedContractor;
    
    if (isEditing) {
      const { id, ...contractorData } = data;
      await updateDoc(doc(firestore, 'contractors', selectedContractor!.id), contractorData);
      addChangeLogEntry({
        type: 'Contractor',
        action: 'Updated',
        description: `Contractor "${data.name}" was updated.`,
        entityId: selectedContractor!.id,
      });
    } else {
      const docRef = await addDoc(collection(firestore, 'contractors'), { ...data, ownerId: user.uid });
       addChangeLogEntry({
        type: 'Contractor',
        action: 'Created',
        description: `Contractor "${data.name}" was created.`,
        entityId: docRef.id, 
      });
    }
  };
  
  if (isDataLoading) {
    return (
      <>
        <PageHeader title="Contractors">
          <Button disabled>Add Contractor</Button>
        </PageHeader>
        <Card>
          <CardHeader>
            <CardTitle><Skeleton className="h-6 w-1/2" /></CardTitle>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Contractors">
        <Button onClick={handleAdd}>Add Contractor</Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Contractor & Vendor List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contractors && contractors.length > 0 ? (
                contractors.map((contractor) => (
                  <TableRow key={contractor.id}>
                    <TableCell className="font-medium">{contractor.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{contractor.specialty}</Badge>
                    </TableCell>
                    <TableCell>
                       <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                        {contractor.email && (
                            <a href={`mailto:${contractor.email}`} className="flex items-center gap-2 hover:text-primary">
                                <Mail className="h-4 w-4" />
                                {contractor.email}
                            </a>
                        )}
                        {contractor.phone && (
                            <a href={`tel:${contractor.phone}`} className="flex items-center gap-2 hover:text-primary">
                                <Phone className="h-4 w-4" />
                                {contractor.phone}
                            </a>
                        )}
                       </div>
                    </TableCell>
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
                          <DropdownMenuItem onSelect={() => handleEdit(contractor)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleDelete(contractor)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                    No contractors found. Click "Add Contractor" to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <ContractorForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        contractor={selectedContractor}
      />
      
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        itemName={`contractor: ${selectedContractor?.name}`}
      />
    </>
  );
});

export default ContractorsClient;
