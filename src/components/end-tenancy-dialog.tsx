
'use client';

import { useState } from 'react';
import { format, sub, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import type { Transaction } from '@/lib/types';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Label } from './ui/label';

interface EndTenancyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (newEndDate: Date) => void;
  tenancy: Transaction;
}

export function EndTenancyDialog({ isOpen, onClose, onConfirm, tenancy }: EndTenancyDialogProps) {
  const [newEndDate, setNewEndDate] = useState<Date | undefined>(undefined);
  
  if (!tenancy?.tenancyStartDate || !tenancy?.tenancyEndDate) {
    return null;
  }

  const originalStartDate = new Date(tenancy.tenancyStartDate);
  const originalEndDate = new Date(tenancy.tenancyEndDate);

  const handleConfirm = () => {
    if (newEndDate) {
      onConfirm(newEndDate);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent aria-describedby="tenancy-description">
        <DialogHeader>
          <DialogTitle>End Tenancy Early</DialogTitle>
          <DialogDescription id="tenancy-description">
            Select a new, earlier end date for the tenancy of {tenancy.tenant}. This will delete any future unpaid rent records.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
            <div className="space-y-2">
                <Label>New Tenancy End Date</Label>
                <Popover>
                <PopoverTrigger asChild>
                    <Button
                    variant={"outline"}
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !newEndDate && "text-muted-foreground"
                    )}
                    >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {newEndDate ? format(newEndDate, "PPP") : <span>Pick a new end date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                    mode="single"
                    selected={newEndDate}
                    onSelect={setNewEndDate}
                    disabled={(date) =>
                        date < originalStartDate || date > originalEndDate || date > startOfDay(new Date())
                    }
                    initialFocus
                    />
                </PopoverContent>
                </Popover>
            </div>
            <Alert variant="destructive">
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                    This action cannot be undone. It will permanently remove all unpaid rent records after the selected date for this tenancy.
                </AlertDescription>
            </Alert>
        </div>
        
        <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={!newEndDate}>
                Confirm & End Tenancy
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
