
import {initializeApp, applicationDefault} from 'firebase-admin/app';

initializeApp({
    credential: applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
});

import '@/ai/flows/generate-report-summary.ts';
import '@/ai/flows/generate-pnl-report.ts';
import '@/ai/flows/generate-market-research.ts';
import '@/ai/flows/ask-ai-agent.ts';
