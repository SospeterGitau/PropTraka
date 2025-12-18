# PropTraka Project Structure

## 📁 Root Directory

```
PropTraka/
├── src/                    # Main application source code
├── scripts/                # Development and utility scripts
├── tests/                  # E2E and integration tests
├── public/                 # Static assets
├── .github/                # GitHub Actions CI/CD workflows
├── .vscode/                # VS Code workspace settings
├── functions/              # Firebase Cloud Functions
├── docs/                   # Project documentation
├── DEV-SETUP.md           # Development environment guide
├── START_HERE.md          # Quick start guide
└── .archive/              # Old/backup files (gitignored)
```

## 📂 Source Code (`src/`)

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages (signin, signup)
│   ├── (dashboard)/       # Dashboard layout and pages
│   ├── contexts/          # React contexts
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home page
│   └── globals.css        # Global styles
│
├── components/             # React components
│   ├── ui/                # Shadcn UI components
│   ├── auth/              # Auth-specific components
│   ├── dashboard/         # Dashboard components
│   └── settings/          # Settings components
│
├── context/                # Global React contexts
│   ├── data-context.tsx   # Firestore data management
│   └── theme-context.tsx  # Theme management
│
├── firebase/               # Firebase configuration
│   ├── index.ts           # Firebase initialization & emulator connection
│   ├── auth.ts            # Auth hooks and utilities
│   ├── config.ts          # Firebase config
│   └── provider.tsx       # Firebase providers
│
├── hooks/                  # Custom React hooks
│
├── lib/                    # Utility libraries
│   ├── db-types.ts        # Database canonical types
│   ├── types.ts           # UI-compatible types
│   └── utils.ts           # Utility functions
│
└── ai/                     # AI/Genkit Integration
    ├── flows/             # Defined Genkit flows (maintenance, health, etc.)
    ├── dev.ts             # Development tools for AI
    └── genkit.ts          # Genkit configuration and initialization
```

## 🔧 Scripts (`scripts/`)

**Active Scripts:**
- `dev-simple.sh` - Main development startup
- `seed-auth.js` - Auth emulator seeding
- `load-sample-data.js` - Sample data loading
- `clear-sample-data.js` - Sample data cleanup
- `export-production-data.js` - Production data export
- `import-to-emulator.js` - Data import to emulator
- `update-owner-ids.js` - Batch ownerId updates
- `write-service-account.js` - Service account helper

See [scripts/README.md](scripts/README.md) for detailed documentation.

## 🧪 Tests (`tests/`)

```
tests/
└── e2e/
    └── auth.spec.ts       # Authentication flow tests
```

## 🔥 Firebase Configuration

- `firebase.json` - Firebase project configuration
- `firestore.rules` - Firestore security rules
- `firebase.indexes.json` - Firestore indexes
- `apphosting.yaml` - Firebase App Hosting config
- `.firebaserc` - Firebase project aliases

## 📝 Configuration Files

- `next.config.ts` - Next.js configuration
- `tsconfig.json` - TypeScript configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `playwright.config.ts` - Playwright test configuration
- `package.json` - Dependencies and scripts
- `.eslintrc.json` - ESLint rules

## 🗃️ Archive (`.archive/`)

Contains old/backup files that are gitignored but preserved locally:
- `backups/` - .backup, .broken, .pre-restoration files
- `old-scripts/` - Superseded development scripts
- `logs/` - Old log files
- `old-config/` - Deprecated configuration

## 🚀 Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development environment:**
   ```bash
   npm run dev
   ```
   This starts emulators + Next.js on http://localhost:9002

3. **Login credentials:**
   - Email: `test-user@example.com`
   - Password: `TestUserPass123!`

See [DEV-SETUP.md](DEV-SETUP.md) for detailed setup instructions.

## 📚 Key Documentation

- **[DEV-SETUP.md](DEV-SETUP.md)** - Complete development environment guide
- **[START_HERE.md](START_HERE.md)** - Quick start guide
- **[scripts/README.md](scripts/README.md)** - Scripts documentation
- **[README.md](README.md)** - Project overview

## 🔑 Environment Variables

Create `.env.local` based on `.env.example`:
- `NEXT_PUBLIC_FIREBASE_*` - Firebase client config
- `SESSION_PASSWORD` - Session encryption key
- `FIREBASE_SERVICE_ACCOUNT` - Service account JSON (CI/CD)

## 🧹 Maintenance

The project uses `.archive/` for old files instead of deleting them. This folder is gitignored but available locally if needed.

To completely remove archived files:
```bash
rm -rf .archive/
```
