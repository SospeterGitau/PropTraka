
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TipsPage() {
  const router = useRouter();
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Help Center
        </Button>
      </div>
      <h1 className="text-3xl font-bold mb-4">Tips & Best Practices</h1>
      <p className="text-muted-foreground mb-6">
        Maximize your efficiency with PropTraka! This section offers valuable tips, tricks, and best practices to help you get the most out of our property management platform.
      </p>
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Optimizing Property Listings</h2>
        <p>
          Learn how to create compelling property listings that attract more tenants and minimize vacancy periods.
        </p>
        <h2 className="text-2xl font-semibold">Streamlining Communication</h2>
        <p>
          Discover effective strategies for communicating with your tenants and contractors to ensure smooth operations.
        </p>
        <h2 className="text-2xl font-semibold">Automating Tasks</h2>
        <p>
          Explore how to automate routine tasks within PropTraka to save time and reduce manual effort.
        </p>
      </div>
    </div>
  );
}
