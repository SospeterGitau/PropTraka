'use server';

import {generateReportSummary, type GenerateReportSummaryOutput} from '@/ai/flows/generate-report-summary';
import { formatCurrency } from './utils';

export async function getReportSummary(data: any): Promise<GenerateReportSummaryOutput> {
  try {
    const chartDataSummary = data.viewMode === 'year'
      ? `The data is broken down by month: ${data.chartData.map((d: any) => `${d.name} (Projected: ${formatCurrency(d.projected)}, Actual: ${formatCurrency(d.actual)})`).join(', ')}.`
      : '';

    const summary = `
- Report Period: ${data.period}
- View Mode: ${data.viewMode}
- Projected Revenue: ${formatCurrency(data.projectedRevenue)}
- Actual Revenue: ${formatCurrency(data.actualRevenue)}
- Total Arrears: ${formatCurrency(data.totalArrears)}
- Breakdown: ${chartDataSummary}
`;
    const result = await generateReportSummary({ summary });
    return result;

  } catch (error) {
    console.error('Error generating report summary:', error);
    return {
      summary: 'Failed to generate summary. Please try again later.',
    };
  }
}
