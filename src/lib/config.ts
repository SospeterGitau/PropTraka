// Only run dotenv/config in a node environment
if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
  require('dotenv/config');
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const APP_USER_EMAIL = requireEnv('APP_USER_EMAIL');
export const APP_PASSWORD = requireEnv('APP_PASSWORD');
export const SESSION_PASSWORD = requireEnv('SESSION_PASSWORD');
