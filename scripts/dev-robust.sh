#!/bin/bash
# Robust development environment with emulator watchdog

set -e

echo "🔥 PropTraka Dev Environment (Robust Mode)"
echo "=========================================="
echo ""

# 1. Clean up
echo "🧹 Cleaning up stuck processes..."
pkill -9 -f "firebase.*emulator" 2>/dev/null || true
pkill -9 -f "next.*dev" 2>/dev/null || true
pkill -9 -f "java.*firestore" 2>/dev/null || true
for port in 8080 9099 4000 4400 4500 9150 9002; do
    lsof -ti:$port 2>/dev/null | xargs -r kill -9 2>/dev/null || true
done
sleep 3

# 2. Start Firebase Emulators
echo "🚀 Starting Firebase Emulators..."
firebase emulators:start \
    --only firestore,auth \
    --project=studio-4661291525-66fea \
    > /tmp/firebase-emulator.log 2>&1 &

EMULATOR_PID=$!
echo "$EMULATOR_PID" > /tmp/firebase-emulator.pid
echo "   PID: $EMULATOR_PID"

# 3. Wait for emulators
echo "⏳ Waiting for emulators..."
for i in {1..60}; do
    # Check if process is still alive
    if ! kill -0 $EMULATOR_PID 2>/dev/null; then
        echo ""
        echo "❌ Emulator process died!"
        tail -30 /tmp/firebase-emulator.log
        exit 1
    fi
    
    # Check if ports are ready
    if ss -ltn 2>/dev/null | grep -q ":8080" && ss -ltn 2>/dev/null | grep -q ":9099"; then
        echo ""
        echo "✅ Emulators ready!"
        sleep 3
        break
    fi
    
    if [ $i -eq 60 ]; then
        echo ""
        echo "❌ Timeout waiting for emulators"
        echo "Last 30 lines of log:"
        tail -30 /tmp/firebase-emulator.log
        kill $EMULATOR_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
    echo -n "."
done

# 4. Seed data
echo "🌱 Seeding Auth..."
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 node scripts/seed-auth.js || {
    echo "❌ Auth seeding failed"
    kill $EMULATOR_PID 2>/dev/null || true
    exit 1
}

echo "📦 Loading sample data..."
FIRESTORE_EMULATOR_HOST=localhost:8080 node scripts/load-sample-data.js || {
    echo "❌ Sample data loading failed"
    kill $EMULATOR_PID 2>/dev/null || true
    exit 1
}

# 5. Start emulator watchdog
(
    while true; do
        sleep 10
        if [ -f /tmp/firebase-emulator.pid ]; then
            PID=$(cat /tmp/firebase-emulator.pid)
            if ! kill -0 $PID 2>/dev/null; then
                echo ""
                echo "⚠️  EMULATOR CRASHED! Logs:"
                tail -20 /tmp/firebase-emulator.log
                echo ""
                echo "🔄 Restart with: npm run dev"
                # Kill Next.js to force full restart
                pkill -9 -f "next.*dev" 2>/dev/null || true
                exit 1
            fi
            
            # Verify ports are still listening
            if ! ss -ltn 2>/dev/null | grep -q ":8080" || ! ss -ltn 2>/dev/null | grep -q ":9099"; then
                echo ""
                echo "⚠️  EMULATOR PORTS DIED!"
                kill $PID 2>/dev/null || true
                pkill -9 -f "next.*dev" 2>/dev/null || true
                exit 1
            fi
        fi
    done
) &
WATCHDOG_PID=$!

# 6. Cleanup handler
cleanup() {
    echo ""
    echo "🛑 Stopping all services..."
    kill $EMULATOR_PID 2>/dev/null || true
    kill $WATCHDOG_PID 2>/dev/null || true
    pkill -P $$ 2>/dev/null || true
    rm -f /tmp/firebase-emulator.pid
}

trap cleanup INT TERM EXIT

# 7. Start Next.js
echo ""
echo "✅ Ready! Starting Next.js..."
echo ""
echo "🔗 App: http://localhost:9002"
echo "🔗 Emulator UI: http://localhost:4000"
echo ""
echo "📧 Email: test-user@example.com"
echo "🔑 Password: TestUserPass123!"
echo ""
echo "⚠️  Keep this terminal open!"
echo ""

next dev -p 9002 --hostname 0.0.0.0
