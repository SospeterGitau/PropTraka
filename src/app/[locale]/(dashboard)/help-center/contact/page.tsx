
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ContactPage() {
  const router = useRouter();
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Help Center
        </Button>
      </div>
      <h1 className="text-3xl font-bold mb-4">Contact Us</h1>
      <p className="text-muted-foreground mb-6">
        We're here to help! If you have any questions, feedback, or need support, please don't hesitate to reach out to the PropTraka team.
      </p>
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Support Channels</h2>
        <p>
          Choose the most convenient way to get in touch with us:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li><b>Email Support:</b> For general inquiries and support, email us at <a href="mailto:support@proptraka.com" className="text-primary hover:underline">support@proptraka.com</a>. We aim to respond within 24-48 hours.</li>
          <li><b>Phone Support:</b> Call our support line at +1-555-PROPTRAKA during business hours (Monday - Friday, 9 AM - 5 PM EST).</li>
          <li><b>Live Chat:</b> Access our live chat support directly from your dashboard during business hours for immediate assistance.</li>
        </ul>
        <h2 className="text-2xl font-semibold">Feedback & Suggestions</h2>
        <p>
          We are always looking to improve PropTraka. If you have any suggestions or feedback, please send them to <a href="mailto:feedback@proptraka.com" className="text-primary hover:underline">feedback@proptraka.com</a>.
        </p>
      </div>
    </div>
  );
}
