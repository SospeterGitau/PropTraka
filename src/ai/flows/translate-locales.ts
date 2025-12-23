import { ai } from '@/ai/genkit';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';
import { locales } from '@/i18n-config';

// Input schema: Optional list of target locales to update
const TranslateLocalesInputSchema = z.object({
    targetLocales: z.array(z.string()).optional().describe('List of specific locales to update. If omitted, updates all supported locales.'),
});

// Output schema: Summary of actions taken
const TranslateLocalesOutputSchema = z.object({
    results: z.array(z.object({
        locale: z.string(),
        status: z.string(),
        addedKeys: z.number(),
    })),
});

// Define the translation prompt
const translationPrompt = ai.definePrompt({
    name: 'translationPrompt',
    input: {
        schema: z.object({
            sourceText: z.any().describe('Dictionary of English keys and values to translate (can be nested)'),
            targetLanguage: z.string().describe('The target language code (e.g., fr, es, zh)'),
        }),
    },
    output: {
        schema: z.any().describe('Dictionary of translated keys and values'),
    },
    prompt: `You are a professional translator for a property management application called "PropTraka".
  Translate the following English UI terms into the target language "{{targetLanguage}}".

  Guidelines:
  - Maintain professional, concise tone suitable for software UI.
  - Preserve any variable placeholders (e.g., {name}).
  - Do not translate technical keys, only the values.
  
  Source Terms:
  {{json sourceText}}
  `,
});

export const translateLocalesFlow = ai.defineFlow({
    name: 'translateLocalesFlow',
    inputSchema: TranslateLocalesInputSchema,
    outputSchema: TranslateLocalesOutputSchema,
}, async (input) => {
    const rootDir = process.cwd();
    const messagesDir = path.join(rootDir, 'src', 'messages');
    const enPath = path.join(messagesDir, 'en.json');

    // Read Source (English)
    if (!fs.existsSync(enPath)) {
        throw new Error(`Source file not found at ${enPath}`);
    }
    const enMessages = JSON.parse(fs.readFileSync(enPath, 'utf-8'));

    // Helper to find missing keys in nested objects
    function findMissing(source: any, target: any): any {
        const missing: any = {};
        for (const key in source) {
            if (typeof source[key] === 'object' && source[key] !== null) {
                if (!target[key] || typeof target[key] !== 'object') {
                    missing[key] = source[key]; // Whole object missing
                } else {
                    const nestedMissing = findMissing(source[key], target[key]);
                    if (Object.keys(nestedMissing).length > 0) {
                        missing[key] = nestedMissing;
                    }
                }
            } else {
                if (target[key] === undefined) {
                    missing[key] = source[key];
                }
            }
        }
        return missing;
    }

    // Deep merge helper
    function deepMerge(target: any, source: any) {
        for (const key in source) {
            if (typeof source[key] === 'object' && source[key] !== null) {
                if (!target[key]) Object.assign(target, { [key]: {} });
                deepMerge(target[key], source[key]);
            } else {
                Object.assign(target, { [key]: source[key] });
            }
        }
        return target;
    }

    const targets = input.targetLocales || locales.filter(l => l !== 'en');
    const results = [];

    for (const locale of targets) {
        if (locale === 'en') continue;

        const localePath = path.join(messagesDir, `${locale}.json`);
        let localeMessages = {};

        if (fs.existsSync(localePath)) {
            try {
                localeMessages = JSON.parse(fs.readFileSync(localePath, 'utf-8'));
            } catch (e) {
                console.warn(`Failed to parse ${locale}.json, starting empty.`);
            }
        }

        const missing = findMissing(enMessages, localeMessages);

        if (Object.keys(missing).length === 0) {
            results.push({ locale, status: 'up-to-date', addedKeys: 0 });
            continue;
        }

        try {
            // Execute translation prompt
            const { output: translatedChunk } = await translationPrompt({
                sourceText: missing,
                targetLanguage: locale,
            });

            // Merge results
            const updatedMessages = deepMerge({ ...localeMessages }, translatedChunk);

            // Write back
            fs.writeFileSync(localePath, JSON.stringify(updatedMessages, null, 4));

            results.push({
                locale,
                status: 'updated',
                addedKeys: Object.keys(missing).length
            });

            // Rate limit safety: Sleep for 20 seconds (3 requests/minute safety margin)
            if (targets.indexOf(locale) < targets.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 20000));
            }

        } catch (error: any) {
            // Check for Rate Limit (429) or Service Unavailable (503)
            const isRateLimit = error.status === 429 ||
                (error.message && error.message.includes('429')) ||
                (error.message && error.message.includes('Quota exceeded'));

            const isServiceOverloaded = error.status === 503 ||
                (error.message && error.message.includes('503'));

            if (isRateLimit) {
                console.warn(`⚠️ Rate limit hit for ${locale}. You are moving too fast for the free tier.`);
                results.push({ locale, status: 'rate-limited', addedKeys: 0 });
            } else if (isServiceOverloaded) {
                console.warn(`⚠️ Google AI Service is temporarily overloaded (503) for ${locale}. Please try again in 1 minute.`);
                results.push({ locale, status: 'service-overloaded', addedKeys: 0 });
            } else {
                console.error(`Error translating ${locale}:`, error);
                results.push({ locale, status: 'error', addedKeys: 0 });
            }
        }
    }

    return { results };
});
