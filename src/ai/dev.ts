
import { initializeApp, applicationDefault } from 'firebase-admin/app';

initializeApp({
    credential: applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
});

import '@/ai/flows/generate-report-summary.ts';
import '@/ai/flows/generate-pnl-report.ts';
import '@/ai/flows/generate-market-research.ts';
import '@/ai/flows/get-chat-response-flow.ts';
import '@/ai/flows/categorize-expense-flow.ts';
import '@/ai/flows/generate-reminder-email-flow.ts';
import '@/ai/flows/generate-lease-clause-flow.ts';
import '@/ai/flows/get-onboarding-pack-flow.ts';
import '@/ai/flows/generate-health-insights.ts';
import '@/ai/flows/analyze-maintenance-request.ts';
import '@/ai/flows/portfolio-assistant-chat.ts';
import '@/ai/flows/assess-tenant-risk.ts';
import '@/ai/flows/translate-locales.ts';
