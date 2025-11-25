# DevTrack Africa - Vercel Deployment Guide

## Prerequisites

1. ✅ GitHub account
2. ✅ Vercel account (sign up at https://vercel.com)
3. ✅ Supabase project set up and running
4. ✅ Database tables created (run the migration in `/supabase/migrations/001_initial_schema.sql`)

## Step 1: Prepare Supabase

### 1.1 Create Database Tables

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy and paste the contents of `/supabase/migrations/001_initial_schema.sql`
4. Click **Run** to execute the migration
5. Verify tables are created in the **Table Editor**

### 1.2 Deploy Edge Function

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Login to Supabase:
   ```bash
   supabase login
   ```

3. Link your project:
   ```bash
   supabase link --project-ref your-project-id
   ```

4. Deploy the server function:
   ```bash
   supabase functions deploy make-server-3e6b72d9
   ```

### 1.3 Get Supabase Credentials

1. Go to **Project Settings** > **API**
2. Copy the following:
   - **Project URL** (e.g., `https://tfivuvjlvrfeofcpxzde.supabase.co`)
   - **Project Reference ID** (e.g., `tfivuvjlvrfeofcpxzde`)
   - **anon/public key**

## Step 2: Deploy to Vercel

### 2.1 Connect Repository

1. Go to https://vercel.com
2. Click **Add New** > **Project**
3. Import your Git repository
4. Vercel will auto-detect the framework (Vite)

### 2.2 Configure Environment Variables

In the Vercel project settings, add these environment variables:

```
VITE_APP_NAME=DevTrack Africa
VITE_APP_VERSION=1.0.0
```

**Note:** The Supabase credentials are already hardcoded in `/utils/supabase/info.tsx`, so you don't need to add them as environment variables unless you want to override them.

### 2.3 Configure Build Settings

Vercel should auto-detect these settings from `vercel.json`, but verify:

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`
- **Install Command:** `npm install`
- **Node Version:** 18.x or higher

### 2.4 Deploy

1. Click **Deploy**
2. Wait for the build to complete (usually 2-3 minutes)
3. Your app will be live at `https://your-project-name.vercel.app`

## Step 3: Verify Deployment

### 3.1 Test Core Functionality

1. Visit your deployed URL
2. Create a new account
3. Verify email confirmation works (or auto-confirm in Supabase)
4. Create a test project
5. Create a test task
6. Verify data persists after refresh

### 3.2 PWA Installation

1. Open Chrome/Edge on desktop
2. Look for the install icon in the address bar
3. Click to install as desktop app
4. Verify offline functionality

### 3.3 Mobile Testing

1. Open the site on your mobile device
2. Add to Home Screen
3. Test touch interactions
4. Verify responsive design

## Step 4: Post-Deployment Configuration

### 4.1 Custom Domain (Optional)

1. Go to Vercel project settings
2. Navigate to **Domains**
3. Add your custom domain
4. Update DNS records as instructed

### 4.2 Enable Analytics (Optional)

1. In Vercel project settings, go to **Analytics**
2. Enable Vercel Analytics
3. Monitor performance and usage

### 4.3 Configure Supabase Auth (Important)

1. Go to Supabase **Authentication** > **URL Configuration**
2. Add your Vercel deployment URL to:
   - **Site URL:** `https://your-project-name.vercel.app`
   - **Redirect URLs:** `https://your-project-name.vercel.app/**`

## Troubleshooting

### Build Fails

**Error:** TypeScript compilation errors
**Solution:** Run `npm run type-check` locally to fix type errors

**Error:** Module not found
**Solution:** Ensure all imports use correct paths and check `package.json`

### Authentication Issues

**Error:** Users can't sign up/sign in
**Solution:** 
1. Check Supabase URL configuration
2. Verify edge function is deployed
3. Check browser console for errors

### Database Connection Fails

**Error:** "Failed to fetch" or connection errors
**Solution:**
1. Verify edge function is deployed: `supabase functions list`
2. Check edge function logs: `supabase functions logs make-server-3e6b72d9`
3. Ensure Row Level Security (RLS) policies are correct

### PWA Not Installing

**Error:** Install prompt doesn't appear
**Solution:**
1. Verify HTTPS is enabled (Vercel provides this automatically)
2. Check `site.webmanifest` is accessible
3. Verify service worker registration in browser DevTools

## Environment Variables Reference

### Required (Already Configured)
- ✅ Supabase credentials hardcoded in `/utils/supabase/info.tsx`

### Optional
- `VITE_APP_NAME` - Application name (default: DevTrack Africa)
- `VITE_APP_VERSION` - Version number (default: 1.0.0)

## Continuous Deployment

Vercel automatically deploys when you push to your main branch:

1. Make changes locally
2. Commit and push to GitHub
3. Vercel automatically builds and deploys
4. Check deployment status in Vercel dashboard

## Rollback

If a deployment has issues:

1. Go to Vercel project dashboard
2. Navigate to **Deployments**
3. Find a previous working deployment
4. Click **...** > **Promote to Production**

## Performance Optimization

1. **Enable Compression:** Vercel automatically compresses assets
2. **Edge Caching:** Vercel caches static assets at edge locations
3. **Image Optimization:** Already handled by Vercel
4. **Service Worker:** PWA service worker handles offline caching

## Security Checklist

- ✅ HTTPS enabled (automatic with Vercel)
- ✅ Security headers configured in `vercel.json`
- ✅ Environment variables secure
- ✅ Row Level Security enabled in Supabase
- ✅ API routes protected with authentication

## Monitoring

### Vercel Analytics
- Page views
- Performance metrics
- Error tracking

### Supabase Monitoring
- Database usage
- API requests
- Function invocations
- Auth events

## Support

If you encounter issues:

1. Check Vercel deployment logs
2. Check Supabase edge function logs
3. Review browser console errors
4. Check network tab for failed requests

## Success Checklist

- [ ] Database schema created in Supabase
- [ ] Edge function deployed to Supabase
- [ ] Vercel project created and connected
- [ ] Environment variables configured
- [ ] First deployment successful
- [ ] User registration works
- [ ] Project creation works
- [ ] Task management works
- [ ] PWA installs correctly
- [ ] Mobile responsive
- [ ] Custom domain configured (optional)

---

## Quick Deploy Commands

```bash
# 1. Install dependencies
npm install

# 2. Run type check
npm run type-check

# 3. Build locally to test
npm run build

# 4. Preview build
npm run preview

# 5. Deploy (via Vercel dashboard or CLI)
vercel --prod
```

---

**🎉 Congratulations! Your DevTrack Africa platform is now live!**

Visit your deployment at: `https://your-project-name.vercel.app`
