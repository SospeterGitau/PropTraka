'use server';

import {generateReportSummary} from '@/ai/flows/generate-report-summary';
import {generatePnlReport as generatePnlReportFlow} from '@/ai/flows/generate-pnl-report';
import {generateMarketResearch} from '@/ai/flows/generate-market-research';
import {getChatResponse as getChatResponseFlow} from '@/ai/flows/get-chat-response-flow';
import {categorizeExpense as categorizeExpenseFlow} from '@/ai/flows/categorize-expense-flow';
import {generateReminderEmail as generateReminderEmailFlow} from '@/ai/flows/generate-reminder-email-flow';
import {generateLeaseClause as generateLeaseClauseFlow} from '@/ai/flows/generate-lease-clause-flow';
import { getOnboardingPack } from '@/ai/flows/get-onboarding-pack-flow';
import type { GenerateReportSummaryOutput, GeneratePnlReportOutput, GeneratePnlReportInput, GenerateMarketResearchInput, GenerateMarketResearchOutput, KnowledgeArticle, CategorizeExpenseInput, CategorizeExpenseOutput, GenerateReminderEmailInput, GenerateReminderEmailOutput, GenerateLeaseClauseInput, GenerateLeaseClauseOutput, GetChatResponseInput, GetChatResponseOutput } from '@/lib/types';


export async function getReportSummary(data: any): Promise<GenerateReportSummaryOutput> {
  try {
    let summary = '';

    if (data.viewMode === 'year') {
      const breakdown = data.chartData
        .map((d: any) => `- ${d.name}: Projected ${d.projected}, Actual ${d.actual}`)
        .join('\n');
      
      summary = `
Analyse the financial report for the year ${data.period}.
Overall Projected Revenue: ${data.projectedRevenue}
Overall Actual Revenue: ${data.actualRevenue}
Overall Arrears: ${data.totalArrears}

Here is the month-over-month breakdown:
${breakdown}

Comment on the overall performance for the year and highlight any months that stand out as particularly good or bad.
`;
    } else { // month view
      summary = `
Analyse the financial report for the month of ${data.period}.
Projected Revenue: ${data.projectedRevenue}
Actual Revenue: ${data.actualRevenue}
Arrears (unpaid): ${data.totalArrears}

Provide a concise analysis of this month's performance, focusing on the difference between projected and actual revenue and the significance of any arrears.
`;
    }

    const result = await generateReportSummary({ summary });
    return result;

  } catch (error) {
    console.error('Error generating report summary:', error);
    return {
      summary: 'Failed to generate summary. Please try again later.',
    };
  }
}


export async function getPnlReport(input: GeneratePnlReportInput): Promise<GeneratePnlReportOutput> {
    try {
        const result = await generatePnlReportFlow(input);
        return { report: result.report, error: null };
    } catch (e: any) {
        const msg = String(e?.message || e);
        console.error('Error generating P&L report:', msg);

        const code =
            /429|quota|RESOURCE_EXHAUSTED/i.test(msg) ? "RATE_LIMITED_OR_QUOTA" :
            /SAFETY|blocked/i.test(msg) ? "SAFETY_BLOCKED" :
            /deadline|timeout|504|UNAVAILABLE|503/i.test(msg) ? "MODEL_UNAVAILABLE_OR_TIMEOUT" :
            /invalid|400|content too long|tokens/i.test(msg) ? "INVALID_REQUEST" :
            "UNEXPECTED_ERROR";
        
        return {
            report: null,
            error: code,
            hint: msg,
        };
    }
}

export async function getMarketResearch(input: GenerateMarketResearchInput): Promise<GenerateMarketResearchOutput> {
    try {
        const result = await generateMarketResearch(input);
        return { report: result.report, error: null };
    } catch (e: any) {
        const msg = String(e?.message || e);
        console.error('Error generating market research:', msg);

        const code =
            /429|quota|RESOURCE_EXHAUSTED/i.test(msg) ? "RATE_LIMITED_OR_QUOTA" :
            /SAFETY|blocked/i.test(msg) ? "SAFETY_BLOCKED" :
            /deadline|timeout|504|UNAVAILABLE|503/i.test(msg) ? "MODEL_UNAVAILABLE_OR_TIMEOUT" :
            /invalid|400|content too long|tokens/i.test(msg) ? "INVALID_REQUEST" :
            "UNEXPECTED_ERROR";
        
        return {
            report: null,
            error: code,
            hint: msg,
        };
    }
}

export async function getChatResponse(input: GetChatResponseInput): Promise<GetChatResponseOutput> {
    try {
        // Check for keywords to trigger the onboarding flow
        const onboardingKeywords = ['onboard', 'new tenant', 'onboarding pack'];
        const userQuery = input.question.toLowerCase();

        if (onboardingKeywords.some(keyword => userQuery.includes(keyword))) {
            const result = await getOnboardingPack({ query: input.question });
            return { answer: result.checklist };
        }
        
        // If no keywords are matched, fall back to the general chat response
        const result = await getChatResponseFlow(input);
        return { answer: result.answer };
        
    } catch (e: any) {
        console.error('Error in getChatResponse action:', e);
        return { answer: "I'm sorry, I encountered an error and couldn't process your request. Please try again." };
    }
}

export async function categorizeExpense(input: CategorizeExpenseInput): Promise<CategorizeExpenseOutput> {
    try {
        const result = await categorizeExpenseFlow(input);
        return result;
    } catch (e: any) {
        console.error('Error categorizing expense:', e);
        return { category: '' };
    }
}

export async function generateReminderEmail(input: GenerateReminderEmailInput): Promise<GenerateReminderEmailOutput> {
    try {
        const result = await generateReminderEmailFlow(input);
        return result;
    } catch (e: any) {
        console.error('Error generating reminder email:', e);
        return { 
            subject: 'Overdue Rent Reminder',
            body: 'An error occurred while generating this email. Please try again.'
        };
    }
}

export async function generateLeaseClause(input: GenerateLeaseClauseInput): Promise<GenerateLeaseClauseOutput> {
    try {
        const result = await generateLeaseClauseFlow(input);
        return result;
    } catch (e: any) {
        console.error('Error generating lease clause:', e);
        return { 
            clause: 'An error occurred while generating this clause. Please check the prompt and try again. The AI may be unable to generate content for the requested topic.',
            explanation: 'Error occurred during generation'
        };
    }
}
