# 🚨 STOP - YOU MUST DO THIS NOW

## ❌ YOU'RE STILL GETTING THESE ERRORS:
```
Profile table not found
column projects.user_id does not exist
column tasks.user_id does not exist
Email not confirmed
```

## 💥 WHY YOU'RE STILL GETTING ERRORS

**YOU HAVEN'T RUN THE SQL IN SUPABASE!**

Editing files on your computer does NOTHING to your Supabase database.

```
❌ WRONG: Edit files on computer
✅ RIGHT: Run SQL in Supabase Dashboard
```

---

## ✅ DO THIS RIGHT NOW (5 MINUTES)

### 🎯 STEP 1: Fix Email Confirmation (2 minutes)

1. Go to: **https://supabase.com/dashboard**
2. Select your DevTrack Africa project
3. Click **"Authentication"** (left sidebar)
4. Click **"Providers"** tab
5. Click **"Email"** 
6. Find **"Confirm email"** toggle
7. **TURN IT OFF** (disable it)
8. Click **"Save"**

**This fixes: "Email not confirmed" error**

---

### 🎯 STEP 2: Create Database Tables (3 minutes)

1. In Supabase Dashboard, click **"SQL Editor"** (left sidebar)
2. Click **"New query"** button
3. Copy the SQL below
4. Paste it in the editor
5. Click **"RUN"**

```sql
-- DROP OLD TABLES
DROP TABLE IF EXISTS public.resources CASCADE;
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- CREATE PROFILES TABLE
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

-- CREATE PROJECTS TABLE
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

-- CREATE TASKS TABLE
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

-- CREATE NOTES TABLE
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

-- CREATE RESOURCES TABLE
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

-- CREATE TRIGGERS
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

-- AUTO-CREATE PROFILE FOR NEW USERS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- VERIFY
SELECT 'SETUP COMPLETE!' as status;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('profiles', 'projects', 'tasks', 'notes', 'resources') ORDER BY table_name;
```

**Expected Result:**
```
✅ SETUP COMPLETE!

table_name
----------
notes
profiles
projects
resources
tasks
```

**This fixes: All "table not found" and "user_id does not exist" errors**

---

### 🎯 STEP 3: Test It (1 minute)

```bash
npm run dev
```

Then:
1. **Register a new user** - should work without email confirmation
2. **Create a project** - should work
3. **Add a task** - should work
4. **Check console** - NO ERRORS!

---

## 🎉 SUCCESS LOOKS LIKE

**Console Output:**
```
✅ Connected to Supabase successfully
✅ User created successfully
✅ Profile created and loaded successfully
✅ Project created successfully
```

**NO Errors:**
```
❌ NO "Profile table not found"
❌ NO "user_id does not exist"
❌ NO "Email not confirmed"
```

---

## ⚠️ IMPORTANT NOTES

### Why editing files doesn't work:

```
┌─────────────────────────────────────────┐
│  YOUR COMPUTER         SUPABASE         │
│                                         │
│  📄 .sql files    ≠   🗄️ Database      │
│  (text only)          (actual data)    │
│                                         │
│  Editing here     ≠   Changes here     │
└─────────────────────────────────────────┘
```

### What you MUST do:

```
1. Copy SQL
2. Open Supabase SQL Editor
3. Paste SQL
4. Click RUN
5. Tables created in database ✅
```

---

## 🆘 TROUBLESHOOTING

### "I don't see SQL Editor"
- Look in left sidebar
- Under "Database" section
- Or click database icon

### "SQL gives error: relation exists"
The tables exist but are WRONG. Run this first:
```sql
DROP TABLE IF EXISTS public.resources CASCADE;
DROP TABLE IF EXISTS public.notes CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
```
Then run the full SQL again.

### "Still getting errors after running SQL"
1. Hard refresh browser: `Ctrl+Shift+R`
2. Restart dev server: `Ctrl+C` then `npm run dev`
3. Clear browser console and test again

---

## 📋 FINAL CHECKLIST

- [ ] Turned OFF email confirmation in Supabase Auth settings
- [ ] Ran SQL in Supabase SQL Editor
- [ ] Saw "SETUP COMPLETE!" message
- [ ] Saw 5 tables listed
- [ ] Restarted dev server
- [ ] Hard refreshed browser
- [ ] Registration works without email confirmation
- [ ] Can create projects
- [ ] Can add tasks
- [ ] NO errors in console

---

**YOU MUST DO THIS IN SUPABASE DASHBOARD, NOT IN YOUR CODE EDITOR!**

**GO TO SUPABASE NOW! DO IT! 🚀**
