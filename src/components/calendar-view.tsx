'use client';

import { useState } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { CalendarEvent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  events: CalendarEvent[];
}

const eventColors = {
  appointment: 'bg-blue-200 text-blue-800',
  'tenancy-start': 'bg-green-200 text-green-800',
  'tenancy-end': 'bg-red-200 text-red-800',
  expense: 'bg-yellow-200 text-yellow-800',
};

export function CalendarView({ events }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  const firstDayOfGrid = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 });
  const lastDayOfGrid = endOfWeek(lastDayOfMonth, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: firstDayOfGrid, end: lastDayOfGrid });

  const eventsByDate = events.reduce((acc, event) => {
    const date = event.date.split('T')[0];
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  return (
    <div className="bg-card p-4 rounded-lg shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
            <Button size="icon" variant="outline" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-xl font-semibold w-40 text-center">{format(currentDate, 'MMMM yyyy')}</h2>
            <Button size="icon" variant="outline" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
        <Button variant="outline" onClick={goToToday}>Today</Button>
      </div>

      <div className="grid grid-cols-7 gap-px border-t border-l border-border bg-border">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
          <div key={day} className="py-2 text-center font-medium text-sm text-muted-foreground bg-card">
            {day}
          </div>
        ))}

        {days.map((day) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const dayEvents = eventsByDate[dayKey] || [];
          return (
            <div
              key={day.toString()}
              className={cn(
                'relative flex flex-col min-h-[120px] bg-card p-2',
                !isSameMonth(day, currentDate) && 'bg-muted/50'
              )}
            >
              <time
                dateTime={format(day, 'yyyy-MM-dd')}
                className={cn(
                  'text-sm',
                  isToday(day) && 'flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground'
                )}
              >
                {format(day, 'd')}
              </time>
              <div className="mt-1 space-y-1 overflow-y-auto">
                {dayEvents.map((event, index) => (
                  <Badge
                    key={index}
                    className={cn('w-full text-left block whitespace-normal text-xs font-normal', eventColors[event.type])}
                  >
                    {event.title}
                  </Badge>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
