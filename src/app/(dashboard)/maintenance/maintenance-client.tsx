'use client';

import { useState, useEffect, memo } from 'react';
import { format } from 'date-fns';
import { MoreHorizontal } from 'lucide-react';
import { useDataContext } from '@/context/data-context';
import type { MaintenanceRequest } from '@/lib/types';
import { getLocale } from '@/lib/locales';

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
import { Badge } from '@/components/ui/badge';
import { DeleteConfirmationDialog } from '@/components/delete-confirmation-dialog';
import { MaintenanceForm } from '@/components/maintenance-form';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const priorityColors = {
  Low: 'bg-blue-100 text-blue-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  High: 'bg-orange-100 text-orange-800',
  Emergency: 'bg-red-200 text-red-900 font-bold',
};

const statusColors = {
  'To Do': 'bg-gray-200 text-gray-800',
  'In Progress': 'bg-blue-200 text-blue-800',
  Done: 'bg-green-200 text-green-800',
  Cancelled: 'bg-red-200 text-red-800',
};


function MaintenanceClient() {
  const { 
    properties,
    maintenanceRequests, 
    addMaintenanceRequest, 
    updateMaintenanceRequest, 
    deleteMaintenanceRequest, 
    locale, 
    addChangeLogEntry, 
    isDataLoading 
  } = useDataContext();
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<MaintenanceRequest | null>(null);
  const [formattedDates, setFormattedDates] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const formatAllDates = async () => {
      if (!maintenanceRequests) return;
      const localeData = await getLocale(locale);
      const newFormattedDates: { [key: string]: string } = {};
      for (const item of maintenanceRequests) {
        newFormattedDates[item.id] = format(new Date(item.reportedDate), 'MMMM dd, yyyy', { locale: localeData });
      }
      setFormattedDates(newFormattedDates);
    };
    formatAllDates();
  }, [maintenanceRequests, locale]);

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

  if (isDataLoading || !properties) {
    return (
      <>
        <PageHeader title="Maintenance">
          <Button disabled>Add Request</Button>
        </PageHeader>
        <Card>
          <CardHeader><CardTitle><Skeleton className="h-6 w-1/2" /></CardTitle></CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full" />
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader title="Maintenance">
        <Button onClick={handleAdd}>Add Request</Button>
      </PageHeader>
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Property</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Reported</TableHead>
                <TableHead>
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maintenanceRequests && maintenanceRequests.length > 0 ? (
                maintenanceRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.propertyName}</TableCell>
                    <TableCell>{request.description}</TableCell>
                    <TableCell>
                      <Badge className={cn(priorityColors[request.priority])}>{request.priority}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(statusColors[request.status])}>{request.status}</Badge>
                    </TableCell>
                    <TableCell>{formattedDates[request.id]}</TableCell>
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
                          <DropdownMenuItem onSelect={() => handleEdit(request)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem onSelect={() => handleDelete(request)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No maintenance requests found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <MaintenanceForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleFormSubmit}
        request={selectedRequest}
        properties={properties}
      />
      
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

    