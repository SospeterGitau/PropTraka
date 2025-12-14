
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TermsAndConditionsPage() {
  const router = useRouter();
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Help Center
        </Button>
      </div>
      <h1 className="text-3xl font-bold mb-4">Terms & Conditions</h1>
      <p className="text-muted-foreground mb-6">
        Please read these Terms and Conditions carefully before using the PropTraka application. Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users and others who access or use the Service.
      </p>
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">1. Acceptance of Terms</h2>
        <p>
          By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms then you may not access the Service.
        </p>
        <h2 className="text-2xl font-semibold">2. Your Account</h2>
        <p>
          When you create an account with us, you must provide us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service.
        </p>
        <h2 className="text-2xl font-semibold">3. Intellectual Property</h2>
        <p>
          The Service and its original content, features and functionality are and will remain the exclusive property of PropTraka and its licensors.
        </p>
        <h2 className="text-2xl font-semibold">4. Links To Other Web Sites</h2>
        <p>
          Our Service may contain links to third-party web sites or services that are not owned or controlled by PropTraka.
        </p>
        <h2 className="text-2xl font-semibold">5. Termination</h2>
        <p>
          We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
        </p>
      </div>
    </div>
  );
}
