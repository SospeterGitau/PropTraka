
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDataContext } from '@/context/data-context';
import { ContractorForm } from '@/components/contractor-form';
import type { Contractor } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function AddContractorPage() {
  const router = useRouter();
  const { addContractor } = useDataContext();

  const handleAddContractor = async (data: Omit<Contractor, 'id'> | Contractor) => {
    try {
      await addContractor(data as Omit<Contractor, 'id'>);
      router.push('/contractors');
    } catch (error) {
      console.error("Failed to add contractor:", error);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add Contractor</h1>
          <p className="text-muted-foreground">Add a new contractor or service provider.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contractor Details</CardTitle>
          <CardDescription>
            Enter the details of the contractor below.
          </CardDescription>
        </CardHeader>
        <CardContent>
           <ContractorForm
              isOpen={true}
              onClose={handleBack}
              onSubmit={handleAddContractor}
              mode="page"
            />
        </CardContent>
      </Card>
    </div>
  );
}
