'use server';

import { tenantApplicationSchema, TenantApplicationFormData } from '@/lib/schemas/tenant';
import { adminDb } from '@/firebase/admin-config';
import { assessTenantRisk } from '@/ai/flows/assess-tenant-risk';
import { revalidatePath } from 'next/cache';

export async function submitTenantApplication(data: TenantApplicationFormData) {
    try {
        // 1. Validate Input (Server-side)
        const validatedData = tenantApplicationSchema.parse(data);

        // 2. AI Risk Assessment
        const aiInput = {
            personal: {
                age: 30, // Mock age logic
                householdSize: 1
            },
            financial: {
                income: Number(validatedData.monthlyIncome),
                rentAmount: 25000,
                employmentType: validatedData.employmentType,
                mobileMoneyData: {
                    avgMonthlyIncoming: Number(validatedData.avgMpesaIncoming || 0),
                    avgMonthlyBalance: Number(validatedData.avgMpesaBalance || 0),
                    statementVerified: !!validatedData.mpesaStatementUrl,
                }
            },
            rentalHistory: {
                yearsAtCurrent: 1,
                reasonForMoving: validatedData.reasonForMoving
            },
            verificationMethod: 'MANUAL_UPLOAD' as const,
        };

        const riskResult = await assessTenantRisk(aiInput);

        // 3. Save to Firestore
        const docRef = await adminDb.collection('tenantApplications').add({
            ...validatedData,
            riskScore: riskResult.riskScore,
            riskLevel: riskResult.riskLevel,
            riskResult, // Store full AI report
            status: 'pending',
            submittedAt: new Date(),
        });

        console.log(`Application saved: ${docRef.id}`);

        revalidatePath('/dashboard/applications');

        return { success: true, riskResult, applicationId: docRef.id };

    } catch (error: any) {
        console.error('Submission Failed:', error);
        return { success: false, error: error.message };
    }
}
