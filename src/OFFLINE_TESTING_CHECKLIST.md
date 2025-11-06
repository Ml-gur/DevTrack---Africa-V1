# Offline Functionality Testing Checklist

## 🎯 Complete Testing Guide for DevTrack Africa

This checklist ensures all offline features work correctly before deployment.

## Pre-Testing Setup

### 1. Environment Configuration
- [ ] `.env` file exists and contains valid Supabase credentials
- [ ] Run `npm run verify:supabase` - all checks pass
- [ ] No hardcoded credentials in source files
- [ ] `.env` is in `.gitignore`

### 2. Dependencies
- [ ] Run `npm install` successfully
- [ ] No dependency errors or warnings
- [ ] All peer dependencies satisfied

### 3. Build Verification
- [ ] Run `npm run type-check` - no TypeScript errors
- [ ] Run `npm run build` - builds successfully
- [ ] Check build output in `dist/` directory

---

## Online Functionality Tests

### Authentication
- [ ] User can sign up with new account
- [ ] User can sign in with existing account
- [ ] Session persists after page refresh
- [ ] User can sign out
- [ ] Profile data loads correctly
- [ ] Profile updates save to Supabase

### Project Management
- [ ] Create new project
- [ ] Edit existing project
- [ ] Delete project
- [ ] Projects list loads correctly
- [ ] Project details display properly
- [ ] Public projects are visible

### Task Management
- [ ] Create new task in project
- [ ] Edit task details
- [ ] Move task between Kanban columns
- [ ] Delete task
- [ ] Task timer functionality works
- [ ] Task dependencies function correctly

### Community Features
- [ ] Create new post
- [ ] View community feed
- [ ] Like/unlike posts
- [ ] Comment on posts
- [ ] Delete own posts
- [ ] Public posts visible to all

### Analytics
- [ ] Dashboard displays correct stats
- [ ] Charts render properly
- [ ] Data updates in real-time
- [ ] Project analytics accurate

---

## Offline Functionality Tests

### Service Worker
- [ ] Service worker registers on page load
- [ ] Check in DevTools → Application → Service Workers
- [ ] Status shows "activated and is running"
- [ ] Service worker updates properly

### Cache Storage
- [ ] Open DevTools → Application → Cache Storage
- [ ] `devtrack-africa-v*` cache exists
- [ ] Contains HTML, CSS, JS files
- [ ] `devtrack-runtime-v*` cache exists
- [ ] Caches update on hard refresh

### IndexedDB
- [ ] Open DevTools → Application → IndexedDB
- [ ] `devtrack_offline_sync` database exists
- [ ] `devtrack_offline_data` database exists
- [ ] `devtrack-auth-token` in localStorage

### Offline Mode - Simulation
**Method 1: Browser DevTools**
1. [ ] Open DevTools (F12)
2. [ ] Go to Network tab
3. [ ] Select "Offline" from throttling dropdown
4. [ ] Page still loads from cache
5. [ ] Navigation works
6. [ ] UI is fully functional

**Method 2: Service Worker**
1. [ ] Open DevTools → Application → Service Workers
2. [ ] Check "Offline" checkbox
3. [ ] Reload page
4. [ ] Verify functionality

### Offline Operations

**Create Operations**
- [ ] Go offline
- [ ] Create new project
- [ ] Project appears in UI immediately
- [ ] Check IndexedDB for pending operation
- [ ] Go online
- [ ] Project syncs to Supabase
- [ ] Pending operation removed from IndexedDB

**Update Operations**
- [ ] Go offline
- [ ] Edit existing project
- [ ] Changes visible immediately
- [ ] Check IndexedDB for pending operation
- [ ] Go online
- [ ] Changes sync to Supabase
- [ ] Verify in Supabase dashboard

**Delete Operations**
- [ ] Go offline
- [ ] Delete a project
- [ ] Project removed from UI
- [ ] Check IndexedDB for pending operation
- [ ] Go online
- [ ] Deletion syncs to Supabase
- [ ] Verify project deleted in database

### Data Persistence

**App Closure Test**
- [ ] Create data while offline
- [ ] Close browser tab
- [ ] Reopen application
- [ ] Data still present
- [ ] Pending operations preserved

**Browser Restart Test**
- [ ] Create data while offline
- [ ] Close entire browser
- [ ] Restart browser
- [ ] Open application
- [ ] Data and operations preserved

**Network Fluctuation Test**
- [ ] Start online
- [ ] Create project
- [ ] Go offline mid-creation
- [ ] Operation queued
- [ ] Go back online
- [ ] Operation completes

---

## PWA Installation Tests

### Desktop Installation
- [ ] Chrome: Install prompt appears
- [ ] Click install button
- [ ] App installs as standalone app
- [ ] Desktop icon created
- [ ] App opens in app window (no browser UI)
- [ ] App works offline when installed

### Mobile Installation (Android/iOS)
- [ ] Open in mobile browser
- [ ] Install prompt appears
- [ ] Add to home screen
- [ ] Home screen icon created
- [ ] App opens full-screen
- [ ] App works offline

### PWA Features
- [ ] Manifest file loads (`/site.webmanifest`)
- [ ] Icons display correctly (check all sizes)
- [ ] Theme color applied
- [ ] Splash screen shows on mobile
- [ ] App name displays correctly

---

## Synchronization Tests

### Auto-Sync on Reconnection
- [ ] Create 3 projects offline
- [ ] Go back online
- [ ] All projects sync automatically
- [ ] UI updates with server IDs
- [ ] No duplicate entries

### Manual Sync Trigger
- [ ] Use OfflineFunctionalityTester component
- [ ] Create pending operations
- [ ] Click "Sync Now" button
- [ ] Operations sync successfully
- [ ] Sync status updates

### Conflict Resolution
- [ ] Create project offline (Device A)
- [ ] Create project offline (Device B)
- [ ] Go online with Device A
- [ ] Go online with Device B
- [ ] Both projects saved (no conflicts)

### Failed Sync Handling
- [ ] Create operation with invalid data offline
- [ ] Go online
- [ ] Failed operation logged
- [ ] User notified (if implemented)
- [ ] Valid operations still sync

---

## Performance Tests

### Load Time
- [ ] First load < 3 seconds (online)
- [ ] Cached load < 1 second (offline)
- [ ] Time to Interactive < 3 seconds

### Responsiveness
- [ ] UI remains responsive during sync
- [ ] No UI blocking during large syncs
- [ ] Smooth animations and transitions

### Storage Efficiency
- [ ] Check storage usage (DevTools → Application → Storage)
- [ ] Cache size reasonable (< 50MB)
- [ ] IndexedDB size manageable
- [ ] Old data cleaned up properly

---

## Edge Cases

### Storage Quota
- [ ] Create many projects (test quota limits)
- [ ] Warning appears when approaching limit
- [ ] Graceful handling of quota exceeded
- [ ] Cleanup options available

### Session Expiry
- [ ] Wait for session to expire (or force expire)
- [ ] User redirected to login
- [ ] Pending operations preserved
- [ ] User can login and sync

### Corrupted Cache
- [ ] Manually corrupt cache (delete random files)
- [ ] App handles gracefully
- [ ] Re-caches on next load
- [ ] No critical errors

### Network Errors
- [ ] Simulate slow 3G network
- [ ] Operations still queue
- [ ] Timeout handling works
- [ ] Retry logic functions

---

## Browser Compatibility

### Chrome/Edge
- [ ] All features work
- [ ] PWA installs
- [ ] Offline mode works
- [ ] IndexedDB functions

### Firefox
- [ ] All features work
- [ ] Service worker active
- [ ] Offline mode works
- [ ] Cache functions

### Safari (Desktop/iOS)
- [ ] All features work
- [ ] Service worker registers
- [ ] Offline mode works
- [ ] Add to home screen works (iOS)

### Mobile Browsers
- [ ] Chrome Android
- [ ] Safari iOS
- [ ] Samsung Internet
- [ ] Other major browsers

---

## Security Tests

### Authentication
- [ ] Session stored securely
- [ ] Tokens not exposed in console
- [ ] Logout clears all data
- [ ] No credentials in network tab

### Data Protection
- [ ] Offline data encrypted (if configured)
- [ ] No sensitive data in cache
- [ ] RLS policies enforced
- [ ] User can only access own data

---

## Automated Testing

### Use Testing Component
1. [ ] Add OfflineFunctionalityTester to your dashboard
2. [ ] Run all automated tests
3. [ ] All tests pass (green checkmarks)
4. [ ] Review any failed tests
5. [ ] Fix issues and re-test

### Run Verification Script
```bash
npm run verify:supabase
```
- [ ] All checks pass
- [ ] No errors reported
- [ ] No warnings (or acceptable warnings)

---

## Production Readiness

### Environment Variables
- [ ] Production `.env` configured
- [ ] Variables set in hosting platform
- [ ] No dev/test values in production

### Build Optimization
- [ ] Production build tested
- [ ] Assets minified
- [ ] Source maps configured
- [ ] Bundle size acceptable

### Monitoring Setup
- [ ] Error tracking configured (optional)
- [ ] Analytics setup (optional)
- [ ] Performance monitoring (optional)

### Documentation
- [ ] User guide created
- [ ] API documentation updated
- [ ] Deployment guide ready

---

## Final Checklist

Before marking complete, ensure:

- [ ] ✅ All online features work perfectly
- [ ] ✅ All offline features work perfectly
- [ ] ✅ PWA installs on desktop and mobile
- [ ] ✅ Data syncs correctly after going online
- [ ] ✅ No console errors or warnings
- [ ] ✅ Performance is acceptable
- [ ] ✅ Security measures in place
- [ ] ✅ Documentation complete
- [ ] ✅ Team members tested on different devices
- [ ] ✅ Ready for production deployment

---

## Quick Test Script

Run this quick test to verify basic functionality:

```bash
# 1. Verify setup
npm run verify:supabase

# 2. Start dev server
npm run dev

# 3. In browser:
# - Sign in
# - Create a project
# - Go offline (DevTools → Network → Offline)
# - Edit the project
# - Create a task
# - Go online
# - Verify sync (check Supabase dashboard)
# - Install PWA
# - Test offline in PWA

# 4. If all works, build for production
npm run build

# 5. Test production build
npm run preview
```

---

## Notes

- Test on multiple browsers and devices
- Use both WiFi and mobile data
- Test on slow connections
- Document any issues found
- Re-test after fixes

## Support

If any tests fail:
1. Check browser console for errors
2. Review `SUPABASE_ENV_SETUP_GUIDE.md`
3. Use OfflineFunctionalityTester component
4. Verify environment variables
5. Check Supabase dashboard for errors

---

**Once all items are checked ✅, you're ready for production! 🚀**
