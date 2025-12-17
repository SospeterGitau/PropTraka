#!/bin/bash
# Complete development environment startup
# Runs emulators in background and starts Next.js

set -e

echo "🔥 PropTraka Development Environment"
echo "===================================="
echo ""

# 1. Clean up any stuck processes
echo "🧹 Cleaning up stuck processes..."
pkill -9 -f "firebase.*emulator" 2>/dev/null || true
pkill -9 -f "next.*dev" 2>/dev/null || true
for port in 8080 9099 4400 4500 9150 9002; do
    lsof -ti:$port 2>/dev/null | xargs -r kill -9 2>/dev/null || true
done
sleep 2

# 2. Start Firebase Emulators in background
echo "🚀 Starting Firebase Emulators (background)..."
firebase emulators:start \
    --only firestore,auth \
    --project=studio-4661291525-66fea \
    > /tmp/firebase-emulator.log 2>&1 &

EMULATOR_PID=$!
echo "   Emulator PID: $EMULATOR_PID"

# Wait for emulators to be ready
echo "⏳ Waiting for emulators to start..."
for i in {1..60}; do
    if ss -ltn 2>/dev/null | grep -q ":8080" && ss -ltn 2>/dev/null | grep -q ":9099"; then
        echo ""
        echo "✅ Emulators ready!"
        sleep 2  # Extra wait for full initialization
        break
    fi
    if [ $i -eq 60 ]; then
        echo ""
        echo "❌ Emulators failed to start in 60 seconds"
        echo "Check /tmp/firebase-emulator.log for errors"
        kill $EMULATOR_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
    echo -n "."
done

# 3. Seed auth emulator
echo "🌱 Seeding Auth emulator..."
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 node scripts/seed-auth.js

# 4. Load sample data
echo "📦 Loading sample data..."
FIRESTORE_EMULATOR_HOST=localhost:8080 node scripts/load-sample-data.js

echo ""
echo "✅ Development environment ready!"
echo ""
echo "📍 Emulator UI: http://localhost:4000"
echo "📍 Auth Emulator: http://localhost:9099"
echo "📍 Firestore Emulator: http://localhost:8080"
echo ""
echo "🚀 Starting Next.js dev server on port 9002..."
echo "   (Ctrl-C to stop everything)"
echo ""

# 5. Start Next.js (foreground - will handle Ctrl-C)
trap "echo ''; echo '🛑 Stopping...'; kill $EMULATOR_PID 2>/dev/null || true; exit" INT TERM

node ./scripts/check-port.js && next dev -p 9002 --hostname 0.0.0.0
