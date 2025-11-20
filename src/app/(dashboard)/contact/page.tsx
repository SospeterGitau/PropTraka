
'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Mail, Phone, MapPin } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ContactPage() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ticketId = `PPT-${Date.now()}`;
    const mailtoSubject = encodeURIComponent(`[Ticket# ${ticketId}] - ${subject}`);
    const mailtoBody = encodeURIComponent(
        `Dear PropTraka Support,\n\nI am writing to you regarding the subject: ${subject}.\n\nMy message is:\n${message}\n\nThank you,\n${name}`
    );
    
    // This will open the user's default email client
    window.location.href = `mailto:support@proptraka.app?subject=${mailtoSubject}&body=${mailtoBody}`;
  };

  return (
    <>
      <PageHeader title="Contact Us" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Send us a Message</CardTitle>
              <CardDescription>
                Have a question or feedback? Fill out the form below and we'll get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Name</Label>
                    <Input id="name" placeholder="Enter your name" value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" placeholder="Enter your email" required />
                  </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Select onValueChange={setSubject} required>
                        <SelectTrigger id="subject">
                            <SelectValue placeholder="Select a subject..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Account Access Problem">Account Access Problem</SelectItem>
                            <SelectItem value="Billing & Subscription">Billing &amp; Subscription</SelectItem>
                            <SelectItem value="Data & Reporting Question">Data &amp; Reporting Question</SelectItem>
                            <SelectItem value="Feature Request">Feature Request</SelectItem>
                            <SelectItem value="Feedback & Suggestions">Feedback &amp; Suggestions</SelectItem>
                            <SelectItem value="General Inquiry">General Inquiry</SelectItem>
                            <SelectItem value="Technical Issue / Bug Report">Technical Issue / Bug Report</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea id="message" placeholder="Your message..." className="min-h-[150px]" value={message} onChange={(e) => setMessage(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full">Send Message</Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                     <div className="flex items-start gap-4">
                        <Mail className="h-6 w-6 text-primary mt-1" />
                        <div>
                            <h3 className="font-semibold">Email</h3>
                            <a href="mailto:support@proptraka.app" className="text-sm text-muted-foreground hover:text-primary">
                                support@proptraka.app
                            </a>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <Phone className="h-6 w-6 text-primary mt-1" />
                        <div>
                            <h3 className="font-semibold">Phone</h3>
                            <p className="text-sm text-muted-foreground">+254 712 345 678</p>
                        </div>
                    </div>
                     <div className="flex items-start gap-4">
                        <MapPin className="h-6 w-6 text-primary mt-1" />
                        <div>
                            <h3 className="font-semibold">Office</h3>
                            <p className="text-sm text-muted-foreground">
                                123 Business Avenue<br />
                                Nairobi, Kenya
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
      </div>
    </>
  );
}
