# Sync Debug Guide

## Critical Fixes Applied (2025-12-04)

### Problem #1: Duplicate Settings Records
**Root Cause:** `saveUserSettings()` was creating NEW records with timestamp IDs
```javascript
// BEFORE (WRONG)
id: `settings-${userId}-${Date.now()}` // Creates new record every time!

// AFTER (CORRECT)
id: `settings-${userId}` // Updates same record
```

### Problem #2: lastUpdated Not Set on Changes
**Root Cause:** Most setters (setUserLevel, setRegion, etc.) didn't update lastUpdated
```javascript
// BEFORE (WRONG)
setUserLevel: (userLevel) => set({ userLevel }) // No timestamp!

// AFTER (CORRECT)
// Wrapped ALL set() calls to auto-add lastUpdated
const set = (update) => originalSet({ ...update, lastUpdated: Date.now() })
```

## How Auto-Sync Works

1. **Automatic Sync:** Every 5 minutes (`main.jsx:scheduleAutoSync(5 * 60 * 1000)`)
2. **Manual Sync:** Call `window.debugSync()` in console
3. **On Login:** Sync happens immediately after Google login

## Testing Steps

### In Production (Vercel + Render)

**Device 1:**
1. Go to https://verb-os.vercel.app
2. Login with Google
3. Complete placement test → Result: C1
4. **WAIT 5 MINUTES** (or trigger manual sync in console: `window.cloudSync.sync()`)
5. Check sync status: `window.debugSync()`

**Device 2:**
1. Go to https://verb-os.vercel.app
2. Login with SAME Google account
3. Level should show C1 (might take up to 5 min for next auto-sync)
4. To force immediate sync: `window.cloudSync.sync()`

### Manual Sync Testing

```javascript
// In browser console:

// 1. Check current settings
const settings = useSettings.getState()
console.log('Current level:', settings.userLevel)
console.log('Last updated:', new Date(settings.lastUpdated))

// 2. Force immediate sync
await window.cloudSync.sync()

// 3. Check sync status
window.debugSync()

// 4. Check IndexedDB
const db = await indexedDB.open('SpanishConjugatorProgress')
const tx = db.transaction('user_settings', 'readonly')
const all = await tx.objectStore('user_settings').getAll()
console.log('Settings in IndexedDB:', all)
// Should see ONLY ONE record per userId (not multiple with timestamps)
```

## Verifying Fixes Deployed

### Frontend (Vercel)
- Auto-deploys from GitHub main branch
- Check: https://verb-os.vercel.app
- Latest commit should be: "fix: CRITICAL fixes for settings sync"

### Backend (Render)
- May need manual redeploy
- Check: https://conju.onrender.com/api/health (or similar endpoint)
- Verify database schema has `updated_at` on events table

## Common Issues

### "Settings still not syncing"
1. Clear browser data on BOTH devices:
   ```javascript
   localStorage.clear()
   indexedDB.deleteDatabase('SpanishConjugatorProgress')
   location.reload()
   ```
2. Login again
3. Wait for auto-sync (5 min) or trigger manually

### "Multiple settings records in IndexedDB"
- Old data from before the fix
- Clear IndexedDB and re-login

### "Sync works but takes too long"
- Auto-sync interval is 5 minutes
- Use manual sync for testing: `window.cloudSync.sync()`

## Files Modified

### Critical Fixes:
- `src/lib/progress/database.js` - Fixed saveUserSettings() to use consistent ID
- `src/state/settings.js` - Wrapped set() to auto-add lastUpdated

### Previous Implementation:
- `src/lib/progress/dataMerger.js` - Timestamp-based merge logic
- `src/lib/progress/cloudSync.js` - Added settings/challenges/events to default sync
- `server/src/db.js` - Added updated_at to events table
- `server/src/auth-service.js` - Server-side conflict resolution

## Expected Behavior

✅ **Correct:**
- ONE settings record per user in IndexedDB
- Every settings change updates `lastUpdated`
- Auto-sync every 5 minutes
- Manual sync available via console
- Last-write-wins conflict resolution

❌ **Incorrect (Old Behavior):**
- Multiple settings records with timestamps
- Settings changes without lastUpdated
- Settings not included in default sync
- No conflict resolution

## Deployment Checklist

- [x] Code committed to GitHub
- [x] Changes pushed to main branch
- [ ] Verify Vercel deployed latest commit
- [ ] Verify Render backend has latest code
- [ ] Test on production: Device 1 → Device 2 sync
- [ ] Check browser console for errors
- [ ] Verify IndexedDB has single settings record per user
