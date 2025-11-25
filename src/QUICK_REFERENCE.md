# 🚀 Quick Reference - DevTrack Africa

## One-Minute Setup

```bash
# 1. Verify setup
npm run verify:supabase

# 2. Install dependencies
npm install

# 3. Start dev server
npm run dev
```

Open http://localhost:5173 ✨

---

## Essential Commands

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build

# Verification
npm run verify:supabase  # Verify Supabase setup
npm run type-check       # Check TypeScript types

# Cleanup
npm run clean            # Clean build artifacts
```

---

## Environment Variables

**File:** `.env` (DO NOT COMMIT)

```env
VITE_SUPABASE_PROJECT_ID=your_project_id
VITE_SUPABASE_ANON_KEY=your_anon_key
VITE_SERVER_FUNCTION_NAME=make-server-3e6b72d9
```

**Get credentials:** https://supabase.com/dashboard → Settings → API

---

## Test Offline Mode

1. Open DevTools (F12)
2. Network tab → Select "Offline"
3. Create/edit projects
4. Go back "Online"
5. Watch automatic sync! 🎉

---

## File Structure

```
/
├── .env                 ← Your credentials (SECRET)
├── .env.example         ← Template
├── lib/
│   └── supabaseClient.ts    ← Supabase config
├── utils/
│   ├── supabase/
│   │   └── config.ts        ← Centralized config
│   ├── offline-sync-manager.ts
│   └── offline-database-wrapper.ts
├── components/
│   └── OfflineFunctionalityTester.tsx
└── public/
    └── service-worker.js    ← Offline support
```

---

## Storage Layers

| Layer | Purpose | Location |
|-------|---------|----------|
| **Supabase** | Primary database | Cloud ☁️ |
| **IndexedDB** | Offline cache | Browser 💾 |
| **Cache Storage** | Static assets | Browser 📦 |
| **localStorage** | Auth session | Browser 🔐 |

---

## Common Tasks

### Change Supabase Project
1. Edit `.env`
2. Update `VITE_SUPABASE_PROJECT_ID` and `VITE_SUPABASE_ANON_KEY`
3. Restart dev server

### Clear Cache
```bash
# In browser console
caches.keys().then(keys => 
  Promise.all(keys.map(key => caches.delete(key)))
)
```

### Check Pending Sync
```javascript
// In browser console
import { offlineSyncManager } from './utils/offline-sync-manager'
const status = await offlineSyncManager.getSyncStatus(userId)
console.log('Pending:', status.count)
```

### Force Sync
Use the OfflineFunctionalityTester component and click "Sync Now"

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Auth errors | Clear cache + hard refresh (Ctrl+Shift+R) |
| Env vars not loading | Restart dev server |
| Offline not working | Check service worker in DevTools |
| Sync fails | Verify Supabase session is valid |

---

## Key Features

✅ Full Supabase integration  
✅ Offline-first architecture  
✅ Automatic synchronization  
✅ PWA installable  
✅ Real-time updates  
✅ Secure authentication  
✅ Project & task management  
✅ Kanban boards  
✅ Community features  
✅ Analytics dashboard  

---

## Deployment

### Vercel
```bash
vercel deploy --prod
```

### Netlify
```bash
netlify deploy --prod
```

**Remember:** Set environment variables in platform dashboard!

---

## Documentation

📖 **START_HERE_SUPABASE.md** - Quick start guide  
📖 **SUPABASE_ENV_SETUP_GUIDE.md** - Complete setup  
📖 **OFFLINE_TESTING_CHECKLIST.md** - Testing guide  
📖 **SUPABASE_MIGRATION_COMPLETE.md** - Migration summary  

---

## Browser DevTools Shortcuts

| Tab | Purpose |
|-----|---------|
| **Application → Service Workers** | Check service worker |
| **Application → IndexedDB** | View offline data |
| **Application → Cache Storage** | View cached files |
| **Network → Offline** | Test offline mode |
| **Console** | View logs & errors |

---

## Important Files

| File | Purpose | Commit? |
|------|---------|---------|
| `.env` | Your credentials | ❌ NO |
| `.env.example` | Template | ✅ YES |
| `.gitignore` | Protects secrets | ✅ YES |

---

## Data Flow

```
Online:  User → App → Supabase → Cache
Offline: User → App → IndexedDB → Queue
Sync:    Queue → Supabase → Success!
```

---

## Testing

### Quick Test
1. Sign in
2. Create project
3. Go offline
4. Edit project
5. Go online
6. Verify sync ✅

### Full Test
Run comprehensive checklist in `OFFLINE_TESTING_CHECKLIST.md`

### Automated Test
```bash
npm run verify:supabase
```

---

## Production Checklist

- [ ] `npm run verify:supabase` passes
- [ ] No console errors
- [ ] Offline mode works
- [ ] PWA installs
- [ ] Build succeeds
- [ ] Environment variables set in hosting platform
- [ ] `.env` not in git

---

## Support

🔍 **Check Logs:** Browser console  
🧪 **Test Tool:** OfflineFunctionalityTester  
📚 **Documentation:** See files above  
🔧 **Verify:** `npm run verify:supabase`  

---

## URLs

**Dashboard:** https://supabase.com/dashboard  
**Docs:** https://supabase.com/docs  
**PWA Guide:** https://web.dev/progressive-web-apps/  

---

**Ready? Run:** `npm run dev` 🚀

*For African Developers, By African Developers ❤️*
