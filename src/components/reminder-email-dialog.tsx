
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Mail, Clipboard, ClipboardCheck } from 'lucide-react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

interface ReminderEmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  reminder: { subject: string; body: string } | null;
  tenantEmail?: string;
}

export function ReminderEmailDialog({ isOpen, onClose, isLoading, reminder, tenantEmail }: ReminderEmailDialogProps) {
  const { toast } = useToast();
  const [copiedBody, setCopiedBody] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);

  const handleCopy = (text: string, type: 'subject' | 'body') => {
    navigator.clipboard.writeText(text);
    if (type === 'subject') {
        setCopiedSubject(true);
        setTimeout(() => setCopiedSubject(false), 2000);
    } else {
        setCopiedBody(true);
        setTimeout(() => setCopiedBody(false), 2000);
    }
    toast({ title: `${type === 'subject' ? 'Subject' : 'Body'} copied to clipboard!` });
  };
  
  const handleSendEmail = () => {
    if (reminder && tenantEmail) {
        const mailtoLink = `mailto:${tenantEmail}?subject=${encodeURIComponent(reminder.subject)}&body=${encodeURIComponent(reminder.body)}`;
        window.location.href = mailtoLink;
    }
  }

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI-Generated Reminder</DialogTitle>
          <DialogDescription>
            A draft email has been generated for you. You can copy the content or send it directly.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {isLoading ? (
                <div className="flex flex-col items-center justify-center min-h-[200px] text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mb-4" />
                    <p>Generating reminder...</p>
                </div>
            ) : reminder ? (
                 <div className="space-y-4">
                    <div className="space-y-2 relative">
                        <Label htmlFor="subject">Subject</Label>
                        <Input id="subject" value={reminder.subject} readOnly />
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute right-1 top-6 h-8 w-8"
                            onClick={() => handleCopy(reminder.subject, 'subject')}
                        >
                            {copiedSubject ? <ClipboardCheck className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
                        </Button>
                    </div>
                    <div className="space-y-2 relative">
                        <Label htmlFor="body">Body</Label>
                        <Textarea id="body" value={reminder.body} readOnly className="h-64 resize-none" />
                        <Button
                            size="icon"
                            variant="ghost"
                            className="absolute right-1 top-6 h-8 w-8"
                            onClick={() => handleCopy(reminder.body, 'body')}
                        >
                            {copiedBody ? <ClipboardCheck className="h-4 w-4 text-green-500" /> : <Clipboard className="h-4 w-4" />}
                        </Button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center min-h-[200px] text-muted-foreground">
                    <p>Something went wrong. Could not generate reminder.</p>
                </div>
            )}
        </div>
        <DialogFooter>
            <DialogClose asChild>
                <Button variant="outline">Close</Button>
            </DialogClose>
             {reminder && tenantEmail && (
                <Button onClick={handleSendEmail}>
                    <Mail className="mr-2 h-4 w-4" />
                    Send Email
                </Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
