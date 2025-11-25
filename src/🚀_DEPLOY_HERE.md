# 🚀 DEPLOY DEVTRACK AFRICA TO VERCEL

## ⚡ 3-Step Quick Deploy

### 1️⃣ SUPABASE SETUP (3 min)

```bash
# A. Create project at https://supabase.com

# B. Run migration (SQL Editor in Supabase)
# Copy/paste: supabase/migrations/001_initial_schema.sql

# C. Deploy edge function
npm install -g supabase
supabase login
supabase link --project-ref YOUR_PROJECT_ID
supabase functions deploy make-server-3e6b72d9
```

### 2️⃣ VERCEL DEPLOY (2 min)

```bash
# A. Go to https://vercel.com
# B. Click "Add New" > "Project"
# C. Import your GitHub repo
# D. Click "Deploy" (settings auto-detected)
```

### 3️⃣ CONFIGURE URLS (1 min)

```bash
# A. Copy Vercel URL (e.g., https://your-app.vercel.app)
# B. In Supabase > Auth > URL Configuration:
#    - Site URL: https://your-app.vercel.app
#    - Redirect URL: https://your-app.vercel.app/**
```

## ✅ DONE!

Your app is live at: `https://your-app.vercel.app`

---

## 🔍 Pre-Flight Check

```bash
npm run verify    # Checks if ready to deploy
npm run build     # Test build locally
npm run preview   # Preview build
```

---

## 📚 Need Help?

- **Full Guide:** [DEPLOY_TO_VERCEL.md](./DEPLOY_TO_VERCEL.md)
- **Detailed Steps:** [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)
- **Checklist:** [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)

---

## 🎯 What You Get

✅ Full project management platform  
✅ User authentication  
✅ Kanban boards with drag & drop  
✅ Analytics dashboard  
✅ PWA (installable on desktop & mobile)  
✅ Offline support  
✅ Real-time data sync  
✅ Secure database (Supabase)  

---

## ⚠️ Important Notes

1. **Credentials Already Configured** - Supabase credentials are in `/utils/supabase/info.tsx`
2. **No Env Variables Needed** - Everything is already set up
3. **Auto-Deploy on Push** - Push to main branch = auto-deploy
4. **HTTPS Included** - Vercel provides SSL automatically

---

## 🆘 Common Issues

**Build fails?**
```bash
npm install
npm run type-check
```

**Auth not working?**
- Check Supabase URL configuration
- Verify edge function deployed

**Database errors?**
- Ensure migration ran successfully
- Check RLS policies are active

---

## 🎉 Success Checklist

After deployment, test:
- [ ] Visit deployed URL
- [ ] Create account
- [ ] Create project
- [ ] Create task
- [ ] Refresh page (data persists?)
- [ ] Install PWA (desktop)
- [ ] Test on mobile

---

**🚀 Ready? Start with Step 1 above!**
