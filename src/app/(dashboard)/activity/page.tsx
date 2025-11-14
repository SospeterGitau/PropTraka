
'use client';

import { useState, useEffect, useMemo, memo } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CreditCard, Building2, FileText, HandCoins, Receipt, Wrench } from 'lucide-react';
import { useCollection } from 'react-firebase-hooks/firestore';
import type { ChangeLogEntry } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Timeline, TimelineItem, TimelineConnector, TimelineHeader, TimelineTitle, TimelineIcon, TimelineDescription } from '@/components/ui/timeline';
import { format } from 'date-fns';
import { getLocale } from '@/lib/locales';
import { useDataContext } from '@/context/data-context';
import { useUser, useFirestore } from '@/firebase';
import { createUserQuery } from '@/firebase/firestore/query-builder';
import { Query } from 'firebase/firestore';


const ChangelogPage = memo(function ChangelogPage() {
  const { settings } = useDataContext();
  const { locale } = settings;
  const { user } = useUser();
  const firestore = useFirestore();

  const changelogQuery = useMemo(() => 
    user?.uid ? createUserQuery(firestore, 'changelog', user.uid) : null
  , [firestore, user?.uid]);

  const [changelogSnapshot, isDataLoading, error] = useCollection(changelogQuery);

  const [formattedDates, setFormattedDates] = useState<{[key: string]: string}>({});

  const iconMap: { [key: string]: React.ReactNode } = {
      Property: <Building2 className="h-4 w-4" />,
      Tenancy: <FileText className="h-4 w-4" />,
      Expense: <Receipt className="h-4 w-4" />,
      Payment: <HandCoins className="h-4 w-4" />,
      Maintenance: <Wrench className="h-4 w-4" />,
      Contractor: <Wrench className="h-4 w-4" />,
      Subscription: <CreditCard className="h-4 w-4" />,
  };
  
  const sortedChangelog = useMemo(() => {
    if (!changelogSnapshot) return [];
    const data = changelogSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ChangeLogEntry));
    return [...data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [changelogSnapshot]);

  useEffect(() => {
    const formatAllDates = async () => {
        if (!sortedChangelog) return;
        const localeData = await getLocale(locale);
        const newFormattedDates: {[key: string]: string} = {};
        for (const item of sortedChangelog) {
            if (item.date) {
                newFormattedDates[item.id] = format(new Date(item.date), 'PPp', { locale: localeData });
            }
        }
        setFormattedDates(newFormattedDates);
    };
    formatAllDates();
  }, [sortedChangelog, locale]);
  
  if (isDataLoading) {
    return (
        <>
            <PageHeader title="Activity Feed" />
            <Card>
                <CardHeader>
                    <CardTitle><Skeleton className="h-6 w-1/2" /></CardTitle>
                    <div className="text-sm text-muted-foreground pt-1">
                        <Skeleton className="h-4 w-3/4" />
                    </div>
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
        <PageHeader title="Activity Feed" />
        <Card>
        <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>A log of all significant events and changes within your portfolio.</CardDescription>
        </CardHeader>
        <CardContent>
            {sortedChangelog && sortedChangelog.length > 0 ? (
            <Timeline>
                {sortedChangelog.map((item, index) => (
                    <TimelineItem key={item.id}>
                        {index < sortedChangelog.length - 1 && <TimelineConnector />}
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
});

export default function ActivityPage() {
    return <ChangelogPage />;
}
