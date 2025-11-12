
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

interface CalendarViewProps {
  events: CalendarEvent[];
}

const eventColors: { [key: string]: string } = {
  appointment: 'bg-blue-500 text-white hover:bg-blue-600',
  'tenancy-start': 'bg-green-500 text-white hover:bg-green-600',
  'tenancy-end': 'bg-red-500 text-white hover:bg-red-600',
  expense: 'bg-yellow-500 text-black hover:bg-yellow-600',
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
    <TooltipProvider>
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

        <div className="grid grid-cols-7 border-t border-l border-border">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
            <div key={day} className="py-2 text-center font-medium text-sm text-muted-foreground bg-card border-r border-b border-border">
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
                  'relative flex flex-col min-h-[120px] bg-card p-1 border-r border-b border-border',
                  !isSameMonth(day, currentDate) && 'bg-muted/50'
                )}
              >
                <time
                  dateTime={format(day, 'yyyy-MM-dd')}
                  className={cn(
                    'text-sm h-6 w-6 flex items-center justify-center rounded-full',
                    isToday(day) && 'border-2 border-primary text-primary font-bold'
                  )}
                >
                  {format(day, 'd')}
                </time>
                <div className="mt-1 space-y-1 flex-1 overflow-y-auto">
                  {dayEvents.map((event, index) => (
                    <Tooltip key={index} delayDuration={0}>
                      <TooltipTrigger asChild>
                         <Badge
                          className={cn('w-full text-left block whitespace-nowrap text-xs font-semibold h-auto cursor-default truncate py-1 px-2 border-none rounded', eventColors[event.type])}
                        >
                          {event.title}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent className="w-60 text-sm z-10">
                        <div className="space-y-2">
                          <h4 className="font-medium leading-none">{event.title}</h4>
                           {event.details ? (
                            <div className="grid gap-2">
                              {Object.entries(event.details).map(([key, value]) => (
                                <div key={key} className="grid grid-cols-3 items-center gap-4">
                                  <span className="text-muted-foreground capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                                  <span className="col-span-2 font-semibold">{value}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                             <p className="text-muted-foreground">No additional details.</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </TooltipProvider>
  );
}
