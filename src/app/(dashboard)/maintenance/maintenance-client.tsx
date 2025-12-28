
'use client';

import React, { useState, useMemo, memo } from 'react';
import type { MaintenanceRequest, Property } from '@/lib/types';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Plus, Search, MoreHorizontal, Edit2, Trash2, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { firestore } from '@/firebase';
import { deleteDoc, doc } from 'firebase/firestore';

function formatAddress(property: any) {
  if (!property?.address) return 'No Address';
  const addr = property.address;
  return `${addr.street || addr.line1 || ''}, ${addr.city}, ${addr.state} ${addr.zipCode}`;
}

const MaintenanceClient = memo(function MaintenanceClient() {
  const { maintenanceRequests: rawRequests, properties, contractors, loading } = useDataContext();

  // Map DB types to UI types
  const maintenanceRequests: MaintenanceRequest[] = useMemo(() => {
    return rawRequests.map(req => {
      const property = properties.find(p => p.id === req.propertyId);
      const contractor = contractors.find(c => c.id === req.assignedToContractorId);

      return {
        id: req.id || '',
        propertyId: req.propertyId,
        title: req.description ? req.description.substring(0, 30) + (req.description.length > 30 ? '...' : '') : 'Maintenance Request',
        description: req.description,
        // Map status distinct values if needed, or cast if they match closely enough
        status: (req.status.toLowerCase().replace(' ', '-') as any) || 'pending',
        reportedDate: req.createdAt ? new Date(req.createdAt.seconds * 1000).toISOString() : new Date().toISOString(),
        priority: (req.priority.toLowerCase() as any) || 'medium',
        cost: req.cost,
        contractorId: req.assignedToContractorId,
        propertyName: property?.name || 'Unknown Property',
        contractorName: contractor?.companyName || 'Unknown Contractor',
        notes: req.notes
      };
    });
  }, [rawRequests, properties, contractors]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterPriority, setFilterPriority] = useState<string | null>(null);
  const router = useRouter();

  const propertyMap = useMemo(() => {
    return new Map(properties.map(p => [p.id, p]));
  }, [properties]);

  const filteredRequests = useMemo(() => {
    return maintenanceRequests.filter(request => {
      const matchesSearch = (request.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.propertyName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = !filterStatus || request.status === filterStatus;
      const matchesPriority = !filterPriority || request.priority === filterPriority;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [maintenanceRequests, searchTerm, filterStatus, filterPriority]);

  const statusStats = useMemo(() => {
    return {
      pending: maintenanceRequests.filter(r => r.status === 'pending').length,
      assigned: maintenanceRequests.filter(r => r.status === 'assigned').length,
      inProgress: maintenanceRequests.filter(r => r.status === 'in-progress').length,
      completed: maintenanceRequests.filter(r => r.status === 'completed').length,
    };
  }, [maintenanceRequests]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'pending':
      case 'assigned':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'urgent':
        return 'destructive';
      case 'high':
        return 'secondary';
      case 'medium':
        return 'outline';
      case 'low':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  const handleDeleteRequest = async (request: MaintenanceRequest) => {
    if (confirm(`Are you sure you want to delete this maintenance request: "${request.title}"?`)) {
      try {
        await deleteDoc(doc(firestore, 'maintenanceRequests', request.id));
      } catch (error) {
        console.error("Error deleting request:", error);
        alert("Failed to delete request.");
      }
    }
  };

  const handleAddRequest = () => {
    router.push('/maintenance/add');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title="Maintenance Requests" />
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
      <PageHeader title="Maintenance Requests" />

      <div className="grid gap-6 md:grid-cols-5">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{maintenanceRequests.length}</div>
            <p className="text-xs text-muted-foreground">All requests</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statusStats.pending}</div>
            <p className="text-xs text-muted-foreground">Awaiting action</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statusStats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Being worked on</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assigned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{statusStats.assigned}</div>
            <p className="text-xs text-muted-foreground">To contractors</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusStats.completed}</div>
            <p className="text-xs text-muted-foreground">Finished</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Maintenance Requests</CardTitle>
              <CardDescription>Manage and track all maintenance work</CardDescription>
            </div>
            <Button size="sm" onClick={handleAddRequest}>
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          </div>

          <div className="flex flex-col gap-4 mt-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by title, description, or property..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={filterStatus || ''}
              onChange={(e) => setFilterStatus(e.target.value || null)}
              className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="assigned">Assigned</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
            <select
              value={filterPriority || ''}
              onChange={(e) => setFilterPriority(e.target.value || null)}
              className="h-10 px-3 py-2 rounded-md border border-input bg-background text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Title</TableHead>
                <TableHead className="hidden md:table-cell">Property</TableHead>
                <TableHead className="hidden lg:table-cell">Description</TableHead>
                <TableHead className="hidden sm:table-cell">Priority</TableHead>
                <TableHead className="hidden sm:table-cell">Status</TableHead>
                <TableHead className="text-right w-[50px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                    {searchTerm || filterStatus || filterPriority ? 'No maintenance requests found matching your filters.' : 'No maintenance requests yet.'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRequests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell>
                      <div className="font-medium">{request.title}</div>
                      <div className="text-sm text-muted-foreground md:hidden">
                        {request.propertyName}
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {request.propertyName || '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell max-w-xs">
                      <p className="truncate text-sm">{request.description}</p>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant={getPriorityColor(request.priority)} className="capitalize">
                        {request.priority || 'Medium'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(request.status)}
                        <Badge variant="outline" className="capitalize">
                          {request.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem className="cursor-pointer">
                            <Edit2 className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer text-destructive"
                            onClick={() => handleDeleteRequest(request)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

export default MaintenanceClient;
