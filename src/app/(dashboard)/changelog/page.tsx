
'use client';

import { useDataContext } from '@/context/data-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Timeline, TimelineItem, TimelineConnector, TimelineHeader, TimelineTitle, TimelineIcon, TimelineDescription } from '@/components/ui/timeline';
import { PropertyIcon } from '@/components/property-icon';
import { Building2, FileText, HandCoins, Receipt } from 'lucide-react';
import { format } from 'date-fns';
import { getLocale } from '@/lib/locales';
import { useState, useEffect } from 'react';

const iconMap = {
    Property: <Building2 className="h-4 w-4" />,
    Tenancy: <FileText className="h-4 w-4" />,
    Expense: <Receipt className="h-4 w-4" />,
    Payment: <HandCoins className="h-4 w-4" />,
};

function ChangelogPage() {
  const { changelog, locale } = useDataContext();
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
  
  if (!changelog) {
    return <div>Loading...</div>;
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
        </CardContent>
      </Card>
    </>
  );
}

export default ChangelogPage;
