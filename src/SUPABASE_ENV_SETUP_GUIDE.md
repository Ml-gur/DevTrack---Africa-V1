# Supabase Environment Setup Guide

## ✅ Complete Migration Summary

DevTrack Africa has been **fully migrated to Supabase** with environment variable configuration. All local storage dependencies have been removed, and the application now uses Supabase for all data persistence with comprehensive offline functionality.

## 🔧 Environment Configuration

### Step 1: Configure Environment Variables

1. **Locate the `.env` file** in the root directory (already created)
2. **Update with your Supabase credentials** (currently using your existing project):

```env
# Your Current Configuration
VITE_SUPABASE_PROJECT_ID=tfivuvjlvrfeofcpxzde
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Server Function Configuration  
VITE_SERVER_FUNCTION_NAME=make-server-3e6b72d9

# Feature Flags
VITE_ENABLE_OFFLINE=true
VITE_ENABLE_PWA=true
VITE_ENABLE_ANALYTICS=true
```

### Step 2: Get Your Supabase Credentials

If you need to change to a different Supabase project:

1. Go to: https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** → **API**
4. Copy:
   - **Project ID** (from the URL or API settings)
   - **anon/public** key (under "Project API keys")
5. Update your `.env` file

### Step 3: Verify Configuration

The application will automatically validate your configuration on startup. Check the browser console for:

```
🔧 Supabase Configuration:
  Project ID: your_project_id
  Supabase URL: https://your_project_id.supabase.co
  Using env vars: true
  Features: { offlineMode: true, pwa: true, analytics: true }
```

## 📊 What Changed

### Removed ❌

- ~~All local storage database operations~~
- ~~LocalDatabase service~~
- ~~Local-only authentication~~
- ~~Hardcoded credentials~~
- ~~localStorage for data persistence~~

### Added ✅

1. **Environment Variable Configuration**
   - `/lib/supabaseClient.ts` - Updated to use env vars
   - `/utils/supabase/config.ts` - Centralized config
   - `/.env` - Your credentials (DO NOT commit)
   - `/.env.example` - Template for other developers

2. **Offline Functionality**
   - `/utils/offline-sync-manager.ts` - Manages offline operations
   - `/utils/offline-database-wrapper.ts` - Offline-first database wrapper
   - Service Worker with cache-first strategy
   - IndexedDB for offline data caching
   - Automatic sync when online

3. **Testing Components**
   - `/components/OfflineFunctionalityTester.tsx` - Comprehensive testing

## 🚀 How It Works

### Online Mode
1. All operations go directly to Supabase
2. Data is cached in IndexedDB for offline access
3. Real-time updates via Supabase Realtime
4. Immediate synchronization

### Offline Mode
1. Operations are stored in IndexedDB
2. UI updates immediately with cached data
3. Operations are queued for synchronization
4. When back online, automatic sync occurs

### Data Flow

```
User Action
    ↓
Offline Database Wrapper
    ↓
Online? → Yes → Supabase → Cache in IndexedDB
    ↓
    No → Save to IndexedDB → Queue for Sync
    ↓
Back Online → Sync Manager → Supabase
```

## 🧪 Testing Offline Functionality

### Method 1: Use the Testing Component

Add this route to your app to access the tester:

```tsx
// In your dashboard or settings page
import OfflineFunctionalityTester from './components/OfflineFunctionalityTester'

// Add as a route or tab
<OfflineFunctionalityTester />
```

### Method 2: Manual Testing

1. **Test Offline Mode:**
   ```
   1. Open DevTools (F12)
   2. Go to Network tab
   3. Select "Offline" from the throttling dropdown
   4. Try creating/editing projects
   5. Go back "Online"
   6. Verify data syncs to Supabase
   ```

2. **Test Service Worker:**
   ```
   1. Open DevTools → Application tab
   2. Go to Service Workers
   3. Verify "devtrack-africa" is active
   4. Check Cache Storage for cached assets
   ```

3. **Test IndexedDB:**
   ```
   1. Open DevTools → Application tab
   2. Go to IndexedDB
   3. You should see:
      - devtrack_offline_sync (pending operations)
      - devtrack_offline_data (cached data)
      - devtrack-auth-token (authentication)
   ```

### Method 3: Automated Test Suite

Run the comprehensive test suite:

```bash
npm run test
```

## 📱 PWA Features

The application is a full Progressive Web App:

### Install on Desktop/Mobile
1. Open the app in a browser
2. Look for the install prompt or
3. Browser menu → "Install DevTrack Africa"
4. App will work offline after installation

### Service Worker Features
- ✅ Offline page loading
- ✅ Asset caching
- ✅ Runtime caching
- ✅ Background sync
- ✅ Push notifications (ready)

## 🔒 Security

### What's Safe
- `.env` file (ignored by git)
- Anon key in client code (Supabase design)
- Row Level Security (RLS) on Supabase

### What to Protect
- Never commit `.env` to git ✓ (added to .gitignore)
- Never share service role key (not used in client)
- Keep your Supabase dashboard password secure

## 🌍 Deployment

### Vercel/Netlify
1. Add environment variables in dashboard:
   ```
   VITE_SUPABASE_PROJECT_ID=your_project_id
   VITE_SUPABASE_ANON_KEY=your_anon_key
   VITE_SERVER_FUNCTION_NAME=make-server-3e6b72d9
   ```

2. Deploy normally:
   ```bash
   vercel deploy
   # or
   netlify deploy
   ```

### Other Platforms
Set the same environment variables in your platform's settings.

## 📊 Monitoring

### Check Connection Status
```javascript
// In browser console
console.log('Online:', navigator.onLine)

// Check Supabase session
const { data } = await supabase.auth.getSession()
console.log('Session:', data.session)

// Check pending sync
import { offlineSyncManager } from './utils/offline-sync-manager'
const status = await offlineSyncManager.getSyncStatus(userId)
console.log('Pending operations:', status)
```

### View Cached Data
```javascript
// In browser console
// View IndexedDB
const request = indexedDB.open('devtrack_offline_data')
request.onsuccess = () => {
  const db = request.result
  console.log('Stores:', db.objectStoreNames)
}

// View Cache Storage
caches.keys().then(names => {
  console.log('Caches:', names)
})
```

## 🆘 Troubleshooting

### "Auth must be used within provider" Error
**Solution:** Clear browser cache and hard refresh (Ctrl+Shift+R)

### Offline mode not working
**Check:**
1. Service worker is active (DevTools → Application → Service Workers)
2. IndexedDB is not disabled (check browser settings)
3. Storage quota is not exceeded

### Data not syncing
**Check:**
1. You're online (check network tab)
2. Valid Supabase session (check console for auth errors)
3. Pending operations exist (use OfflineFunctionalityTester)

### Environment variables not loading
**Check:**
1. File is named exactly `.env` (not `.env.txt`)
2. Variables start with `VITE_`
3. Restart development server after changing .env

## 🎯 Next Steps

1. **✅ Test offline functionality** using the tester component
2. **✅ Verify data persistence** by going offline and creating data
3. **✅ Test PWA installation** on mobile and desktop
4. **✅ Configure production environment** variables for deployment
5. **✅ Monitor sync operations** in production

## 📞 Support

If you encounter issues:

1. Check browser console for errors
2. Use the OfflineFunctionalityTester component
3. Verify environment variables are set correctly
4. Check Supabase dashboard for database issues
5. Ensure RLS policies are correctly configured

## ✨ Features Ready for Production

- ✅ Full Supabase integration
- ✅ Environment variable configuration
- ✅ Offline-first architecture
- ✅ Automatic synchronization
- ✅ PWA with install prompts
- ✅ Service worker caching
- ✅ IndexedDB persistence
- ✅ Real-time updates
- ✅ Authentication persistence
- ✅ Comprehensive error handling
- ✅ Testing utilities

**You're ready to deploy! 🚀**
