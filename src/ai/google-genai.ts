import { ai } from './genkit';

export async function generateContent(prompt: string) {
    try {
        const { text } = await ai.generate(prompt);
        return text;
    } catch (error) {
        console.error("AI Generation Error:", error);
        throw error;
    }
}
