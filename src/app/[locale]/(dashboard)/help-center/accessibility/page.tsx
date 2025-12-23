
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AccessibilityPage() {
  const router = useRouter();
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Help Center
        </Button>
      </div>
      <h1 className="text-3xl font-bold mb-4">Accessibility Statement</h1>
      <p className="text-muted-foreground mb-6">
        PropTraka is committed to ensuring digital accessibility for people with disabilities. We are continually improving the user experience for everyone and applying the relevant accessibility standards.
      </p>
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Our Commitment</h2>
        <p>
          We aim to provide a website and application that is accessible to the widest possible audience, regardless of technology or ability. We are actively working to increase the accessibility and usability of our website and in doing so adhere to many of the available standards and guidelines.
        </p>
        <h2 className="text-2xl font-semibold">Measures to Support Accessibility</h2>
        <p>
          PropTraka takes the following measures to ensure accessibility:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Include accessibility throughout our internal policies.</li>
          <li>Provide continual accessibility training for our staff.</li>
          <li>Employ clear and consistent navigation.</li>
          <li>Ensure sufficient color contrast.</li>
          <li>Provide text alternatives for non-text content.</li>
        </ul>
        <h2 className="text-2xl font-semibold">Feedback</h2>
        <p>
          We welcome your feedback on the accessibility of PropTraka. Please let us know if you encounter accessibility barriers:
        </p>
        <ul className="list-disc pl-5 mt-2 space-y-1">
          <li>Email: support@proptraka.com</li>
          <li>Phone: +1-555-PROPTRAKA</li>
        </ul>
      </div>
    </div>
  );
}
