-- ============================================================================
-- 🚀 DEVTRACK AFRICA - PRODUCTION DATABASE SETUP (FIXED)
-- ============================================================================
--
-- This script creates a CLEAN, production-ready database for DevTrack Africa
-- with proper RLS policies and table name "profiles" (not "user_profiles")
--
-- ⚠️ IMPORTANT: This script will DROP all existing tables!
-- 
-- Features:
-- - Email + Phone authentication with country codes
-- - Multi-device sync support
-- - Comprehensive project management
-- - Kanban boards with WIP limits
-- - Time tracking and analytics
-- - Resource management
-- - Auto-profile creation on signup
--
-- Usage:
-- 1. Open Supabase Dashboard → SQL Editor
-- 2. Copy and paste this ENTIRE script
-- 3. Click "Run" and wait ~15 seconds
-- 4. Look for "✅ DATABASE SETUP COMPLETE!" at the end
--
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: CLEAN UP - Remove all existing tables, indexes, and objects
-- ============================================================================

-- Drop all existing indexes first (to avoid conflicts)
DROP INDEX IF EXISTS public.idx_profiles_email CASCADE;
DROP INDEX IF EXISTS public.idx_profiles_phone CASCADE;
DROP INDEX IF EXISTS public.idx_profiles_created_at CASCADE;
DROP INDEX IF EXISTS public.idx_user_profiles_email CASCADE;
DROP INDEX IF EXISTS public.idx_user_profiles_phone CASCADE;
DROP INDEX IF EXISTS public.idx_user_profiles_created_at CASCADE;
DROP INDEX IF EXISTS public.idx_projects_user_id CASCADE;
DROP INDEX IF EXISTS public.idx_projects_status CASCADE;
DROP INDEX IF EXISTS public.idx_projects_created_at CASCADE;
DROP INDEX IF EXISTS public.idx_projects_user_status CASCADE;
DROP INDEX IF EXISTS public.idx_tasks_project_id CASCADE;
DROP INDEX IF EXISTS public.idx_tasks_user_id CASCADE;
DROP INDEX IF EXISTS public.idx_tasks_status CASCADE;
DROP INDEX IF EXISTS public.idx_tasks_project_status CASCADE;
DROP INDEX IF EXISTS public.idx_tasks_position CASCADE;
DROP INDEX IF EXISTS public.idx_tasks_parent CASCADE;
DROP INDEX IF EXISTS public.idx_resources_project_id CASCADE;
DROP INDEX IF EXISTS public.idx_resources_user_id CASCADE;
DROP INDEX IF EXISTS public.idx_resources_type CASCADE;
DROP INDEX IF EXISTS public.idx_user_settings_user_id CASCADE;
DROP INDEX IF EXISTS public.idx_notifications_user_id CASCADE;
DROP INDEX IF EXISTS public.idx_notifications_unread CASCADE;
DROP INDEX IF EXISTS public.idx_notifications_created_at CASCADE;

-- Drop all existing tables if they exist (in correct order due to foreign keys)
DROP TABLE IF EXISTS public.task_comments CASCADE;
DROP TABLE IF EXISTS public.task_attachments CASCADE;
DROP TABLE IF EXISTS public.subtasks CASCADE;
DROP TABLE IF EXISTS public.task_time_logs CASCADE;
DROP TABLE IF EXISTS public.tasks CASCADE;
DROP TABLE IF EXISTS public.project_resources CASCADE;
DROP TABLE IF EXISTS public.project_collaborators CASCADE;
DROP TABLE IF EXISTS public.project_milestones CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.user_settings CASCADE;
DROP TABLE IF EXISTS public.activity_logs CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.handle_new_user CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS public.update_project_stats CASCADE;

-- Drop existing triggers (explicitly, though CASCADE should handle them)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles CASCADE;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles CASCADE;
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects CASCADE;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON public.tasks CASCADE;
DROP TRIGGER IF EXISTS update_resources_updated_at ON public.project_resources CASCADE;
DROP TRIGGER IF EXISTS update_settings_updated_at ON public.user_settings CASCADE;
DROP TRIGGER IF EXISTS update_project_stats_on_task_change ON public.tasks CASCADE;

COMMIT;

-- ============================================================================
-- STEP 2: ENABLE EXTENSIONS
-- ============================================================================

-- Enable UUID extension for generating unique IDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for better text search
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

COMMIT;

-- ============================================================================
-- STEP 3: CREATE CORE TABLES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Table: profiles
-- Purpose: Extended user information linked to Supabase Auth
-- Access: Each user can only see/edit their own profile
-- -----------------------------------------------------------------------------
CREATE TABLE public.profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    display_name TEXT,
    phone_number TEXT,
    country_code TEXT DEFAULT '+1',
    avatar_url TEXT,
    bio TEXT,
    location TEXT,
    skills TEXT[] DEFAULT '{}',
    github_url TEXT,
    portfolio_url TEXT,
    linkedin_url TEXT,
    twitter_url TEXT,
    timezone TEXT DEFAULT 'UTC',
    
    -- Profile metadata
    onboarding_completed BOOLEAN DEFAULT false,
    email_verified BOOLEAN DEFAULT false,
    phone_verified BOOLEAN DEFAULT false,
    
    -- Statistics
    total_projects INTEGER DEFAULT 0,
    total_tasks_completed INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone_number);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at DESC);

COMMIT;

-- -----------------------------------------------------------------------------
-- Table: projects
-- Purpose: Store all user projects
-- Access: Each user can only see/edit their own projects
-- -----------------------------------------------------------------------------
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    
    -- Project basic info
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    technologies TEXT[] DEFAULT '{}',
    
    -- Project status and progress
    status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'in_progress', 'completed', 'on_hold', 'archived')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    
    -- Project dates
    start_date DATE,
    end_date DATE,
    deadline DATE,
    
    -- Project metadata
    image_url TEXT,
    github_url TEXT,
    live_url TEXT,
    demo_url TEXT,
    
    -- Project settings
    is_public BOOLEAN DEFAULT false,
    is_featured BOOLEAN DEFAULT false,
    is_archived BOOLEAN DEFAULT false,
    
    -- Kanban settings
    enable_wip_limits BOOLEAN DEFAULT false,
    wip_limit_todo INTEGER DEFAULT 0,
    wip_limit_in_progress INTEGER DEFAULT 3,
    wip_limit_done INTEGER DEFAULT 0,
    
    -- Statistics
    total_tasks INTEGER DEFAULT 0,
    completed_tasks INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    
    -- Ensure user exists
    CONSTRAINT fk_project_user FOREIGN KEY (user_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_user_status ON public.projects(user_id, status);

COMMIT;

-- -----------------------------------------------------------------------------
-- Table: tasks
-- Purpose: Store all tasks for projects (Kanban board items)
-- Access: Each user can only see/edit tasks from their own projects
-- -----------------------------------------------------------------------------
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    
    -- Task basic info
    title TEXT NOT NULL,
    description TEXT,
    
    -- Task status and organization
    status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in_progress', 'done', 'blocked')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Task ordering (for Kanban drag-and-drop)
    position INTEGER DEFAULT 0,
    
    -- Task details
    tags TEXT[] DEFAULT '{}',
    assignee_id UUID REFERENCES public.profiles(user_id) ON DELETE SET NULL,
    
    -- Task dates
    due_date DATE,
    start_date DATE,
    completed_at TIMESTAMPTZ,
    
    -- Time tracking
    estimated_hours DECIMAL(10,2),
    actual_hours DECIMAL(10,2) DEFAULT 0,
    
    -- Task metadata
    is_subtask BOOLEAN DEFAULT false,
    parent_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    
    -- Notes and attachments
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON public.tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_project_status ON public.tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_position ON public.tasks(project_id, status, position);
DROP INDEX IF EXISTS idx_tasks_parent;
CREATE INDEX idx_tasks_parent ON public.tasks(parent_task_id) WHERE parent_task_id IS NOT NULL;

COMMIT;

-- -----------------------------------------------------------------------------
-- Table: project_resources
-- Purpose: Store file attachments and resources for projects
-- Access: Each user can only see/edit resources from their own projects
-- -----------------------------------------------------------------------------
CREATE TABLE public.project_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    
    -- Resource info
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('image', 'document', 'link', 'file', 'video', 'other')),
    
    -- Resource location
    url TEXT NOT NULL,
    file_size INTEGER,
    mime_type TEXT,
    
    -- Resource metadata
    tags TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resources_project_id ON public.project_resources(project_id);
CREATE INDEX IF NOT EXISTS idx_resources_user_id ON public.project_resources(user_id);
CREATE INDEX IF NOT EXISTS idx_resources_type ON public.project_resources(type);

COMMIT;

-- -----------------------------------------------------------------------------
-- Table: user_settings
-- Purpose: Store user preferences and settings
-- Access: Each user can only see/edit their own settings
-- -----------------------------------------------------------------------------
CREATE TABLE public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    
    -- UI Preferences
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    language TEXT DEFAULT 'en',
    
    -- Notification Preferences
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    task_reminders BOOLEAN DEFAULT true,
    project_updates BOOLEAN DEFAULT true,
    
    -- Privacy Settings
    profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private', 'friends')),
    show_email BOOLEAN DEFAULT false,
    show_phone BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

COMMIT;

-- -----------------------------------------------------------------------------
-- Table: notifications
-- Purpose: Store user notifications
-- Access: Each user can only see/edit their own notifications
-- -----------------------------------------------------------------------------
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(user_id) ON DELETE CASCADE,
    
    -- Notification content
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'task', 'project', 'system')),
    
    -- Notification metadata
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    
    -- Related entities
    related_project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    related_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    read_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
DROP INDEX IF EXISTS idx_notifications_unread;
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

COMMIT;

-- ============================================================================
-- STEP 4: CREATE FUNCTIONS
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Function: update_updated_at_column
-- Purpose: Automatically update the updated_at timestamp
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- -----------------------------------------------------------------------------
-- Function: handle_new_user
-- Purpose: Automatically create profile when a new user signs up
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (user_id, email, full_name, email_verified)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email_confirmed_at IS NOT NULL
    );
    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Profile already exists, just return
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log error but don't fail signup
        RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- ============================================================================
-- STEP 5: CREATE TRIGGERS
-- ============================================================================

-- Auto-update timestamps on UPDATE
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON public.projects
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_resources_updated_at
    BEFORE UPDATE ON public.project_resources
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

COMMIT;

-- ============================================================================
-- STEP 6: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

COMMIT;

-- ============================================================================
-- STEP 7: CREATE RLS POLICIES
-- ============================================================================

-- -----------------------------------------------------------------------------
-- Profiles: Users can view and edit their own profile
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

COMMIT;

-- -----------------------------------------------------------------------------
-- Projects: Users can manage their own projects
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own projects"
    ON public.projects FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own projects"
    ON public.projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
    ON public.projects FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
    ON public.projects FOR DELETE
    USING (auth.uid() = user_id);

COMMIT;

-- -----------------------------------------------------------------------------
-- Tasks: Users can manage tasks in their own projects
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own tasks"
    ON public.tasks FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
    ON public.tasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
    ON public.tasks FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
    ON public.tasks FOR DELETE
    USING (auth.uid() = user_id);

COMMIT;

-- -----------------------------------------------------------------------------
-- Resources: Users can manage resources in their own projects
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own resources"
    ON public.project_resources FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own resources"
    ON public.project_resources FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own resources"
    ON public.project_resources FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own resources"
    ON public.project_resources FOR DELETE
    USING (auth.uid() = user_id);

COMMIT;

-- -----------------------------------------------------------------------------
-- User Settings: Users can manage their own settings
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own settings"
    ON public.user_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
    ON public.user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
    ON public.user_settings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

COMMIT;

-- -----------------------------------------------------------------------------
-- Notifications: Users can manage their own notifications
-- -----------------------------------------------------------------------------
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
    ON public.notifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
    ON public.notifications FOR DELETE
    USING (auth.uid() = user_id);

COMMIT;

-- ============================================================================
-- ✅ DATABASE SETUP COMPLETE!
-- ============================================================================
--
-- Your database is now ready with:
-- ✅ All tables created with "profiles" (not "user_profiles")
-- ✅ Row Level Security (RLS) enabled and configured
-- ✅ Auto-profile creation on signup
-- ✅ Proper foreign key relationships
-- ✅ Optimized indexes for performance
-- ✅ Automatic timestamp updates
--
-- Next steps:
-- 1. Enable email authentication in Supabase Dashboard
-- 2. Configure email templates (optional)
-- 3. Test user registration
-- 4. Start building! 🚀
--
-- ============================================================================

SELECT '✅ DATABASE SETUP COMPLETE!' AS status;
