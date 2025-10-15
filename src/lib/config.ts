// This file is no longer used for retrieving the app password.
// Firebase handles authentication.
// The session password is now read directly from environment variables.

export const SESSION_PASSWORD = process.env.SESSION_PASSWORD || 'complex_password_at_least_32_characters_long';
