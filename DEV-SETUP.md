# Development Environment Setup

## Quick Start (ONE COMMAND)

```bash
npm run dev
```

This single command will:
1. ✅ Clean up any stuck processes
2. ✅ Start Firebase emulators (Auth on 9099, Firestore on 8080)
3. ✅ Seed test users
4. ✅ Load sample properties and tenants
5. ✅ Start Next.js on port 9002

**Credentials:**
- Email: `test-user@example.com`
- Password: `TestUserPass123!`

**URLs:**
- App: http://localhost:9002
- Emulator UI: http://localhost:4000

## What's Running

When `npm run dev` is active, you have:
- Firebase Auth Emulator (127.0.0.1:9099)
- Firebase Firestore Emulator (127.0.0.1:8080)
- Next.js Dev Server (0.0.0.0:9002)
- 2 test users created
- 2 sample properties loaded
- 1 sample tenant loaded

## Troubleshooting

### Port 9002 already in use
The cleanup script should handle this, but if it persists:
```bash
lsof -ti:9002 | xargs kill -9
npm run dev
```

### Emulators not responding
```bash
# Kill everything and restart
pkill -9 -f firebase
pkill -9 -f next-server
npm run dev
```

### No data showing after login
1. Check browser console for "DataContext" logs
2. Verify you're logged in as test-user@example.com
3. The sample data has ownerId: test-user-001 which matches the test user UID

### Performance Issues
- First page load compiles routes (30-60s is normal in dev)
- Subsequent navigation should be fast (<2s)
- Check browser console for DataContext timing logs
- Production builds are much faster

## Data Management

### Clear sample data
```bash
npm run sample-data:clear
```

### Reload sample data
```bash
npm run sample-data:load
```

## Files Changed for Emulator Setup

Key files that make this work:
- `scripts/dev-all-in-one.sh` - Main startup script
- `scripts/load-sample-data.js` - Sample data with correct ownerIds
- `scripts/seed-auth.js` - Creates test users
- `src/firebase/index.ts` - Connects to emulators (127.0.0.1 not localhost)
- `firestore.rules` - Security rules supporting sample data

## Production Deployment

None of this affects production:
- Emulator connection only activates on localhost
- Security rules work for both emulator and production
- Sample data marked with `isSampleData: true` for easy identification

## Known Issues & Solutions

1. **IPv6 Connection Issue**: Fixed by using 127.0.0.1 instead of localhost
2. **Port Conflicts**: Fixed by aggressive cleanup in startup script
3. **Empty Dashboard**: Fixed by adding ownerId to sample data
4. **Health Check Errors**: Removed pre-auth health checks
5. **Next-server processes**: Now explicitly killed in cleanup
