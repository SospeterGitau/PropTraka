# Admin Keys & Credentials

This document lists the external API keys, credentials, and environment variables required for development and production.

## 1. World ID (Worldcoin)
Required for "Proof of Personhood" verification without documents.

*   **Platform:** [Worldcoin Developer Portal](https://developer.worldcoin.org)
*   **Credentials Needed:**
    *   `NEXT_PUBLIC_WLD_APP_ID`: The App ID for your project.
    *   `NEXT_PUBLIC_WLD_ACTION`: The specific action name (e.g., "verify-tenant").

**Current Status:**
Code is currently using *placeholders* (`app_staging_...`). You must replace these in `src/components/tenant-verification.tsx` or set them in your `.env.local` file.

## 2. Firebase Storage
Required for uploading ID photos and Selfies.

*   **Platform:** Firebase Console -> Storage
*   **Requirement:** Ensure Storage is enabled and rules allow authenticated users (landlords) to upload files to `tenants/{tenantId}/documents/`.

## 3. MPESA Integration (Planned)
For "Digital Footprint" verification via transactions.

*   **Platform:** Daraja API (Safaricom)
*   **Credentials Needed:** `Consumer Key`, `Consumer Secret`.

## 4. Development Tools

### Performance Analysis
To analyze the build bundle size, run the build command with the `ANALYZE` environment variable:

```bash
ANALYZE=true npm run build -- --webpack
```
This will generate interactive visualizations of the client and server bundles.
