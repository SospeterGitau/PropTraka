#!/bin/bash
# Simple startup - run this manually in one terminal, then run next dev in another

cd "$(dirname "$0")/.."

# Clean up first
pkill -9 -f "firebase.*emulator" 2>/dev/null || true
pkill -9 -f "java.*firestore" 2>/dev/null || true
for port in 8080 9099 4000 4400 4500 9150; do
    lsof -ti:$port 2>/dev/null | xargs -r kill -9 2>/dev/null || true
done

sleep 2

echo "🔥 Starting Firebase Emulators"
echo ""
echo "Keep this terminal open!"
echo "Once emulators are ready (you'll see the table), open a new terminal and run:"
echo "  npm run seed-and-dev"
echo ""

firebase emulators:start --only firestore,auth --project=studio-4661291525-66fea
