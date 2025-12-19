
'use server';

/**
 * @fileOverview Defines an AI flow that acts as a tenant onboarding assistant.
 * It uses a tool to fetch user-specific document template URLs and generates
 * a contextual checklist for the user.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { getFirebase } from '@/firebase/server-provider';
import type { UserSettings } from '@/lib/types';
import { getSession } from '@/lib/session';

// Define the input for the flow, which is just the user's query.
const OnboardingPackInputSchema = z.object({
  query: z.string().describe("The user's request to start onboarding a tenant for a property."),
});

// Define the output for the flow, which is the formatted checklist.
const OnboardingPackOutputSchema = z.object({
  checklist: z.string().describe("A formatted, multi-step checklist for the user to follow, including links to their specific document templates."),
});

/**
 * A tool that the AI can use to fetch the current user's settings.
 * This is crucial for retrieving the user-specific document template URLs.
 */
const getUserSettings = ai.defineTool(
  {
    name: 'getUserSettings',
    description: 'Retrieves the current authenticated user\'s application settings, including document template URLs.',
    inputSchema: z.object({}),
    outputSchema: z.custom<UserSettings>(),
  },
  async () => {
    const session = await getSession();
    if (!session.isLoggedIn || !session.uid) {
      throw new Error('User is not authenticated.');
    }

    const { firestore } = await getFirebase();
    const settingsDoc = await firestore.collection('userSettings').doc(session.uid).get();

    if (!settingsDoc.exists) {
      throw new Error('User settings not found.');
    }

    return settingsDoc.data() as UserSettings;
  }
);


// Define the prompt that instructs the AI on how to behave.
const onboardingPackPrompt = ai.definePrompt({
  name: 'onboardingPackPrompt',
  input: { schema: OnboardingPackInputSchema },
  output: { schema: OnboardingPackOutputSchema },
  tools: [],
  system: `You are an expert onboarding assistant for a property management app called PropTraka.
Your primary role is to guide the user through the tenant onboarding process by providing a clear, actionable checklist.

**Your Workflow:**
1.  When the user indicates they want to onboard a new tenant for a specific property, you MUST generate a response that includes a step-by-step checklist.
2.  The checklist should cover standard best practices: Sending an Application Form, Landlord Assessment, Signing the Tenancy Agreement, and completing Move-in Checklists.
3.  The response MUST be formatted in clean Markdown.

**Example User Query:** "I need to onboard a new tenant for K-Flats, Apartment 3B."

**Example AI Response:**
"Great! Here is the onboarding pack for your new tenant at K-Flats, Apartment 3B.

1.  **Application Form:** Ensure the tenant has completed your standard application form.
2.  **Landlord Assessment:** Review their details using your assessment criteria.
3.  **Tenancy Agreement:** Draft the tenancy agreement and send it for signing.
4.  **Move-in Checklist:** Schedule the move-in inspection and complete the checklist on the day.

Once signed and agreed, you can create the tenancy in PropTraka."
`,
});

// Define the main flow that orchestrates the process.
const getOnboardingPackFlow = ai.defineFlow(
  {
    name: 'getOnboardingPackFlow',
    inputSchema: OnboardingPackInputSchema,
    outputSchema: OnboardingPackOutputSchema,
  },
  async (input) => {
    const { output } = await onboardingPackPrompt(input);
    return output!;
  }
);

/**
 * This function will be integrated into the main chat assistant.
 * It's not called directly from the client but is used to determine if a user's
 * query should trigger this specific onboarding flow.
 */
export async function getOnboardingPack(input: { query: string }): Promise<{ checklist: string }> {
  return getOnboardingPackFlow(input);
}
