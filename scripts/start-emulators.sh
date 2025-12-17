#!/bin/bash
# Robust Firebase Emulator startup script
# Automatically cleans up stuck processes and starts fresh

set -e

PROJECT_ID="studio-4661291525-66fea"
EMULATOR_PORTS=(8080 9099 4400 4500 9150)

echo "🧹 Cleaning up any existing emulator processes..."

# Kill any Firebase CLI processes
pkill -9 -f "firebase.*emulator" 2>/dev/null || true

# Kill Java processes (Firestore emulator)
for port in "${EMULATOR_PORTS[@]}"; do
    lsof -ti:$port 2>/dev/null | xargs -r kill -9 2>/dev/null || true
done

echo "✅ Cleanup complete"
sleep 2

echo "🚀 Starting Firebase Emulators..."
echo ""

# Start emulators
firebase emulators:start \
    --only firestore,auth \
    --project=$PROJECT_ID

# Note: This will run until you press Ctrl-C
