#!/bin/bash
# Seed data and start Next.js (run this after emulators are ready)

cd "$(dirname "$0")/.."

echo "🌱 Seeding Auth emulator..."
FIREBASE_AUTH_EMULATOR_HOST=localhost:9099 node scripts/seed-auth.js

echo ""
echo "📦 Loading sample data..."
FIRESTORE_EMULATOR_HOST=localhost:8080 GCLOUD_PROJECT=studio-4661291525-66fea node scripts/load-sample-data.js

echo ""
echo "🚀 Starting Next.js on port 9002..."
echo ""
echo "📧 Email: test-user@example.com"
echo "🔑 Password: TestUserPass123!"
echo ""

next dev -p 9002 --hostname 0.0.0.0
