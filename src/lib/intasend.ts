export const INTASEND_PUBLIC_KEY = process.env.NEXT_PUBLIC_INTASEND_PUBLIC_KEY;
export const INTASEND_TEST_MODE = process.env.NEXT_PUBLIC_INTASEND_TEST_MODE === 'true';

export const getIntasendConfig = () => {
    if (!INTASEND_PUBLIC_KEY) {
        console.warn('INTASEND_PUBLIC_KEY is not set');
    }

    return {
        publicKey: INTASEND_PUBLIC_KEY,
        live: !INTASEND_TEST_MODE,
    };
};

/**
 * Common currency options supported by Intasend
 */
export const SUPPORTED_CURRENCIES = ['KES', 'USD', 'EUR', 'GBP'];

/**
 * Helper to check if a currency is supported
 */
export const isSupportedCurrency = (currency: string) => {
    return SUPPORTED_CURRENCIES.includes(currency);
};
