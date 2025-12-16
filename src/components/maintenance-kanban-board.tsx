
'use client';


import { useState, useEffect } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { MoreHorizontal, FilePlus2, Edit, Trash2, CheckCircle, Circle, Clock, XCircle, X, User } from 'lucide-react';
import type { MaintenanceRequest } from '@/lib/types';
import { getLocale } from '@/lib/locales';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { Button } from './ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';


type KanbanColumnProps = {
  title: MaintenanceRequest['status'];
  requests: MaintenanceRequest[];
  onEditRequest: (request: MaintenanceRequest) => void;
  onDeleteRequest: (request: MaintenanceRequest) => void;
  onCreateExpense: (request: MaintenanceRequest) => void;
  onStatusChange: (request: MaintenanceRequest, newStatus: MaintenanceRequest['status']) => void;
  formattedDates: Record<string, string>;
  isFocused: boolean;
  onFocus: () => void;
};


const statusConfig = {
  'To Do': { icon: Circle, color: 'text-gray-500' },
  'In Progress': { icon: Clock, color: 'text-blue-500' },
  'Done': { icon: CheckCircle, color: 'text-green-500' },
  'Cancelled': { icon: XCircle, color: 'text-red-500' },
} as const;


const priorityColors = {
  low: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-700',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/50 dark:text-yellow-200 dark:border-yellow-700',
  high: 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900/50 dark:text-orange-200 dark:border-orange-700',
  urgent: 'bg-red-200 text-red-900 border-red-400 font-bold dark:bg-red-900/50 dark:text-red-100 dark:border-red-700',
};

const DONE_STATUS = 'Done' as const;

function KanbanCard({ 
    request, 
    onEdit, 
    onDelete, 
    onCreateExpense,
    onStatusChange, 
    formattedDate 
}: { 
    request: MaintenanceRequest;
    onEdit: (request: MaintenanceRequest) => void;
    onDelete: (request: MaintenanceRequest) => void;
    onCreateExpense: (request: MaintenanceRequest) => void;
    onStatusChange: (request: MaintenanceRequest, newStatus: MaintenanceRequest['status']) => void;
    formattedDate: string;
}) {
  return (
    <Card>
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
            <CardTitle className="text-base font-semibold leading-tight pr-2">
              {request.propertyId ? (
                <Link href={`/properties/${request.propertyId}`} className="hover:underline">
                  {request.propertyName}
                </Link>
              ) : (
                request.propertyName
              )}
            </CardTitle>
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button aria-haspopup="true" size="icon" variant="ghost" className="h-6 w-6 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Toggle menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem onSelect={() => onEdit(request)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Request
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      {Object.keys(statusConfig).map(status => (
                        <DropdownMenuItem 
                          key={status} 
                          onSelect={() => onStatusChange(request, status as MaintenanceRequest['status'])}
                          disabled={request.status === status}
                        >
                          {status}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuItem onSelect={() => onCreateExpense(request)} disabled={(request.status as string) === DONE_STATUS}>
                    <FilePlus2 className="mr-2 h-4 w-4" />
                    Create Expense
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => onDelete(request)} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Request
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
        </div>
        <p className="text-sm text-muted-foreground mt-1">{request.description}</p>
      </CardHeader>
      <CardFooter className="p-4 flex justify-between items-center text-sm">
        <Badge className={cn("text-xs border", priorityColors[request.priority as keyof typeof priorityColors] || priorityColors.medium)}>{request.priority}</Badge>
        <div className="flex items-center gap-2 text-muted-foreground">
          {request.contractorName && (
             <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <User className="h-4 w-4" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Assigned to: {request.contractorName}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <span>{formattedDate}</span>
        </div>
      </CardFooter>
    </Card>
  );
}


function KanbanColumn({ title, requests, onEditRequest, onDeleteRequest, onCreateExpense, onStatusChange, formattedDates, isFocused, onFocus }: KanbanColumnProps) {
  const config = statusConfig[(title as unknown) as keyof typeof statusConfig];
  const Icon = config?.icon || Circle;
  const color = config?.color || 'text-gray-500';
  
  return (
    <div className={cn("flex flex-col gap-4 transition-all duration-300", isFocused ? "flex-[4]" : "flex-[1] min-w-[200px]")}>
      <button 
        className="flex items-center gap-2 px-1 rounded-md py-1 -mx-1 hover:bg-muted transition-colors"
        onClick={onFocus}
      >
        <Icon className={cn("w-5 h-5", color)} />
        <h2 className="font-semibold text-lg">{title}</h2>
        <Badge variant="secondary" className="rounded-full">{requests.length}</Badge>
      </button>
      <div className={cn("bg-muted/50 rounded-lg p-2 flex-1 flex flex-col gap-4 h-full min-h-[150px] overflow-x-hidden overflow-y-auto", !isFocused && "opacity-50")}>
        {requests.length > 0 ? (
          requests.map(request => (
            <KanbanCard 
                key={request.id} 
                request={request}
                onEdit={onEditRequest}
                onDelete={onDeleteRequest}
                onCreateExpense={onCreateExpense}
                onStatusChange={onStatusChange}
                formattedDate={request.id ? (formattedDates[request.id] || '') : ''}
            />
          ))
        ) : (
          <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
            No requests here.
          </div>
        )}
      </div>
    </div>
  );
}


interface MaintenanceKanbanBoardProps {
  requests: MaintenanceRequest[];
  onEditRequest: (request: MaintenanceRequest) => void;
  onDeleteRequest: (request: MaintenanceRequest) => void;
  onCreateExpense: (request: MaintenanceRequest) => void;
  onStatusChange: (request: MaintenanceRequest, newStatus: MaintenanceRequest['status']) => void;
  locale: string;
}


export function MaintenanceKanbanBoard({
  requests,
  onEditRequest,
  onDeleteRequest,
  onCreateExpense,
  onStatusChange,
  locale
}: MaintenanceKanbanBoardProps) {


  const [formattedDates, setFormattedDates] = useState<Record<string, string>>({});
  const [focusedColumn, setFocusedColumn] = useState<MaintenanceRequest['status'] | null>(null);


  useEffect(() => {
    const formatAllDates = async () => {
      const localeData = await getLocale(locale);
      const newFormattedDates: Record<string, string> = {};
      for (const item of requests) {
        if (item.id) {
          newFormattedDates[item.id] = format(new Date((item as any).reportedDate), 'MMM dd', { locale: localeData });
        }
      }
      setFormattedDates(newFormattedDates);
    };
    if (requests.length > 0) {
        formatAllDates();
    }
  }, [requests, locale]);


  const columns = (['To Do', 'In Progress', 'Done', 'Cancelled'] as const).map(status => status as MaintenanceRequest['status']);


  const requestsByStatus = requests.reduce((acc, request) => {
    const status = request.status;
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(request);
    return acc;
  }, {} as Record<MaintenanceRequest['status'], MaintenanceRequest[]>);


  const handleFocus = (status: MaintenanceRequest['status']) => {
    setFocusedColumn(status);
  };
  
  const clearFocus = () => {
    setFocusedColumn(null);
  }


  return (
    <div className="flex flex-col h-full flex-grow">
      {focusedColumn && (
        <div className="mb-2 flex justify-end">
          <Button variant="outline" size="sm" onClick={clearFocus}>
            <X className="mr-2 h-4 w-4" />
            Clear Focus
          </Button>
        </div>
      )}
      <div className="flex gap-6 h-full flex-grow">
        {columns.map(status => (
          <KanbanColumn
            key={status}
            title={status}
            requests={requestsByStatus[status] || []}
            onEditRequest={onEditRequest}
            onDeleteRequest={onDeleteRequest}
            onCreateExpense={onCreateExpense}
            onStatusChange={onStatusChange}
            formattedDates={formattedDates}
            isFocused={focusedColumn === status || focusedColumn === null}
            onFocus={() => handleFocus(status)}
          />
        ))}
      </div>
    </div>
  );
}
