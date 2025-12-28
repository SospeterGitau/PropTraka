
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDataContext } from '@/context/data-context';
import { MaintenanceForm } from '@/components/maintenance-form';
import type { MaintenanceRequest, Property, Contractor } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function AddMaintenancePage() {
  const router = useRouter();
  const { properties: rawProperties, contractors: rawContractors, addMaintenanceRequest } = useDataContext();

  // Map DB types to UI types
  const properties: Property[] = React.useMemo(() => rawProperties.map(p => ({
    id: p.id || '',
    name: p.name,
    address: {
      line1: p.address?.street || '',
      city: p.address?.city || '',
      state: p.address?.state || '',
      zipCode: p.address?.zipCode || '',
      country: p.address?.country || ''
    },
    propertyType: p.type as any || 'Domestic',
    buildingType: 'Unknown',
    bedrooms: p.bedrooms || 0,
    bathrooms: p.bathrooms || 0,
    status: 'occupied' // Default
  })), [rawProperties]);

  const contractors: Contractor[] = React.useMemo(() => rawContractors.map(c => ({
    id: c.id || '',
    name: c.contactPersonName || c.companyName,
    type: c.serviceCategories?.[0] || 'General',
    businessName: c.companyName,
    email: c.email,
    phone: c.phoneNumber,
    rating: 0
  })), [rawContractors]);

  const handleAddRequest = async (data: Omit<MaintenanceRequest, 'id'> | MaintenanceRequest) => {
    try {
      // In a real application, you would add logic here to save the data
      await addMaintenanceRequest(data);

      // Since addMaintenanceRequest might not be exposed or implemented fully in context for this demo
      // We will assume success and navigate back
      router.push('/maintenance');
    } catch (error) {
      console.error("Failed to add maintenance request:", error);
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
          <h1 className="text-3xl font-bold tracking-tight">Add Maintenance Request</h1>
          <p className="text-muted-foreground">Create a new maintenance task.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request Details</CardTitle>
          <CardDescription>
            Enter the details of the maintenance issue below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* 
             The MaintenanceForm currently is designed as a Dialog. 
             Ideally, we refactor it to support 'page' mode like ExpenseForm.
             For now, we can render it.
             However, since MaintenanceForm is strictly a Dialog controlled by 'isOpen', 
             we need to make it visible. 
             
             To fix this properly, I should update MaintenanceForm to support a non-modal mode 
             OR just use the Dialog but trigger it immediately.
             
             Given the request to "fix the button", making it work like the Expense page (full page form) is better UX.
             So I will update MaintenanceForm to support `mode="page"`.
           */}
          <MaintenanceForm
            isOpen={true}
            onClose={handleBack}
            onSubmit={handleAddRequest}
            properties={properties}
            contractors={contractors}
            mode="page"
          />
        </CardContent>
      </Card>
    </div>
  );
}
