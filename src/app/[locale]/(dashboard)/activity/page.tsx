
'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser } from '@/firebase/auth'; // Corrected import
import { firestore } from '@/firebase'; // Corrected import
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, limit, Timestamp } from 'firebase/firestore';
import { useDataContext } from '@/context/data-context';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Clock, CheckCircle, AlertTriangle, XCircle, Home, DollarSign, Wrench } from 'lucide-react';

interface ActivityLogItem {
    id: string;
    type: 'system' | 'user-action' | 'data-update' | 'revenue' | 'expense' | 'maintenance';
    message: string;
    timestamp: Timestamp;
    details?: Record<string, any>;
}

export default function ActivityPage() {
    const { user } = useUser();
    const { loading: dataContextLoading, error: dataContextError } = useDataContext();

    const activityQuery = useMemo(() => {
        if (!user) return null;
        return query(
            collection(firestore, 'activityLog'),
            orderBy('timestamp', 'desc'),
            limit(100)
        );
    }, [user]);

    const [activitySnapshot, loading, error] = useCollection(activityQuery);

    const activityLogs: ActivityLogItem[] = useMemo(() => {
        if (!activitySnapshot) return [];
        return activitySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp, // Ensure timestamp is a Firestore Timestamp object
        })) as ActivityLogItem[];
    }, [activitySnapshot]);

    const isLoading = dataContextLoading || loading;
    const displayError = dataContextError || error;

    if (isLoading) {
        return (
            <div className="space-y-6">
                <h1 className="text-3xl font-bold">Activity Feed</h1>
                <Card>
                    <CardHeader><Skeleton className="h-6 w-1/3" /></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (displayError) {
        const errorMessage =
            typeof displayError === 'string'
                ? displayError
                : (displayError as Error).message || String(displayError);

        return <div className="text-destructive">Error loading activity: {errorMessage}</div>;
    }

    const getActivityIcon = (type: ActivityLogItem['type']) => {
        switch (type) {
            case 'system':
                return <Clock className="w-4 h-4 text-blue-500" />;
            case 'user-action':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'data-update':
                return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            case 'revenue':
                return <DollarSign className="w-4 h-4 text-green-500" />;
            case 'expense':
                return <Wrench className="w-4 h-4 text-red-500" />;
            case 'maintenance':
                return <Home className="w-4 h-4 text-orange-500" />;
            default:
                return <Clock className="w-4 h-4 text-gray-500" />;
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Activity Feed</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activities</CardTitle>
                    <CardDescription>A chronological log of all important events in your portfolio.</CardDescription>
                </CardHeader>
                <CardContent>
                    {activityLogs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            No recent activity found.
                        </div>
                    ) : (
                        <ScrollArea className="h-[400px]">
                            <div className="space-y-4">
                                {activityLogs.map((log) => (
                                    <div key={log.id} className="flex items-start space-x-3 text-sm">
                                        <div className="mt-1">
                                            {getActivityIcon(log.type)}
                                        </div>
                                        <div>
                                            <p className="font-medium">{log.message}</p>
                                            {log.details && (
                                                <p className="text-muted-foreground text-xs">
                                                    {JSON.stringify(log.details)}
                                                </p>
                                            )}
                                            <p className="text-muted-foreground text-xs">
                                                {log.timestamp && format(log.timestamp.toDate(), 'PPP p')}
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
    );
}
