
'use client';

import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Timeline, TimelineItem, TimelineConnector, TimelineHeader, TimelineTitle, TimelineIcon, TimelineDescription } from '@/components/ui/timeline';
import { Building2, FileText, HandCoins, Receipt, Wrench } from 'lucide-react';
import { format } from 'date-fns';
import { getLocale } from '@/lib/locales';
import { useState, useEffect, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useCollection } from '@/firebase/firestore/use-collection';
import type { ChangeLogEntry } from '@/lib/types';
import { useDataContext } from '@/context/data-context';

const iconMap: { [key: string]: React.ReactNode } = {
    Property: <Building2 className="h-4 w-4" />,
    Tenancy: <FileText className="h-4 w-4" />,
    Expense: <Receipt className="h-4 w-4" />,
    Payment: <HandCoins className="h-4 w-4" />,
    Maintenance: <Wrench className="h-4 w-4" />,
    Contractor: <Wrench className="h-4 w-4" />,
};

function ChangelogPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { settings } = useDataContext();
  const { locale } = settings;

  const changelogQuery = useMemo(() => user?.uid ? query(collection(firestore, 'changelog'), where('ownerId', '==', user.uid), orderBy('date', 'desc')) : null, [firestore, user]);
  const { data: changelog, loading: isDataLoading } = useCollection<ChangeLogEntry>(changelogQuery);

  const [formattedDates, setFormattedDates] = useState<{[key: string]: string}>({});

  useEffect(() => {
    const formatAllDates = async () => {
        if (!changelog) return;
        const localeData = await getLocale(locale);
        const newFormattedDates: {[key: string]: string} = {};
        for (const item of changelog) {
            newFormattedDates[item.id] = format(new Date(item.date), 'MMMM dd, yyyy, HH:mm', { locale: localeData });
        }
        setFormattedDates(newFormattedDates);
    };
    formatAllDates();
  }, [changelog, locale]);
  
  if (isDataLoading) {
    return (
        <>
            <PageHeader title="Changelog" />
            <Card>
                <CardHeader>
                    <CardTitle><Skeleton className="h-6 w-1/2" /></CardTitle>
                    <CardDescription><Skeleton className="h-4 w-3/4" /></CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                   {Array.from({ length: 5 }).map((_, i) => (
                     <div key={i} className="flex gap-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className="space-y-2 flex-1">
                            <Skeleton className="h-5 w-1/3" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                     </div>
                   ))}
                </CardContent>
            </Card>
        </>
    );
  }

  return (
    <>
      <PageHeader title="Changelog" />
      <Card>
        <CardHeader>
            <CardTitle>Activity Feed</CardTitle>
            <CardDescription>A log of all significant events and changes within your portfolio.</CardDescription>
        </CardHeader>
        <CardContent>
           {changelog && changelog.length > 0 ? (
            <Timeline>
                {changelog.map((item, index) => (
                    <TimelineItem key={item.id}>
                        {index < changelog.length - 1 && <TimelineConnector />}
                        <TimelineHeader>
                            <TimelineIcon>{iconMap[item.type]}</TimelineIcon>
                            <TimelineTitle>{item.type} {item.action}</TimelineTitle>
                            <div className="text-sm text-muted-foreground ml-auto">{formattedDates[item.id]}</div>
                        </TimelineHeader>
                        <TimelineDescription>
                            {item.description}
                        </TimelineDescription>
                    </TimelineItem>
                ))}
            </Timeline>
           ) : (
             <div className="text-center py-8 text-muted-foreground">
                No activity recorded yet.
             </div>
           )}
        </CardContent>
      </Card>
    </>
  );
}

export default ChangelogPage;
