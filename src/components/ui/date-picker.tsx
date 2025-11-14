"use client"
 
import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"
import { getLocale } from "@/lib/locales"
 
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
 
interface DatePickerProps {
    date: Date | undefined;
    setDate: (date: Date | undefined) => void;
    locale: string;
}

export function DatePicker({ date, setDate, locale }: DatePickerProps) {
  const [displayFormat, setDisplayFormat] = React.useState("PPP");

  React.useEffect(() => {
    // PPP is a convenient locale-sensitive long-form date format
    const formatStr = locale === 'en-US' ? 'MM/dd/yyyy' : 'dd/MM/yyyy';
    setDisplayFormat(formatStr);
  }, [locale]);
  
 
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, displayFormat) : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  )
}
