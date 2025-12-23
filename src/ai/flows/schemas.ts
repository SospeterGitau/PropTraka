import { z } from 'zod';

// Portfolio Assistant Input Schema
export const PortfolioAssistantInputSchema = z.object({
    question: z.string().describe('The user\'s question about their portfolio.'),
    portfolioContext: z.string().describe('A JSON string containing relevant portfolio data (arrears, vacancies, active tenancies).'),
});

// Portfolio Assistant Output Schema
export const PortfolioAssistantOutputSchema = z.object({
    answer: z.string().describe('The AI-generated answer based on the portfolio context.'),
});
