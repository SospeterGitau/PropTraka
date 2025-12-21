'use client';

import { useRouter } from 'next/navigation';
import { MaintenanceForm } from '@/components/maintenance-form';
import { createMaintenanceRequest } from '@/app/actions/maintenance';
import { useToast } from '@/hooks/use-toast';
import type { Property, Contractor, MaintenanceRequest } from '@/lib/types';

interface MaintenanceFormWrapperProps {
    properties: Property[];
    contractors: Contractor[];
}

export function MaintenanceFormWrapper({ properties, contractors }: MaintenanceFormWrapperProps) {
    const router = useRouter();
    const { toast } = useToast();

    const handleCreate = async (data: Omit<MaintenanceRequest, 'id'> | MaintenanceRequest) => {
        try {
            await createMaintenanceRequest(data as any);
            toast({
                title: "Success",
                description: "Maintenance request created successfully.",
            });
            router.push('/maintenance');
        } catch (error: any) {
            console.error("Failed to create maintenance request:", error);
            toast({
                variant: "destructive",
                title: "Error",
                description: error.message || "Failed to create request."
            });
        }
    };

    return (
        <MaintenanceForm
            isOpen={true}
            onClose={() => router.back()}
            onSubmit={handleCreate}
            properties={properties}
            contractors={contractors}
            mode="page"
        />
    );
}
