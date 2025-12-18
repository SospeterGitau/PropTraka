import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ requestLocale }) => {
    // This typically corresponds to the `[locale]` segment
    let locale = await requestLocale;

    // Ensure that 'locale' is a string. If not, or if invalid, default to 'en'.
    if (!locale || typeof locale !== 'string') {
        locale = 'en';
    }

    // Basic validation to ensure it matches one of our supported locales could be added here
    // but next-intl middleware usually handles this.

    return {
        locale,
        messages: (await import(`./messages/${locale}.json`)).default
    };
});
