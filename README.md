# PropTraka
Property management system with Firebase

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
