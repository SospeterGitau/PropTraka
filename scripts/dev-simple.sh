#!/bin/bash
# Super simple dev startup - just run everything

echo "🚀 Starting Development Environment"
echo ""

# Kill anything stuck
pkill -9 -f "firebase" 2>/dev/null || true
pkill -9 -f "next-server" 2>/dev/null || true
pkill -9 -f "java" 2>/dev/null || true
sleep 2

# Start emulators in dedicated terminal/background
echo "📦 Starting Firebase Emulators (background)..."
(firebase emulators:start --only firestore,auth --project=studio-4661291525-66fea > /tmp/firebase-emulator.log 2>&1) &

# Wait for ports (simpler check)
echo "⏳ Waiting for emulators..."
for i in {1..30}; do
    if curl -s http://localhost:8080 > /dev/null 2>&1 && curl -s http://localhost:9099 > /dev/null 2>&1; then
        echo "✅ Emulators ready!"
        break
    fi
    sleep 2
    echo -n "."
done

# Seed data
echo ""
echo "🌱 Seeding..."
export FIREBASE_AUTH_EMULATOR_HOST=localhost:9099
export FIRESTORE_EMULATOR_HOST=localhost:8080
export GCLOUD_PROJECT=studio-4661291525-66fea
node scripts/seed-auth.js
node scripts/load-sample-data.js

# Start Next.js
echo ""
echo "✅ Starting Next.js on http://localhost:9002"
echo "📧 test-user@example.com / TestUserPass123!"
echo ""
exec next dev -p 9002
