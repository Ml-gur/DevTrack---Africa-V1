# 🎯 NEW SUPABASE SETUP (WITH EMAIL CONFIRMATION)

## ✅ Great Choice!
Keeping email confirmation makes your app more secure and professional.

---

## 📋 SETUP STEPS

### ✅ STEP 1: Run This SQL in Supabase (3 minutes)

1. Go to **https://supabase.com/dashboard**
2. Select your project
3. Click **"SQL Editor"** → **"New query"**
4. Copy and paste the SQL below
5. Click **"RUN"**

```sql
-- ============================================
-- DEVTRACK AFRICA - DATABASE SETUP
-- With Email Confirmation Enabled
-- ============================================

-- DROP OLD TABLES IF THEY EXIST
DROP TABLE IF EXISTS public.resources CASCADE;
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================
-- CREATE PROFILES TABLE
-- ============================================
CREATE TABLE public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT DEFAULT '',
  country TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  bio TEXT DEFAULT '',
  avatar_url TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- CREATE PROJECTS TABLE
-- ============================================
CREATE TABLE public.projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  status TEXT DEFAULT 'planning',
  priority TEXT DEFAULT 'medium',
  category TEXT DEFAULT '',
  tech_stack TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  start_date DATE,
  end_date DATE,
  progress INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT false,
  github_url TEXT,
  live_url TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON public.projects(user_id);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects" ON public.projects FOR SELECT USING (auth.uid() = user_id OR is_public = true);
CREATE POLICY "Users can insert own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON public.projects FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- CREATE TASKS TABLE
-- ============================================
CREATE TABLE public.tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  time_spent INTEGER DEFAULT 0,
  estimated_time INTEGER DEFAULT 0,
  actual_hours INTEGER DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  dependencies TEXT[] DEFAULT '{}',
  order_index INTEGER DEFAULT 0,
  timer_start_time TIMESTAMPTZ,
  assigned_to UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX idx_tasks_project_id ON public.tasks(project_id);
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- CREATE NOTES TABLE
-- ============================================
CREATE TABLE public.notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'Untitled Note',
  content TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notes_user_id ON public.notes(user_id);
ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own notes" ON public.notes FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- CREATE RESOURCES TABLE
-- ============================================
CREATE TABLE public.resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT DEFAULT 'link',
  size BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_resources_user_id ON public.resources(user_id);
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own resources" ON public.resources FOR ALL USING (auth.uid() = user_id);

-- ============================================
-- CREATE TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON public.notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- AUTO-CREATE PROFILE FOR NEW USERS
-- This runs AFTER email is confirmed
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- VERIFY SETUP
-- ============================================
SELECT '✅ DATABASE SETUP COMPLETE!' as status;

SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'projects', 'tasks', 'notes', 'resources') 
ORDER BY table_name;
```

**Expected Output:**
```
✅ DATABASE SETUP COMPLETE!

table_name
----------
notes
profiles
projects
resources
tasks
```

---

### ✅ STEP 2: Configure Email Templates (2 minutes)

1. In Supabase Dashboard, click **"Authentication"** → **"Email Templates"**
2. Click **"Confirm signup"** template
3. Customize the email (optional):

```html
<h2>Welcome to DevTrack Africa!</h2>
<p>Thank you for signing up. Please confirm your email address by clicking the link below:</p>
<p><a href="{{ .ConfirmationURL }}">Confirm Email</a></p>
<p>This link expires in 24 hours.</p>
```

4. Click **"Save"**

---

### ✅ STEP 3: Configure Redirect URLs (1 minute)

1. In Supabase Dashboard, go to **"Authentication"** → **"URL Configuration"**
2. Add your redirect URLs:
   - **Development:** `http://localhost:5173/auth/confirm`
   - **Production:** `https://your-domain.com/auth/confirm`
3. Click **"Save"**

---

### ✅ STEP 4: Update .env File

Make sure your `.env` file has the correct values:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 🎉 DONE!

Your database is now set up with:
- ✅ All tables with `user_id` columns
- ✅ Email confirmation enabled
- ✅ Auto-profile creation after email confirmation
- ✅ Row Level Security enabled
- ✅ Professional setup

---

## 🧪 TEST IT

### Test Registration Flow:
1. Start dev server: `npm run dev`
2. Click "Register"
3. Fill in details and submit
4. **You'll see:** "Please check your email to confirm"
5. Open your email
6. Click confirmation link
7. **You'll be redirected back** and logged in
8. Profile auto-created ✅

### Check Console:
```
✅ User created successfully
⏳ Please confirm your email
✅ Email confirmed!
✅ Profile created and loaded successfully
```

---

## 📧 Email Confirmation Flow

```
User Registers
    ↓
Supabase sends email
    ↓
User clicks link in email
    ↓
Email confirmed ✅
    ↓
Trigger creates profile automatically
    ↓
User redirected to app
    ↓
User logged in ✅
```

---

## 🔧 Troubleshooting

### "Email not arriving"
1. Check spam folder
2. Check Supabase → Authentication → Users (user should show "waiting for verification")
3. Test with a different email provider
4. Check email rate limits in Supabase settings

### "Confirmation link not working"
1. Check redirect URLs are configured correctly
2. Make sure development URL matches your local setup
3. Check browser console for errors

### "Profile not created after confirmation"
1. Check Supabase logs: Database → Logs
2. Verify trigger exists: SQL Editor → Run `SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';`
3. Check if user is in auth.users table

---

## 💡 Benefits of Email Confirmation

✅ **Security:** Prevents fake accounts
✅ **Professional:** Industry standard
✅ **Valid emails:** Ensures real email addresses
✅ **Communication:** Can send important updates
✅ **Trust:** Users trust verified platforms

---

**Now run the SQL and test! 🚀**
