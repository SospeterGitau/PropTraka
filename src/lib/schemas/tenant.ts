import * as z from 'zod';

export const tenantApplicationSchema = z.object({
    // Step 1: Personal
    fullName: z.string().min(2, 'Full name is required'),
    idNumber: z.string().min(6, 'ID Number is required'),
    phone: z.string().min(10, 'Valid phone number is required'),
    email: z.string().email('Invalid email address'),
    nextOfKinName: z.string().min(2, 'Next of kin name is required'),
    nextOfKinRelation: z.string().min(2, 'Relation is required'),
    nextOfKinPhone: z.string().min(10, 'Next of kin phone is required'),

    // Step 2: Employment
    employmentType: z.enum(['Formal', 'Informal', 'Unemployed']),
    employerName: z.string().min(2, 'Employer/Business name is required'),
    businessNature: z.string().optional(),
    monthlyIncome: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
        message: 'Valid monthly income is required',
    }),

    // Step 3: Financials
    avgMpesaIncoming: z.string().optional(), // For informal
    avgMpesaBalance: z.string().optional(), // For informal
    mpesaStatementUrl: z.string().optional(), // Uploaded file URL

    // Step 4: History & Consent
    currentLandlordName: z.string().min(2, 'Current landlord name is required'),
    currentLandlordPhone: z.string().min(10, 'Current landlord phone is required'),
    reasonForMoving: z.string().min(5, 'Reason for moving is required'),
    gdprConsent: z.boolean().refine((val) => val === true, {
        message: 'You must consent to data processing',
    }),
});

export type TenantApplicationFormData = z.infer<typeof tenantApplicationSchema>;
