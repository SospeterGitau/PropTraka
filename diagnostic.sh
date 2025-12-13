#!/bin/bash
echo "========================================="
echo "FIREBASE RENTAL APP DIAGNOSTIC"
echo "========================================="
echo ""

echo "1️⃣  NODE & NPM VERSIONS"
echo "---"
node --version
npm --version
echo ""

echo "2️⃣  PROJECT STRUCTURE"
echo "---"
echo "Files in /app directory:"
ls -la app/ | grep -E "\.tsx?|\.jsx?" || echo "No files found"
echo ""

echo "3️⃣  ENVIRONMENT VARIABLES"
echo "---"
if [ -f .env.local ]; then
    echo "✅ .env.local exists"
    echo "Contents (hiding sensitive keys):"
    cat .env.local | sed 's/=.*$/=****/'
else
    echo "❌ .env.local NOT FOUND"
fi
echo ""

echo "4️⃣  FIREBASE CONFIG"
echo "---"
if [ -f lib/firebase/config.ts ]; then
    echo "✅ Firebase config found:"
    head -20 lib/firebase/config.ts
else
    echo "❌ Firebase config not found"
fi
echo ""

echo "5️⃣  NEXT.JS BUILD FILES"
echo "---"
if [ -d .next ]; then
    echo "✅ .next directory exists"
    du -sh .next
else
    echo "⚠️  .next directory NOT found (normal if not built yet)"
fi
echo ""

echo "6️⃣  INSTALLED DEPENDENCIES"
echo "---"
echo "Firebase packages:"
npm list | grep firebase || echo "No firebase packages found"
echo ""
echo "Next.js version:"
npm list next || echo "Next.js not found"
echo ""

echo "7️⃣  NETWORK/PORT INFO"
echo "---"
echo "Is port 9002 in use?"
lsof -i :9002 2>/dev/null || echo "Port 9002 is free"
echo ""

echo "8️⃣  RECENT ERRORS (from npm output)"
echo "---"
if [ -f npm-debug.log ]; then
    echo "Last 30 lines of npm-debug.log:"
    tail -30 npm-debug.log
else
    echo "No npm-debug.log found"
fi
echo ""

echo "========================================="
echo "END DIAGNOSTIC"
echo "========================================="
