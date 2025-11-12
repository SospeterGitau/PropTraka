
'use server';

import {generateReportSummary} from '@/ai/flows/generate-report-summary';
import {generatePnlReport as generatePnlReportFlow} from '@/ai/flows/generate-pnl-report';
import {generateMarketResearch} from '@/ai/flows/generate-market-research';
import type { GenerateReportSummaryOutput, GeneratePnlReportOutput, GeneratePnlReportInput, GenerateMarketResearchInput, GenerateMarketResearchOutput } from '@/lib/types';


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


export async function getPnlReport(input: Omit<GeneratePnlReportInput, 'isResident' | 'isNonResident'>): Promise<GeneratePnlReportOutput> {
    try {
        const result = await generatePnlReportFlow(input as GeneratePnlReportInput);
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
