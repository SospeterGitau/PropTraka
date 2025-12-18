
import * as fs from 'fs';
import * as path from 'path';

// Load .env and .env.local manually
try {
    ['.env', '.env.local'].forEach(file => {
        const envPath = path.join(process.cwd(), file);
        if (fs.existsSync(envPath)) {
            const envContent = fs.readFileSync(envPath, 'utf-8');
            envContent.split('\n').forEach(line => {
                const trimmed = line.trim();
                if (!trimmed || trimmed.startsWith('#')) return;

                const match = trimmed.match(/^([^=]+)=(.*)$/);
                if (match) {
                    const key = match[1].trim();
                    const value = match[2].trim().replace(/^["']|["']$/g, ''); // Remove quotes
                    if (!process.env[key]) {
                        process.env[key] = value;
                    }
                }
            });
        }
    });
} catch (e) {
    console.warn('Failed to load env files', e);
}
// Note: Direct invocation depends on Genkit version. 
// A safer way for a CLI script if we can't easily bootstrap the server 
// is to reuse the 'src/ai/dev.ts' setup but that starts a server.
// Alternatively, we can just call the flow function directly if we initialize Genkit.

// initializeApp is handled in '@/ai/dev.ts' but that file has side effects (imports flows).
// Let's import the necessary init parts.
import { initializeApp, applicationDefault } from 'firebase-admin/app';

// Ensure Firebase Admin is initialized
try {
    initializeApp({
        credential: applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID,
    });
} catch (e) {
    // Ignore if already initialized
}

async function main() {
    console.log('🔄 Starting AI Translation Audit...');

    try {
        // Dynamic import to ensure env vars are loaded first
        const { translateLocalesFlow } = await import('@/ai/flows/translate-locales');

        // Invoke the flow directly
        const result = await translateLocalesFlow({});

        console.log('✅ Translation Audit Complete');
        console.table(result.results);

    } catch (error) {
        console.error('❌ Error running translation flow:', error);
        process.exit(1);
    }
}

main();
