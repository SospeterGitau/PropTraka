
'use client';

import { useDataContext } from '@/context/data-context';
import { PageHeader } from '@/components/page-header';
import { CalendarView } from '@/components/calendar-view';

function CalendarPageContent() {
  const { calendarEvents } = useDataContext();

  return (
    <>
      <PageHeader title="Calendar" />
      <CalendarView events={calendarEvents} />
    </>
  );
}


export default function CalendarPage() {
  return (
      <CalendarPageContent />
  );
}
