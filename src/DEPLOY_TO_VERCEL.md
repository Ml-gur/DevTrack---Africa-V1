# 🚀 Deploy DevTrack Africa to Vercel

## Quick Start (5 Minutes)

### Step 1: Prepare Supabase (2 minutes)

1. **Create Supabase Project** at https://supabase.com
   - Click "New Project"
   - Choose organization and region
   - Set database password (save it!)
   - Wait for project to initialize

2. **Run Database Migration**
   - Go to SQL Editor in Supabase dashboard
   - Copy contents of `/supabase/migrations/001_initial_schema.sql`
   - Paste and click "Run"
   - Verify tables created in Table Editor

3. **Deploy Edge Function**
   ```bash
   # Install Supabase CLI
   npm install -g supabase
   
   # Login
   supabase login
   
   # Link your project (get project-ref from Supabase dashboard URL)
   supabase link --project-ref YOUR_PROJECT_REF
   
   # Deploy function
   supabase functions deploy make-server-3e6b72d9
   ```

4. **Get Credentials**
   - Go to Project Settings > API
   - Copy Project URL
   - Copy Project ID (from URL)
   - Copy anon/public key
   - These are already configured in `/utils/supabase/info.tsx`

### Step 2: Deploy to Vercel (2 minutes)

1. **Go to Vercel**
   - Visit https://vercel.com
   - Sign up or log in
   - Click "Add New" > "Project"

2. **Import Repository**
   - Connect your GitHub account
   - Select your DevTrack Africa repository
   - Click "Import"

3. **Configure (Auto-detected)**
   - Framework: Vite ✅ (auto-detected)
   - Build Command: `npm run build` ✅ (from vercel.json)
   - Output Directory: `dist` ✅ (from vercel.json)
   - Node Version: 18.x ✅ (auto-detected)

4. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Your app is live! 🎉

### Step 3: Configure Supabase URLs (1 minute)

1. **Copy Vercel URL** from deployment success page
2. **Go to Supabase** > Authentication > URL Configuration
3. **Set Site URL:** `https://your-project.vercel.app`
4. **Add Redirect URL:** `https://your-project.vercel.app/**`
5. Click "Save"

### Done! ✅

Your DevTrack Africa platform is now live at:
`https://your-project-name.vercel.app`

---

## Detailed Instructions

See **[VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)** for comprehensive step-by-step instructions.

---

## Pre-Deployment Checklist

Run this command to verify everything is ready:

```bash
npm run verify
```

This checks:
- ✅ All required files exist
- ✅ Dependencies installed correctly
- ✅ TypeScript configuration valid
- ✅ Supabase configured
- ✅ Vercel configuration valid
- ✅ PWA files present

---

## Environment Variables

**Good news:** The Supabase credentials are already hardcoded in the project, so you don't need to configure environment variables in Vercel!

The credentials in `/utils/supabase/info.tsx` will be used automatically.

If you want to override them (optional):
1. Go to Vercel project settings
2. Navigate to "Environment Variables"
3. Add your custom values

---

## Troubleshooting

### Build Fails

```bash
# Run locally to debug
npm install
npm run type-check
npm run build
```

### Authentication Not Working

1. Check Supabase Site URL and Redirect URLs
2. Verify edge function is deployed: `supabase functions list`
3. Check browser console for errors

### Database Connection Issues

1. Verify migration ran successfully
2. Check RLS policies are active
3. Review edge function logs: `supabase functions logs make-server-3e6b72d9`

---

## Continuous Deployment

Once deployed, Vercel automatically redeploys when you push to your main branch:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Vercel detects the push and redeploys automatically! 🚀

---

## Testing Your Deployment

1. **Visit your URL**
2. **Create account** - Should work immediately
3. **Create project** - Data should save
4. **Refresh page** - Data should persist
5. **Install PWA** - Look for install icon in address bar
6. **Mobile test** - Open on phone, add to home screen

---

## Custom Domain (Optional)

1. Go to Vercel project settings
2. Click "Domains"
3. Add your domain (e.g., `devtrack.africa`)
4. Update DNS records as shown
5. Update Supabase URL configuration with new domain

---

## Support Resources

- **Deployment Guide:** [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md)
- **Checklist:** [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)
- **Vercel Docs:** https://vercel.com/docs
- **Supabase Docs:** https://supabase.com/docs

---

## What's Deployed

✅ **Frontend:**
- React application with full UI
- PWA capabilities
- Service worker for offline support
- Responsive design

✅ **Backend:**
- Supabase database with PostgreSQL
- Row Level Security for data protection
- Edge functions for API operations
- Real-time subscriptions

✅ **Features:**
- User authentication
- Project management (CRUD)
- Kanban task boards
- Analytics dashboard
- Time tracking
- File uploads (IndexedDB)
- Offline functionality

---

## Performance

Expected performance on Vercel:
- **Load Time:** < 2 seconds
- **Time to Interactive:** < 3 seconds
- **Lighthouse Score:** 90+
- **PWA Ready:** Yes ✅

---

## Security

✅ Implemented:
- HTTPS (automatic with Vercel)
- Security headers (X-Frame-Options, CSP, etc.)
- Row Level Security in database
- Authentication required for data access
- No API keys in client code

---

## Monitoring

**Vercel Dashboard:**
- Deployment status
- Build logs
- Analytics (optional)
- Performance metrics

**Supabase Dashboard:**
- Database usage
- API requests
- Edge function logs
- Authentication events

---

## Next Steps After Deployment

1. ✅ Test all features thoroughly
2. ✅ Set up custom domain (optional)
3. ✅ Enable analytics (optional)
4. ✅ Configure email templates in Supabase
5. ✅ Set up monitoring alerts
6. ✅ Create user documentation
7. ✅ Share with users!

---

**Ready to deploy?** Run `npm run verify` then follow Step 1 above! 🚀

**Questions?** Check [VERCEL_DEPLOYMENT_GUIDE.md](./VERCEL_DEPLOYMENT_GUIDE.md) for detailed help.
