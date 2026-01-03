# Admin Keys & Credentials

**Latest Update**: Added Intasend, Email, Session, and Firebase Admin keys.

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

**Status:** ✅ **Active / Secure**
*   **Authentication Required:** Yes.
*   **Rules Structure:**
    *   `/users/{userId}/profile/*` (Public Read, Owner Write) - Max 5MB images.
    *   `/users/{userId}/properties/*` (Public Read, Owner Write) - Max 10MB images.
    *   `/users/{userId}/documents/*` (Private Read/Write) - Secure storage for sensitive files.


## 3. Intasend Integration (Planned)

*   **Platform:** [Intasend](https://intasend.com/)
*   **Keys Required:**
    *   `INTASEND_PUBLIC_KEY`: Your publishable key for frontend/verifications.
    *   `INTASEND_SECRET_KEY`: Your secret key for backend API calls.
    *   `INTASEND_TEST_MODE`: Set to `true` for sandbox, `false` for live.


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
### 🔥 Firebase Admin
*   **Method A (Local):** Place `serviceAccountKey.json` in the project root. (Already ignored in `.gitignore`).
*   **Method B (Production):** Set `FIREBASE_SERVICE_ACCOUNT_KEY` environment variable with the minified JSON content.


### 🌐 App Configuration
*   `NEXT_PUBLIC_BASE_URL`: The public URL of your application (e.g., `http://localhost:3000` or your production domain).
    *   **Mobile Testing:** Set this to your local IP (e.g., `http://192.168.100.13:9002`) to ensure redirects work on your phone.


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
