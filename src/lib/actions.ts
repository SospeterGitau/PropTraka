'use server';

import {generateReportSummary, type GenerateReportSummaryOutput} from '@/ai/flows/generate-report-summary';

export async function getReportSummary(data: any): Promise<GenerateReportSummaryOutput> {
  try {
    let summary = '';

    if (data.viewMode === 'year') {
      const breakdown = data.chartData
        .map((d: any) => `- ${d.name}: Projected ${d.projected}, Actual ${d.actual}`)
        .join('\n');
      
      summary = `
Analyze the financial report for the year ${data.period}.
Overall Projected Revenue: ${data.projectedRevenue}
Overall Actual Revenue: ${data.actualRevenue}
Overall Arrears: ${data.totalArrears}

Here is the month-over-month breakdown:
${breakdown}

Comment on the overall performance for the year and highlight any months that stand out as particularly good or bad.
`;
    } else { // month view
      summary = `
Analyze the financial report for the month of ${data.period}.
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
