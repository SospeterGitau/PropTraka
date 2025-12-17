#!/bin/bash
# All-in-one startup that keeps emulators in foreground
# This runs everything in the right order and keeps it all running

cd "$(dirname "$0")/.."

echo "🧹 Cleanup..."
# Kill all Firebase and Next.js related processes
pkill -9 -f "firebase.*emulator" 2>/dev/null || true
pkill -9 -f "next-server" 2>/dev/null || true
pkill -9 -f "next.*dev" 2>/dev/null || true
pkill -9 -f "node.*next" 2>/dev/null || true
pkill -9 -f "java" 2>/dev/null || true

# Kill processes on specific ports
for port in 8080 9099 4000 4400 4500 9150 9002; do
    pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo "   Killing PID $pid on port $port"
        kill -9 $pid 2>/dev/null || true
    fi
done
sleep 3

# Start emulators in background with nohup
echo "🚀 Starting emulators..."
nohup firebase emulators:start --only firestore,auth --project=studio-4661291525-66fea > /tmp/firebase-emulator-output.log 2>&1 &
EMULATOR_PID=$!
echo "   Emulator PID: $EMULATOR_PID"

# Detach the emulator process from this script's process group
# This prevents signals from being forwarded to it
disown $EMULATOR_PID 2>/dev/null || true

# Wait for emulator ports
echo "⏳ Waiting for emulators..."
for i in {1..60}; do
    if ss -ltn 2>/dev/null | grep -q ":8080" && ss -ltn 2>/dev/null | grep -q ":9099"; then
        echo "✅ Emulators ready!"
        sleep 3
        break
    fi
    if [ $i -eq 60 ]; then
        echo "❌ Timeout"
        echo "Check logs: cat /tmp/firebase-emulator-output.log"
        exit 1
    fi
    sleep 1
    printf "."
done

# Seed auth
echo "🌱 Seeding auth..."
export FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
export GCLOUD_PROJECT=studio-4661291525-66fea
node scripts/seed-auth.js || {
    echo "❌ Auth seeding failed"
    kill $EMULATOR_PID 2>/dev/null || true
    exit 1
}

# Load sample data
echo "📦 Loading sample data..."
export FIRESTORE_EMULATOR_HOST=localhost:8080
node scripts/load-sample-data.js || {
    echo "❌ Sample data loading failed"
    kill $EMULATOR_PID 2>/dev/null || true
    exit 1
}

# Start Next.js
echo ""
echo "✅ Ready! Starting Next.js..."
echo ""
echo "🔗 App: http://localhost:9002"
echo "📧 Email: test-user@example.com"
echo "🔑 Password: TestUserPass123!"
echo ""

# Cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping Next.js..."
    pkill -9 -f "next-server" 2>/dev/null || true
    echo "Note: Emulators will keep running in background"
    echo "To stop emulators: pkill -9 -f firebase"
}
trap cleanup EXIT INT TERM

# Start Next.js (foreground)
next dev -p 9002 --hostname 0.0.0.0
