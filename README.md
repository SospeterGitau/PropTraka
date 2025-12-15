# PropTraka
Property management system with Firebase

## CI & Deploy

- **Local dev:** Run `npx next dev --hostname 0.0.0.0` from the repository root. If you intend to run the app under the `workspace` folder, use `npm run dev` inside `workspace`.
- **GitHub Actions:** A workflow at `.github/workflows/ci-firebase.yml` runs lint, typecheck, build, and deploys preview channels for PRs and production on `main`.
- **Secrets required:** Add `FIREBASE_SERVICE_ACCOUNT` (service account JSON) and `FIREBASE_PROJECT_ID` to your repository secrets. Generate the service account JSON in Firebase Console → Project settings → Service accounts → Generate new private key.
- **Preview channels:** PR previews are deployed to hosting channel `pr-<PR-number>`.

- **Run dev on port 9002 (recommended):**
	- From repo root: `npm run dev:9002` (starts Next on port 9002 using `src/app`).
	- From `workspace`: `cd workspace && npm run dev` (workspace already runs on port 9002 by default).
