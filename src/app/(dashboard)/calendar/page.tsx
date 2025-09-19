import { calendarEvents } from '@/lib/data';
import { PageHeader } from '@/components/page-header';
import { CalendarView } from '@/components/calendar-view';

export default function CalendarPage() {
  return (
    <>
      <PageHeader title="Calendar" />
      <CalendarView events={calendarEvents} />
    </>
  );
}
