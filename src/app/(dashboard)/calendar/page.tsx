
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUser } from '@/firebase/auth'; // Corrected import
import { firestore } from '@/firebase'; // Corrected import
import { collection, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { format, isSameDay } from 'date-fns';
import { Event } from '@/lib/types'; // Assuming you have an Event type
import { useDataContext } from '@/context/data-context';
import { Skeleton } from '@/components/ui/skeleton';

interface CalendarEvent {
    id: string;
    title: string;
    date: Date;
    type: 'tenancy' | 'maintenance' | 'revenue' | 'expense' | 'other';
    relatedId?: string;
    description?: string;
}

export default function CalendarPage() {
    const { user } = useUser();
    const { properties, revenue, expenses, maintenanceRequests, tenancies, loading: dataContextLoading, error: dataContextError } = useDataContext();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

    const isLoading = dataContextLoading;
    const error = dataContextError;

    // Combine all relevant data into calendar events
    const calendarEvents: CalendarEvent[] = useMemo(() => {
        if (!user || isLoading) return [];

        const events: CalendarEvent[] = [];

        // Tenancy events (start and end dates)
        tenancies.forEach(tenancy => {
            if (tenancy.startDate) {
                events.push({
                    id: `${tenancy.id}-start`,
                    title: `Tenancy Start: ${properties.find(p => p.id === tenancy.propertyId)?.name || 'N/A'}`,
                    date: tenancy.startDate.toDate(),
                    type: 'tenancy',
                    relatedId: tenancy.id,
                    description: `Tenant: ${tenancy.tenantId}`,
                });
            }
            if (tenancy.endDate) {
                events.push({
                    id: `${tenancy.id}-end`,
                    title: `Tenancy End: ${properties.find(p => p.id === tenancy.propertyId)?.name || 'N/A'}`,
                    date: tenancy.endDate.toDate(),
                    type: 'tenancy',
                    relatedId: tenancy.id,
                    description: `Tenant: ${tenancy.tenantId}`,
                });
            }
        });

        // Maintenance events (scheduled dates)
        maintenanceRequests.forEach(request => {
            if (request.scheduledDate) {
                events.push({
                    id: request.id!,
                    title: `Maintenance: ${request.description}`,
                    date: request.scheduledDate.toDate(),
                    type: 'maintenance',
                    relatedId: request.id,
                    description: `Property: ${properties.find(p => p.id === request.propertyId)?.name || 'N/A'} - Status: ${request.status}`,
                });
            }
        });

        // Revenue transaction due dates (if applicable - currently we only have 'Paid' or 'Overdue' status stored, not 'Due')
        // This part would need more sophisticated logic if you track upcoming revenue due dates explicitly.
        revenue.forEach(transaction => {
            // Example: if you have a `dueDate` field in RevenueTransaction, use it.
            // For now, let's just use the transaction date as an event.
            if (transaction.date) {
                events.push({
                    id: transaction.id!,
                    title: `Revenue: ${transaction.type} - ${formatCurrency(transaction.amount, 'en-KE', 'KES')}`,
                    date: transaction.date.toDate(),
                    type: 'revenue',
                    relatedId: transaction.id,
                    description: `Property: ${properties.find(p => p.id === transaction.propertyId)?.name || 'N/A'} - Status: ${transaction.status}`,
                });
            }
        });

        // Expense transaction dates
        expenses.forEach(expense => {
            if (expense.date) {
                events.push({
                    id: expense.id!,
                    title: `Expense: ${expense.category} - ${formatCurrency(expense.amount, 'en-KE', 'KES')}`,
                    date: expense.date.toDate(),
                    type: 'expense',
                    relatedId: expense.id,
                    description: `Property: ${properties.find(p => p.id === expense.propertyId)?.name || 'N/A'}`,
                });
            }
        });

        return events;
    }, [user, isLoading, properties, revenue, expenses, maintenanceRequests, tenancies]);

    const eventsForSelectedDate = useMemo(() => {
        if (!selectedDate) return [];
        return calendarEvents.filter(event => isSameDay(event.date, selectedDate))
            .sort((a, b) => a.date.getTime() - b.date.getTime()); // Sort by time
    }, [selectedDate, calendarEvents]);


    if (isLoading) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">Calendar</h1>
                <Card>
                    <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
                    <CardContent className="space-y-4 flex">
                        <Skeleton className="h-[300px] w-1/2" />
                        <Skeleton className="h-[300px] w-1/2" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (error) {
        return <div className="text-destructive">Error loading calendar data: {error.message}</div>;
    }

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Calendar</h1>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Overview</CardTitle>
                        <CardDescription>Select a date to view events.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={setSelectedDate}
                            className="rounded-md border shadow"
                        />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Events for {selectedDate ? format(selectedDate, 'PPP') : 'No Date Selected'}</CardTitle>
                        <CardDescription>{eventsForSelectedDate.length} events found.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {eventsForSelectedDate.length === 0 ? (
                            <div className="text-muted-foreground text-center py-8">
                                No events scheduled for this date.
                            </div>
                        ) : (
                            <ScrollArea className="h-[300px]">
                                <div className="space-y-4">
                                    {eventsForSelectedDate.map((event) => (
                                        <div key={event.id} className="flex items-start space-x-3">
                                            <div
                                                className={cn(
                                                    "flex h-2 w-2 translate-y-1 rounded-full",
                                                    event.type === 'tenancy' && 'bg-blue-500',
                                                    event.type === 'maintenance' && 'bg-yellow-500',
                                                    event.type === 'revenue' && 'bg-green-500',
                                                    event.type === 'expense' && 'bg-red-500',
                                                    event.type === 'other' && 'bg-gray-500',
                                                )}
                                            />
                                            <div>
                                                <p className="font-medium">{event.title}</p>
                                                {event.description && (
                                                    <p className="text-sm text-muted-foreground">{event.description}</p>
                                                )}
                                                <p className="text-xs text-muted-foreground">
                                                    {format(event.date, 'p')}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
