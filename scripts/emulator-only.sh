#!/bin/bash
# Just start emulators - nothing else
# Keep them running until manually stopped

cd "$(dirname "$0")/.."

echo "🔥 Starting Firebase Emulators..."
echo "================================"
echo ""
echo "Press Ctrl-C to stop"
echo ""

exec firebase emulators:start --only firestore,auth --project=studio-4661291525-66fea
