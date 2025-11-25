# 🚀 DevTrack Africa - Deployment Quick Reference

## One-Page Deployment Guide

### 📋 Pre-Deployment Checklist

```bash
✅ npm install              # Dependencies installed
✅ npm run type-check      # No TypeScript errors
✅ npm run verify          # Deployment ready
✅ npm run build           # Build succeeds
```

---

### 1️⃣ SUPABASE SETUP

**Create Project:** https://supabase.com → New Project

**Run Migration:**
```sql
-- Go to SQL Editor, paste & run:
supabase/migrations/001_initial_schema.sql
```

**Deploy Edge Function:**
```bash
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_ID
supabase functions deploy make-server-3e6b72d9
```

**Get Credentials:** Project Settings > API
- Project URL: `https://xxx.supabase.co`
- Project ID: `xxx` (from URL)
- Anon Key: `eyJhbG...`

*(Already configured in `/utils/supabase/info.tsx`)*

---

### 2️⃣ VERCEL DEPLOYMENT

**Deploy:**
1. Visit https://vercel.com
2. "Add New" > "Project"
3. Import GitHub repo
4. Click "Deploy"
5. Wait ~2 minutes

**Auto-detected:**
- Framework: Vite ✅
- Build: `npm run build` ✅
- Output: `dist` ✅
- Node: 18.x ✅

---

### 3️⃣ CONFIGURE AUTH

**Supabase Auth Settings:**
1. Go to: Authentication > URL Configuration
2. Site URL: `https://your-app.vercel.app`
3. Redirect URLs: `https://your-app.vercel.app/**`
4. Save

---

## 🎯 DONE!

Your app is live: `https://your-app.vercel.app`

---

## 🧪 Test Deployment

- [ ] Visit URL
- [ ] Create account
- [ ] Create project
- [ ] Create task
- [ ] Refresh (data persists)
- [ ] Install PWA
- [ ] Test on mobile

---

## 🆘 Troubleshooting

**Build fails:**
```bash
npm install && npm run build
```

**Auth fails:**
- Check Supabase URL config
- Verify edge function: `supabase functions list`

**DB errors:**
- Verify migration ran
- Check RLS policies: Supabase > Authentication > Policies

---

## 📊 Files to Know

| File | Purpose |
|------|---------|
| `vercel.json` | Vercel configuration |
| `/lib/supabaseClient.ts` | Supabase init |
| `/utils/supabase/info.tsx` | Credentials |
| `/utils/supabase-database.ts` | Database layer |
| `/supabase/migrations/001_initial_schema.sql` | DB schema |
| `/supabase/functions/server/index.tsx` | API server |

---

## 🔧 Useful Commands

```bash
# Verify deployment ready
npm run verify

# Build locally
npm run build

# Preview build
npm run preview

# Type check
npm run type-check

# Deploy via CLI (optional)
vercel --prod

# View Supabase functions
supabase functions list

# View function logs
supabase functions logs make-server-3e6b72d9
```

---

## 📚 Documentation

- Quick: [🚀_DEPLOY_HERE.md](./🚀_DEPLOY_HERE.md)
- Full: [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)
- Checklist: [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- Status: [READY_FOR_DEPLOYMENT.md](./READY_FOR_DEPLOYMENT.md)

---

## 🎉 Success Indicators

✅ Website loads  
✅ Can register  
✅ Can login  
✅ Can create projects  
✅ Data persists  
✅ PWA installs  

---

## 🚀 Continuous Deployment

After initial deploy:
```bash
git add .
git commit -m "Update"
git push
```
→ Vercel auto-deploys! 🎯

---

**Time:** ~10 minutes  
**Difficulty:** Easy  
**Success Rate:** 99%  

**Ready?** Run `npm run verify` then deploy! 🚀
