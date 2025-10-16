
'use client';

import { useState, useEffect, memo } from 'react';
import { useDataContext } from '@/context/data-context';
import type { MaintenanceRequest, Transaction } from '@/lib/types';
import { getLocale } from '@/lib/locales';

import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { MaintenanceForm } from '@/components/maintenance-form';
import { ExpenseForm } from '@/components/expense-form';
import { Skeleton } from '@/components/ui/skeleton';
import { MaintenanceKanbanBoard } from '@/components/maintenance-kanban-board';


function MaintenanceClient() {
  const { 
    properties,
    maintenanceRequests, 
    addMaintenanceRequest, 
    updateMaintenanceRequest, 
    deleteMaintenanceRequest, 
    addExpense,
    formatCurrency,
    locale, 
    addChangeLogEntry, 
    isDataLoading 
  } = useDataContext();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isExpenseFormOpen, setIsExpenseFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [expenseFromMaintenance, setExpenseFromMaintenance] = useState<Partial<Transaction> | null>(null);

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
        notes: `Maintenance: ${request.description}`
    });
    setIsExpenseFormOpen(true);
  };

  const confirmDelete = () => {
    if (selectedRequest) {
      deleteMaintenanceRequest(selectedRequest.id);
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
  
  const handleStatusChange = (request: MaintenanceRequest, newStatus: MaintenanceRequest['status']) => {
    const updatedRequest = { ...request, status: newStatus };
    if (newStatus === 'Done' && !updatedRequest.completedDate) {
      updatedRequest.completedDate = new Date().toISOString().split('T')[0];
    }
    updateMaintenanceRequest(updatedRequest);
    addChangeLogEntry({
      type: 'Maintenance',
      action: 'Updated',
      description: `Status for "${request.description}" changed to ${newStatus}.`,
      entityId: request.id,
    });
  };

  const handleFormSubmit = (data: Omit<MaintenanceRequest, 'id' | 'ownerId'> | MaintenanceRequest) => {
    const isEditing = 'id' in data;

    if (isEditing) {
      updateMaintenanceRequest(data as MaintenanceRequest);
      addChangeLogEntry({
        type: 'Maintenance',
        action: 'Updated',
        description: `Maintenance request for "${data.propertyName}" was updated.`,
        entityId: data.id,
      });
    } else {
      addMaintenanceRequest(data);
       addChangeLogEntry({
        type: 'Maintenance',
        action: 'Created',
        description: `Maintenance request for "${data.propertyName}" was created.`,
        entityId: `temp-id-${Date.now()}`,
      });
    }
  };
  
  const handleExpenseFormSubmit = (data: Transaction) => {
    const { id, type, ...expenseData } = data;
    addExpense(expenseData);
    addChangeLogEntry({
      type: 'Expense',
      action: 'Created',
      description: `Expense for ${formatCurrency(data.amount)} (${data.category}) was logged from a maintenance task.`,
      entityId: data.id,
    });
  };

  if (isDataLoading || !properties || !maintenanceRequests) {
    return (
      <>
        <PageHeader title="Maintenance">
          <Button disabled>Add Request</Button>
        </PageHeader>
        <div className="flex gap-4 h-[calc(100vh-200px)]">
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
        <Button onClick={handleAdd}>Add Request</Button>
      </PageHeader>
      
      <MaintenanceKanbanBoard
        requests={maintenanceRequests}
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
      />
      
      {properties && <ExpenseForm
        isOpen={isExpenseFormOpen}
        onClose={() => setIsExpenseFormOpen(false)}
        onSubmit={handleExpenseFormSubmit}
        transaction={expenseFromMaintenance}
        properties={properties}
      />}
      
      <DeleteConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={confirmDelete}
        itemName={`maintenance request for ${selectedRequest?.propertyName}`}
      />
    </>
  );
}

export default memo(MaintenanceClient);
