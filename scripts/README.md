# Scripts Directory

This folder contains utility scripts for development and data management.

## Development Scripts

### `dev-simple.sh` 
**Main development startup script**
- Starts Firebase emulators (Auth + Firestore)
- Seeds test users and sample data
- Starts Next.js dev server on port 9002
- **Usage:** `npm run dev`

## Data Management Scripts

### `seed-auth.js`
Seeds Firebase Auth emulator with test users:
- `test-user@example.com` / `TestUserPass123!` (UID: test-user-001)
- `owner@example.com` / `OwnerPass123!` (UID: 5kalINQOGmY5KvabpGfTD2Kxfu03)

**Usage:** 
```bash
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 node scripts/seed-auth.js
```

### `load-sample-data.js`
Loads sample properties and tenants marked with `isSampleData: true`
- Creates 2 sample properties (Westlands, Karen)
- Creates 1 sample tenant
- All owned by test-user-001

**Usage:**
```bash
FIRESTORE_EMULATOR_HOST=localhost:8080 node scripts/load-sample-data.js
# Or via npm: npm run sample-data:load
```

### `clear-sample-data.js`
Removes all documents marked with `isSampleData: true`

**Usage:**
```bash
npm run sample-data:clear
```

### `write-service-account.js`
Writes service account JSON from environment variable to file.
Used in CI/CD pipelines.

**Usage:**
```bash
FIREBASE_SERVICE_ACCOUNT='<json>' node scripts/write-service-account.js
```

### `update-translations.ts`
**AI Translation Automation**
- Audits translation files for missing keys.
- Uses Genkit + Gemini to auto-translate content from `en.json`.
- Requires `GOOGLE_API_KEY` or `GEMINI_API_KEY` in `.env.local` (or environment).

**Usage:**
```bash
npm run i18n:update
```

## Production Data Scripts

⚠️ **Use with caution - these interact with production Firestore**

### `export-production-data.js`
Exports all data from production Firestore to JSON file.
Requires `GOOGLE_APPLICATION_CREDENTIALS` environment variable.

### `import-to-emulator.js`
Imports previously exported data into emulator.

### `update-owner-ids.js`
Batch updates ownerId field on all documents.
Useful for migrating data between users.

## Quick Reference

```bash
# Start everything
npm run dev

# Manage sample data
npm run sample-data:load
npm run sample-data:clear

# Individual operations (if needed)
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 node scripts/seed-auth.js
FIRESTORE_EMULATOR_HOST=localhost:8080 node scripts/load-sample-data.js
```

## Environment Variables

- `FIREBASE_AUTH_EMULATOR_HOST` - Auth emulator address (e.g., localhost:9099)
- `FIRESTORE_EMULATOR_HOST` - Firestore emulator address (e.g., localhost:8080)
- `GCLOUD_PROJECT` - Google Cloud project ID
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to service account JSON (production only)
- `ALLOW_REAL_SEED` - Set to "true" to allow seeding production (NOT RECOMMENDED)
