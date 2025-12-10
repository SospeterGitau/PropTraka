'use server';

import type { GenerateMarketResearchInput, GenerateMarketResearchOutput } from '@/lib/types';

export async function generateMarketResearch(input: GenerateMarketResearchInput): Promise<GenerateMarketResearchOutput> {
  return {
    report: 'Market analysis pending',
    error: null,
    hint: undefined,
  };
}
