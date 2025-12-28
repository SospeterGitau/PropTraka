# Admin Keys & Credentials

**Latest Update**: Added PesaPal, Email, Session, and Firebase Admin keys.

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

## 3. PesaPal Integration (Planned)
Required for processing rent payments and tenant transactions.

*   **Platform:** [PesaPal Developer API](https://developer.pesapal.com/)
*   **Credentials Needed:**
    *   `PESAPAL_CONSUMER_KEY`: Your unique consumer key.
    *   `PESAPAL_CONSUMER_SECRET`: Your unique secret key.
    *   `PESAPAL_IPN_ID`: Instant Payment Notification ID for receiving payment callbacks.

## 4. MPESA Integration (Planned)
For "Digital Footprint" verification via transactions.

*   **Platform:** Daraja API (Safaricom)
*   **Credentials Needed:** `Consumer Key`, `Consumer Secret`.

## 5. Other Required Environment Variables

These variables must be set in your `.env.local` file for the app to function correctly.

### 🔐 Session Management
*   `SESSION_PASSWORD`: A long, random string (at least 32 chars) used to encrypt session cookies.

### 📧 Email Service (Gmail)
Used for sending invitations and notifications.
*   `GMAIL_USER`: The Gmail address used to send emails.
*   `GMAIL_APP_PASSWORD`: An App Password generated from your Google Account settings (NOT your login password).

### 🔥 Firebase Admin
*   `FIREBASE_SERVICE_ACCOUNT_KEY`: The JSON content of your Firebase Service Account key (minified). Required for server-side operations using `firebase-admin`.

### 🌐 App Configuration
*   `NEXT_PUBLIC_BASE_URL`: The public URL of your application (e.g., `http://localhost:3000` or your production domain). Used for generating invitation links.

## 6. Development Tools & Commands

A quick reference for common development tasks.

### 🚀 Start Development Server
Run the local Next.js development server:
```bash
npm run dev
```

**Start on Port 9002 (Alternative):**
Useful if port 3000 is in use or for specific Android testing configurations:
```bash
npm run dev:9002
```

### 📱 Android Development
**Open Android Project:**
This opens the `android` folder in Android Studio (if Capacitor is configured):
```bash
npx cap open android
```

**Launch Android Studio (Standalone):**
If installed manually (adjust path if necessary):
```bash
~/android-studio/bin/studio.sh
```

### 📊 Performance Analysis
To analyze the build bundle size and inspect large dependencies:
```bash
ANALYZE=true npm run build -- --webpack
```
This will generate interactive visualizations of the client and server bundles.
