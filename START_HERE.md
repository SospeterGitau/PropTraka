# 🚀 Quick Start

## Start Development (ONE COMMAND)

```bash
npm run dev
```

This automatically:
- Cleans up any stuck processes
- Starts Firebase Emulators (Auth + Firestore)
- Seeds test user and sample data
- Starts Next.js on http://localhost:9002

**Login:** `test-user@example.com` / `TestUserPass123!`

Press `Ctrl-C` to stop everything.

---

## VS Code Auto-Start

When you open this project in VS Code, it will **automatically ask** if you want to start the dev environment. Just click "Run Task" when prompted.

---

## Manual Commands (if needed)

```bash
# Start everything
npm run dev

# Start only Next.js (if emulators already running)
npm run dev:9002

# Start only emulators
npm run emulator:start
```

---

## Sample Data Management

```bash
# Load sample data (marked with isSampleData: true)
npm run sample-data:load

# Clear only sample data (keeps your real data)
npm run sample-data:clear
```

---

## Troubleshooting

**Port conflicts?** The dev script automatically cleans up stuck processes.

**Emulator not connecting?** Check firestore.rules are deployed to emulator.

**Need fresh start?** Run `npm run dev` - it handles cleanup automatically.
