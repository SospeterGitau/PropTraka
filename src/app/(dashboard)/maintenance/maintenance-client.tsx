
'use client';

import { useState, useMemo, memo } from 'react';
import type { MaintenanceRequest, Transaction, Property, Contractor } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { MaintenanceForm } from '@/components/maintenance-form';
import { ExpenseForm } from '@/components/expense-form';
import { Skeleton } from '@/components/ui/skeleton';
import { MaintenanceKanbanBoard } from '@/components/maintenance-kanban-board';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser, useFirestore } from '@/firebase';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, Query } from 'firebase/firestore';
import { useDataContext } from '@/context/data-context';
import { createUserQuery } from '@/firebase/firestore/query-builder';

function formatAddress(property: Property) {
  return `${property.addressLine1}, ${property.city}, ${property.state} ${property.postalCode}`;
}

const MaintenanceClient = memo(function MaintenanceClient() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { settings } = useDataContext();
  const currency = settings?.currency || 'KES';
  const locale = settings?.locale || 'en-KE';
  const { toast } = useToast();

  // Data Fetching
  const propertiesQuery = useMemo(() => user?.uid ? createUserQuery(firestore, 'properties', user.uid) : null, [firestore, user?.uid]);
  const maintenanceRequestsQuery = useMemo(() => user?.uid ? createUserQuery(firestore, 'maintenanceRequests', user.uid) : null, [firestore, user?.uid]);
  const contractorsQuery = useMemo(() => user?.uid ? createUserQuery(firestore, 'contractors', user.uid) : null, [firestore, user?.uid]);
  
  const [propertiesSnapshot, isPropertiesLoading] = useCollection(propertiesQuery);
  const [maintenanceRequestsSnapshot, isMaintenanceLoading] = useCollection(maintenanceRequestsQuery);
  const [contractorsSnapshot, isContractorsLoading] = useCollection(contractorsQuery);

  const properties = useMemo(() => propertiesSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Property)) || [], [propertiesSnapshot]);
  const maintenanceRequests = useMemo(() => maintenanceRequestsSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as MaintenanceRequest)) || [], [maintenanceRequestsSnapshot]);
  const contractors = useMemo(() => contractorsSnapshot?.docs.map(doc => ({ ...doc.data(), id: doc.id } as Contractor)) || [], [contractorsSnapshot]);


  const isDataLoading = isPropertiesLoading || isMaintenanceLoading || isContractorsLoading;

  // State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [expenseFromMaintenance, setExpenseFromMaintenance] = useState<Partial<Transaction> | null>(null);
  const [propertyFilter, setPropertyFilter] = useState('all');

  // Formatting
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
  };
  
  // Actions
  const addChangeLogEntry = async (log: Omit<any, 'id' | 'date' | 'ownerId'>) => {
    if (!user) return;
    try {
      await addDoc(collection(firestore, 'changelog'), {
        ...log,
        ownerId: user.uid,
        date: serverTimestamp(),
      });
    } catch (error) {
      console.error("Failed to add changelog entry:", error);
    }
  };

  const handleAdd = () => {
    setSelectedRequest(null);
    setIsFormOpen(true);
  };

  const handleEdit = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setIsFormOpen(true);
  };

  const handleDelete = (request: MaintenanceRequest) => {
    setSelectedRequest(request);
    setIsDeleteDialogOpen(true);
  };
  
  const handleCreateExpense = (request: MaintenanceRequest) => {
    setExpenseFromMaintenance({
        propertyId: request.propertyId,
        date: request.completedDate || request.reportedDate,
        category: 'Maintenance',
        notes: `Maintenance: ${request.description}`,
        amount: request.cost,
        contractorId: request.contractorId,
    });
    setIsExpenseFormOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedRequest) {
      await deleteDoc(doc(firestore, 'maintenanceRequests', selectedRequest.id));
      addChangeLogEntry({
        type: 'Maintenance',
        action: 'Deleted',
        description: `Maintenance request for "${selectedRequest.propertyName}" was deleted.`,
        entityId: selectedRequest.id,
      });
      setIsDeleteDialogOpen(false);
      setSelectedRequest(null);
    }
  };
  
  const handleStatusChange = async (request: MaintenanceRequest, newStatus: MaintenanceRequest['status']) => {
    const updatedRequest = { ...request, status: newStatus };
    if (newStatus === 'Done' && !updatedRequest.completedDate) {
      updatedRequest.completedDate = new Date().toISOString().split('T')[0];
    }
    await updateDoc(doc(firestore, 'maintenanceRequests', request.id), updatedRequest);
    addChangeLogEntry({
      type: 'Maintenance',
      action: 'Updated',
      description: `Status for "${request.description}" changed to ${newStatus}.`,
      entityId: request.id,
    });
  };

  const handleFormSubmit = async (data: Omit<MaintenanceRequest, 'id' | 'ownerId'> | MaintenanceRequest) => {
    if (!user) return;

    if ('id' in data) {
      const { id, ...requestData } = data;
      await updateDoc(doc(firestore, 'maintenanceRequests', id), requestData);
      addChangeLogEntry({
        type: 'Maintenance',
        action: 'Updated',
        description: `Maintenance request for "${data.propertyName}" was updated.`,
        entityId: data.id,
      });
    } else {
      const docRef = await addDoc(collection(firestore, 'maintenanceRequests'), { ...data, ownerId: user.uid });
       addChangeLogEntry({
        type: 'Maintenance',
        action: 'Created',
        description: `Maintenance request for "${data.propertyName}" was created.`,
        entityId: docRef.id,
      });
    }
    setIsFormOpen(false);
  };
  
  const handleExpenseFormSubmit = async (data: Transaction | Omit<Transaction, 'id' | 'ownerId'>) => {
    if(!user) return;
    const { id, type, ...expenseData } = data as Transaction;
    const docRef = await addDoc(collection(firestore, 'expenses'), { ...expenseData, type: 'expense', ownerId: user.uid });
    addChangeLogEntry({
      type: 'Expense',
      action: 'Created',
      description: `Expense for ${formatCurrency(data.amount || 0)} (${data.category}) was logged from a maintenance task.`,
      entityId: docRef.id,
    });
     toast({
      title: "Expense Created",
      description: "The expense has been logged successfully.",
    });
    setIsExpenseFormOpen(false);
  };

  const filteredRequests = useMemo(() => {
    if (!maintenanceRequests) return [];
    if (propertyFilter === 'all') {
      return maintenanceRequests;
    }
    if (propertyFilter === 'general') {
      return maintenanceRequests.filter(req => !req.propertyId);
    }
    return maintenanceRequests.filter(req => req.propertyId === propertyFilter);
  }, [maintenanceRequests, propertyFilter]);

  if (isDataLoading || !properties || !maintenanceRequests || !contractors) {
    return (
      <>
        <PageHeader title="Maintenance">
           <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-48" />
            <Button disabled>Add Request</Button>
          </div>
        </PageHeader>
        <div className="flex gap-6 h-[calc(100vh-200px)]">
          {['To Do', 'In Progress', 'Done', 'Cancelled'].map(status => (
            <div key={status} className="flex-1">
              <Skeleton className="h-8 w-1/2 mb-4" />
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            </div>
          ))}
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Maintenance">
        <div className="flex items-center gap-2">
            <Select value={propertyFilter} onValueChange={setPropertyFilter}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Filter by property..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Properties</SelectItem>
                <SelectItem value="general">General Tasks</SelectItem>
                {properties.map(p => (
                  <SelectItem key={p.id} value={p.id}>{formatAddress(p)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAdd}>Add Request</Button>
        </div>
      </PageHeader>
      
      <MaintenanceKanbanBoard
        requests={filteredRequests}
        onEditRequest={handleEdit}
        onDeleteRequest={handleDelete}
        onCreateExpense={handleCreateExpense}
        onStatusChange={handleStatusChange}
        locale={locale}
      />
      
      <MaintenanceForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        request={selectedRequest}
        properties={properties}
        contractors={contractors}
      />
      
      <ExpenseForm
        isOpen={isExpenseFormOpen}
        onClose={() => setIsExpenseFormOpen(false)}
        onSubmit={handleExpenseFormSubmit}
        transaction={expenseFromMaintenance}
        properties={properties}
        contractors={contractors}
      />
      
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        itemName={`maintenance request for ${selectedRequest?.propertyName}`}
      />
    </>
  );
});

export default MaintenanceClient;
