
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ArrowLeft } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { MaintenanceRequest, Property, Tenancy, Contractor } from '@/lib/types';
import { useDataContext } from '@/context/data-context';
import { Timestamp } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PageHeader } from '@/components/page-header';

interface MaintenanceRequestFormProps {
  maintenanceRequest?: MaintenanceRequest | null;
  isOpen?: boolean; // Optional, for dialog mode
  onClose?: () => void; // Optional, for dialog mode
  onSubmit?: (data: Omit<MaintenanceRequest, "ownerId" | "id" | "createdAt" | "updatedAt"> | MaintenanceRequest) => void;
  mode?: 'dialog' | 'page'; // New prop to determine rendering mode
}

export function MaintenanceRequestForm({
  maintenanceRequest: initialRequest,
  isOpen = false,
  onClose,
  onSubmit,
  mode = 'dialog',
}: MaintenanceRequestFormProps) {
  const { addMaintenanceRequest, updateMaintenanceRequest, properties, tenancies, tenants, contractors } = useDataContext();
  const router = useRouter();

  const [propertyId, setPropertyId] = useState('');
  const [tenancyId, setTenancyId] = useState(''); // Optional
  const [reportedBy, setReportedBy] = useState<MaintenanceRequest['reportedBy']>('Owner');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<MaintenanceRequest['priority']>('Medium');
  const [status, setStatus] = useState<MaintenanceRequest['status']>('New');
  const [assignedToContractorId, setAssignedToContractorId] = useState('');
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>();
  const [completedDate, setCompletedDate] = useState<Date | undefined>();
  const [cost, setCost] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  const [isScheduledCalendarOpen, setIsScheduledCalendarOpen] = useState(false);
  const [isCompletedCalendarOpen, setIsCompletedCalendarOpen] = useState(false);

  useEffect(() => {
    if (initialRequest) {
      setPropertyId(initialRequest.propertyId);
      setTenancyId(initialRequest.tenancyId || '');
      setReportedBy(initialRequest.reportedBy);
      setDescription(initialRequest.description);
      setPriority(initialRequest.priority);
      setStatus(initialRequest.status);
      setAssignedToContractorId(initialRequest.assignedToContractorId || '');
      setScheduledDate(initialRequest.scheduledDate ? initialRequest.scheduledDate.toDate() : undefined);
      setCompletedDate(initialRequest.completedDate ? initialRequest.completedDate.toDate() : undefined);
      setCost(initialRequest.cost || '');
      setNotes(initialRequest.notes || '');
    } else {
      resetForm();
    }
  }, [initialRequest, isOpen]);

  const resetForm = () => {
    setPropertyId(''); setTenancyId(''); setReportedBy('Owner'); setDescription('');
    setPriority('Medium'); setStatus('New'); setAssignedToContractorId('');
    setScheduledDate(undefined); setCompletedDate(undefined); setCost(''); setNotes('');
  };

  const formatAddress = (property: Property) => {
    const address = property.address;
    return `${address.street}, ${address.city}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!propertyId || !description || !reportedBy || !priority || !status) {
      alert('Please fill in all required fields.');
      return;
    }

    const maintenanceRequestData: Omit<MaintenanceRequest, 'id' | 'ownerId' | 'createdAt' | 'updatedAt'> = {
      propertyId,
      tenancyId: tenancyId || undefined,
      reportedBy,
      description,
      priority,
      status,
      assignedToContractorId: assignedToContractorId || undefined,
      scheduledDate: scheduledDate ? Timestamp.fromDate(scheduledDate) : undefined,
      completedDate: completedDate ? Timestamp.fromDate(new Date(completedDate)) : undefined,
      cost: typeof cost === 'number' ? cost : undefined,
      notes: notes || undefined,
    };

    try {
      if (onSubmit) {
        if (initialRequest?.id) {
          onSubmit({ ...maintenanceRequestData, id: initialRequest.id, ownerId: initialRequest.ownerId, createdAt: initialRequest.createdAt, updatedAt: Timestamp.now() });
        } else {
          onSubmit(maintenanceRequestData);
        }
      } else {
        if (initialRequest?.id) {
          await updateMaintenanceRequest(initialRequest.id, { ...maintenanceRequestData, id: initialRequest.id, ownerId: initialRequest.ownerId, createdAt: initialRequest.createdAt, updatedAt: Timestamp.now() });
        } else {
          await addMaintenanceRequest(maintenanceRequestData);
        }
      }
      if (mode === 'dialog' && onClose) onClose();
      if (mode === 'page') router.push('/maintenance');
    } catch (error) {
      console.error('Failed to save maintenance request:', error);
      alert('Failed to save maintenance request. Please try again.');
    }
  };

  const FormContent = (
    <form onSubmit={handleSubmit} className="space-y-6 py-4">
      <div className="space-y-2">
        <Label htmlFor="propertyId">Property *</Label>
        <Select value={propertyId} onValueChange={setPropertyId} required>
          <SelectTrigger id="propertyId"><SelectValue placeholder="Select a property" /></SelectTrigger>
          <SelectContent>
            {properties.map(property => (
              <SelectItem key={property.id} value={property.id!}>{formatAddress(property)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tenancyId">Tenancy (optional)</Label>
        <Select value={tenancyId} onValueChange={setTenancyId} disabled={!propertyId}>
          <SelectTrigger id="tenancyId"><SelectValue placeholder="Select a tenancy" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">No Specific Tenancy</SelectItem>
            {tenancies.filter(t => t.propertyId === propertyId).map(tenancy => {
              const tenant = tenancy.tenantId ? tenants.find(t => t.id === tenancy.tenantId) : null;
              const tenantName = tenant ? `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() : 'Unknown Tenant';
              const dateLabel = tenancy.startDate && typeof tenancy.startDate?.toDate === 'function' ? format(tenancy.startDate.toDate(), 'MMM yy') : (tenancy.startDate ? String(tenancy.startDate).slice(0,7) : '');
              return <SelectItem key={tenancy.id} value={tenancy.id!}>{tenantName} - {dateLabel}</SelectItem>;
            })}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reportedBy">Reported By *</Label>
        <Select value={reportedBy} onValueChange={(value) => setReportedBy(value as MaintenanceRequest['reportedBy'])} required>
          <SelectTrigger id="reportedBy"><SelectValue placeholder="Select who reported" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Tenant">Tenant</SelectItem>
            <SelectItem value="Owner">Owner</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description *</Label>
        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} required className="min-h-[100px]" placeholder="Describe the maintenance issue..." />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">Priority *</Label>
          <Select value={priority} onValueChange={(value) => setPriority(value as MaintenanceRequest['priority'])} required>
            <SelectTrigger id="priority"><SelectValue placeholder="Select priority" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Medium">Medium</SelectItem>
              <SelectItem value="High">High</SelectItem>
              <SelectItem value="Urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select value={status} onValueChange={(value) => setStatus(value as MaintenanceRequest['status'])} required>
            <SelectTrigger id="status"><SelectValue placeholder="Select status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="New">New</SelectItem>
              <SelectItem value="Assigned">Assigned</SelectItem>
              <SelectItem value="In Progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="Canceled">Canceled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="assignedToContractorId">Assigned To Contractor (optional)</Label>
        <Select value={assignedToContractorId} onValueChange={setAssignedToContractorId}>
          <SelectTrigger id="assignedToContractorId"><SelectValue placeholder="Select a contractor" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Unassigned</SelectItem>
            {contractors.map(contractor => (
              <SelectItem key={contractor.id} value={contractor.id!}>{contractor.companyName} ({contractor.contactPersonName})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="scheduledDate">Scheduled Date (optional)</Label>
          <Popover open={isScheduledCalendarOpen} onOpenChange={setIsScheduledCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !scheduledDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {scheduledDate ? format(scheduledDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={scheduledDate}
                onSelect={(d) => { setScheduledDate(d); setIsScheduledCalendarOpen(false); }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label htmlFor="completedDate">Completion Date (optional)</Label>
          <Popover open={isCompletedCalendarOpen} onOpenChange={setIsCompletedCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !completedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {completedDate ? format(completedDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={completedDate}
                onSelect={(d) => { setCompletedDate(d); setIsCompletedCalendarOpen(false); }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="cost">Estimated Cost (optional)</Label>
        <Input id="cost" type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value ? Number(e.target.value) : '')} placeholder="0.00" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-[100px]" placeholder="Any additional notes or details..." />
      </div>

      <DialogFooter className="pt-4">
        {mode === 'page' ? (
          <div className="flex justify-end gap-3 w-full">
            <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
            <Button type="submit">Save Request</Button>
          </div>
        ) : (
          <div className="flex justify-end gap-3 w-full">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Request</Button>
          </div>
        )}
      </DialogFooter>
    </form>
  );

  if (mode === 'page') {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader title={initialRequest ? 'Edit Maintenance Request' : 'Add New Maintenance Request'}>
          <Button variant="outline" asChild>
            <Link href="/maintenance">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Maintenance
            </Link>
          </Button>
        </PageHeader>
        {FormContent}
      </div>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialRequest ? 'Edit Maintenance Request' : 'Add New Maintenance Request'}</DialogTitle>
          <DialogDescription>Create or update a maintenance request for your properties.</DialogDescription>
        </DialogHeader>
        {FormContent}
      </DialogContent>
    </Dialog>
  );
}
