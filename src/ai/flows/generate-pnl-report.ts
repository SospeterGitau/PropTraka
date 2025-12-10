'use server';

import type { GeneratePnLReportInput, GeneratePnLReportOutput } from '@/lib/types';

export async function generatePnlReport(input: GeneratePnLReportInput): Promise<GeneratePnLReportOutput> {
  return {
    summary: 'P&L Report',
    revenue: 0,
    expenses: 0,
    profit: 0,
    breakdown: {},
  };
}
