'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useUser } from '@/firebase/auth';
import { firestore } from '@/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';

export default function ContactSupportPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    category: '',
    priority: '',
    subject: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!formData.category || !formData.priority || !formData.subject || !formData.description) {
      setError('Please fill in all fields.');
      setIsLoading(false);
      return;
    }

    try {
      await addDoc(collection(firestore, 'support_tickets'), {
        ...formData,
        status: 'open',
        userId: user?.uid || 'anonymous',
        userEmail: user?.email || 'anonymous',
        timestamp: serverTimestamp(),
      });
      setSuccess(true);
      setFormData({ category: '', priority: '', subject: '', description: '' });
    } catch (err) {
      console.error('Error submitting ticket:', err);
      setError('Failed to submit ticket. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full text-center p-6">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-16 w-16 text-green-500" />
          </div>
          <CardTitle className="text-2xl mb-2">Ticket Submitted!</CardTitle>
          <CardDescription className="mb-6">
            Thank you for your feedback. We have received your request and will get back to you shortly.
          </CardDescription>
          <Button onClick={() => router.push('/help-center')}>Return to Help Center</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Button variant="ghost" onClick={() => router.back()} className="mb-6">
        <ArrowLeft className="h-5 w-5 mr-2" />
        Back to Help Center
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Contact Support</CardTitle>
          <CardDescription>
            Submit a bug report, feature request, or ask a general question. We're here to help!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, category: val }))}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select one" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bug">Report a Bug</SelectItem>
                    <SelectItem value="feature_request">Feature Request</SelectItem>
                    <SelectItem value="account">Account Issue</SelectItem>
                    <SelectItem value="billing">Billing & Payments</SelectItem>
                    <SelectItem value="other">General Question</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(val) => setFormData(prev => ({ ...prev, priority: val }))}
                >
                  <SelectTrigger id="priority">
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low - Just asking</SelectItem>
                    <SelectItem value="medium">Medium - Need help soon</SelectItem>
                    <SelectItem value="high">High - I'm blocked</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Brief summary of the issue"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Please describe your issue in detail..."
                className="min-h-[150px]"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            {error && (
              <div className="text-red-500 text-sm flex items-center gap-2 bg-red-50 p-3 rounded-md">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Submitting...' : 'Submit Ticket'}
              {!isLoading && <Send className="ml-2 h-4 w-4" />}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
