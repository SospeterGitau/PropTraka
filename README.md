# PropTraka
Property management system with Firebase

## ✨ Key Features

- **📱 Mobile-First Design**: Optimized for on-the-go management with Uber-style navigation and touch-friendly controls.
- **🌐 Multi-language Support**: Full internationalization (i18n) support for 13+ languages including English, French, Spanish, Chinese, and Swahili.
- **💳 Integrated Payments**: Native support for M-Pesa (Daraja), Airtel Money, and Pesapal for automated rent collection.
- **🚪 Tenant Portal**: Dedicated portal for tenants to view lease status, pay rent, and report maintenance issues.
- **🧠 AI Insights**: Powered by Genkit, providing portfolio health checks, diversity scoring, and predictive maintenance alerts.
- **⚖️ Risk API**: External API endpoint for calculating tenant risk scores based on financial data.
- **💰 Smart Billing**: Integrated recurring billing and trial management.
- **📊 Real-time Dashboard**: Instant financial overview, occupancy tracking, and interactive charts.
- **🔐 Role-Based Access**: Secure authentication with support for Landlords, Property Managers, and Investors.
- **✅ Production Ready**: Fully type-safe (100% TypeScript coverage) and optimized with Next.js Server Components.

## CI & Deploy

- **Local dev:** Run `npx next dev --hostname 0.0.0.0` from the repository root. If you intend to run the app under the `workspace` folder, use `npm run dev` inside `workspace`.
- **GitHub Actions:** A workflow at `.github/workflows/ci-firebase.yml` runs lint, typecheck, build, and deploys preview channels for PRs and production on `main`.
- **Secrets required:** Add `FIREBASE_SERVICE_ACCOUNT` (service account JSON) and `FIREBASE_PROJECT_ID` to your repository secrets. Generate the service account JSON in Firebase Console → Project settings → Service accounts → Generate new private key.
- **Preview channels:** PR previews are deployed to hosting channel `pr-<PR-number>`.
	- The workflow will post a comment on the PR with the preview URL once deployment completes.

**Setup checklist for reliable previews**

- Add repository secrets: `FIREBASE_SERVICE_ACCOUNT` (contents of service account JSON file) and `FIREBASE_PROJECT_ID`.
- Ensure `firebase.json` and hosting config are present at repo root (the deploy action uses them).
- Use `npm run dev:9002` locally for the same port Firebase uses.


- **Run dev on port 9002 (recommended):**
	- From repo root: `npm run dev:9002` (starts Next on port 9002 using `src/app`).
	- From `workspace`: `cd workspace && npm run dev` (workspace already runs on port 9002 by default).

If port 9002 is already in use the local script will show a helpful message and exit so you can kill the conflicting process or choose a different port.

Common commands to inspect/kill the process using the port:

```
ss -ltnp | grep :9002
lsof -i :9002
kill <PID>
```

---

## 🔁 Firebase Emulator (local testing)

We recommend using the Firebase Emulator Suite for safe local testing (no real data modified).

Prerequisites:
- `firebase-tools` available globally or via `npx` (we use `npx firebase emulators:start`).

Quickstart:
1. Start the emulator:

```bash
npm run emulator:start
```

2. In a separate terminal, seed the emulator with example data:

```bash
npm run emulator:seed
```

Notes:
- The seeding script (`scripts/seed-firestore.js` or `scripts/seed-firestore-new.js`) targets the Firestore emulator when `FIRESTORE_EMULATOR_HOST` is set.
- The emulator UI is available at http://localhost:4000 by default (the CLI prints the exact URL).
- If you need Auth emulation, run:

```bash
npm run emulator:ui
```

Safety & best practices:
- `scripts/seed-firestore-new.js` will refuse to run against a real Firestore unless you intentionally set `ALLOW_REAL_SEED=true` in your environment. This prevents accidental modifications to production data.
- Prefer using the emulator for local development and Console/Studio exploration. If you must use the Console for debugging, use a dedicated development Firebase project (not production).
- You can export/import emulator state with the provided scripts:

```bash
# Export current emulator data to ./emulator-export
npm run emulator:export

# Start the emulator and import previously exported data
npm run emulator:start:import
```

Security:
- Do not commit real service account JSON into the repository. Use `.env` (local) or GitHub secrets (CI) to pass `FIREBASE_SERVICE_ACCOUNT` or `GOOGLE_APPLICATION_CREDENTIALS` as needed.

Session cookie setup:
- The app uses `iron-session` to create a server-side session cookie. You must set `SESSION_PASSWORD` in your environment for production.
- For local development you can set `SESSION_PASSWORD` in a `.env.local` file (this repository includes `.env.example` with an example entry). The development server will use a non-production fallback and print a warning if `SESSION_PASSWORD` is missing.

Service account (admin) usage:
- For admin tasks (CI deploys, admin scripts) provide a service account JSON either via the `FIREBASE_SERVICE_ACCOUNT` environment variable (stringified JSON) or by writing a file to `.firebase/service-account.json` and setting `GOOGLE_APPLICATION_CREDENTIALS=.firebase/service-account.json`.
- To write a service account from an env secret locally: set `FIREBASE_SERVICE_ACCOUNT` and run `npm run service-account:write` (this writes `.firebase/service-account.json` and sets file mode 600). `.firebase` is in `.gitignore`.
- Do NOT commit service account JSON into source control.



---

## 🔧 CI preview deploys & secrets (notes)

For preview channel deploys (PRs) the GitHub Actions workflow expects the following secrets:
- `FIREBASE_SERVICE_ACCOUNT` (service account JSON contents)
- `FIREBASE_PROJECT_ID` (string)

This repository includes an example workflow at `.github/workflows/emulator-tests.yml` that does the following for PRs:
- Starts the Firebase emulator (Firestore & Auth)
- Seeds the emulator using `scripts/seed-firestore-new.js` (script will refuse to run against real Firestore unless `ALLOW_REAL_SEED=true`)
- Runs `npm run lint`, `npm run typecheck`, and `npm run build` to validate the change

Example steps (already included in `.github/workflows/emulator-tests.yml`):

```yaml
- name: Start Firebase emulator (background)
  run: npx firebase emulators:start --only firestore,auth &

- name: Seed Firestore emulator
  run: FIRESTORE_EMULATOR_HOST=localhost:8080 node scripts/seed-firestore-new.js

- name: Lint/typecheck/build
  run: npm run lint && npm run typecheck && npm run build
```

Notes:
- The workflow includes an example `deploy-preview` job that only runs on `main` and requires the `FIREBASE_SERVICE_ACCOUNT` secret to be present, preventing accidental deploys from feature branches.
- Always store the service account JSON in GitHub Secrets, never check it into the repository.
- The exact deploy step in this repo uses a hosting preview channel strategy; adapt as needed for your project.

---

## ▶️ Viewing the app locally (recommended)

Use the Next dev server for accurate preview (SSR and routing behave correctly and you get HMR).

- Start the dev server (recommended port):

```bash
npm run dev:9002
```

- Open in your browser:

http://localhost:9002

- VS Code convenience: use the Run panel and select **"Run Next dev and open browser"** (this uses the workspace `.vscode/launch.json` to start the dev server and open `http://localhost:9002`).

About Live Server:
- The Live Server extension serves static files and does not proxy the Next dev server. If you installed Live Server and it appears to be using the wrong port, the workspace settings file `.vscode/settings.json` sets `liveServer.settings.port = 9002` so Live Server will attempt to open that port, but you should still use `npm run dev:9002` for a faithful preview.

Port conflicts:
- If port 9002 is in use, the helper `scripts/check-port.js` will block start and display commands to find and kill the conflicting process (see earlier in this README for commands).

If you'd like, I can run the dev server locally and confirm the app loads and pages render, or I can start it and open the browser automatically using the VS Code launch configuration. Which would you prefer?
