'use server';

import { generateContent } from '@/ai/google-genai';

export async function generateBusinessPlan(context: any) {
    try {
        const prompt = `
      Act as a world-class business strategist and startup consultant. 
      Create a comprehensive Business Plan for "PropTraka", a Property Management SaaS platform focused on the African market (Kenya specifically).

      Context provided by user: ${context.additionalContext || 'None'}

      The plan should be formatted in Markdown and cover the following sections in detail:

      # 1. Executive Summary
      - Brief overview of PropTraka (AI-powered, mobile-first, targeting landlords/property managers).
      - Mission Statement.
      - Core Value Proposition (Power Law: solving the 20% of problems that cause 80% of headaches).

      # 2. Market Analysis
      - Target Market: Small to Medium Landlords in Kenya/East Africa.
      - Creating a "Blue Ocean": How PropTraka differs from legacy, clunky desktop software.
      - Key Trends: Mobile adoption, digital payments (M-Pesa), need for data-driven decisions.

      # 3. Product Strategy
      - Core Features: Tenant Risk Score (Fat Tail Analysis), Virtualized Lists (Performance), AI Assistant.
      - Roadmap Highlights: Mobile App, Tenant Portal, automated payment reconciliation.

      # 4. Monetization Model
      - Freemium -> Starter -> Pro tiers.
      - Pricing Strategy (localized for Kenya).

      # 5. Go-to-Market Strategy
      - Channels: Digital marketing, partnerships with Saccos/Banks.
      - Growth Loops: Tenant invitations, referral programs.

      # 6. Financial Projections (Narrative)
      - Key Drivers: User acquisition cost vs LTV.
      - Scalability: Low marginal cost of serving new users.

      Make the tone professional, persuasive, and visionary. Use bolding and bullet points effectively.
    `;

        const plan = await generateContent(prompt);
        return { plan };
    } catch (error) {
        console.error("Error generating business plan:", error);
        return { error: "Failed to generate business plan. Please try again." };
    }
}
