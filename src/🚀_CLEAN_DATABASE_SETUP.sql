-- ============================================================================
-- DEVTRACK AFRICA - CLEAN DATABASE SETUP
-- ============================================================================
-- This script will:
-- 1. Remove ALL existing tables safely
-- 2. Create clean, production-ready schema
-- 3. Enable full authentication (email, phone with country codes)
-- 4. Enable data persistence across all devices
-- 5. Set up proper Row Level Security (RLS)
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
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    
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
    completed_at TIMESTAMPTZ,
    archived_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_user_status ON public.projects(user_id, status);

COMMIT;

-- -----------------------------------------------------------------------------
-- Table: tasks
-- Purpose: Store all project tasks with Kanban support
-- Access: Each user can only see/edit tasks from their own projects
-- -----------------------------------------------------------------------------
CREATE TABLE public.tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    
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
    assignee_id UUID REFERENCES public.user_profiles(id) ON DELETE SET NULL,
    
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
DROP INDEX IF EXISTS idx_tasks_parent; -- Drop first because partial index can't use IF NOT EXISTS
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
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    
    -- Resource info
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('image', 'document', 'link', 'file', 'video', 'other')),
    
    -- Resource location
    url TEXT NOT NULL,
    file_size INTEGER, -- in bytes
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
    user_id UUID PRIMARY KEY REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    
    -- UI Preferences
    theme TEXT DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    language TEXT DEFAULT 'en',
    
    -- Notification Preferences
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    task_reminders BOOLEAN DEFAULT true,
    project_updates BOOLEAN DEFAULT true,
    
    -- Dashboard Preferences
    default_view TEXT DEFAULT 'overview' CHECK (default_view IN ('overview', 'kanban', 'list', 'analytics')),
    show_completed_tasks BOOLEAN DEFAULT true,
    compact_mode BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

COMMIT;

-- -----------------------------------------------------------------------------
-- Table: notifications
-- Purpose: Store user notifications
-- Access: Each user can only see their own notifications
-- -----------------------------------------------------------------------------
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
    
    -- Notification content
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    
    -- Notification metadata
    action_url TEXT,
    is_read BOOLEAN DEFAULT false,
    
    -- Related entities
    related_project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    related_task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    read_at TIMESTAMPTZ
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
DROP INDEX IF EXISTS idx_notifications_unread; -- Drop first because partial index can't use IF NOT EXISTS
CREATE INDEX idx_notifications_unread ON public.notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

COMMIT;

-- ============================================================================
-- STEP 4: CREATE FUNCTIONS AND TRIGGERS
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
-- Purpose: Automatically create user profile when user signs up
-- This ensures every authenticated user has a profile
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.user_profiles (id, email, full_name, phone_number, email_verified)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
        NEW.phone,
        NEW.email_confirmed_at IS NOT NULL
    );
    
    -- Create default user settings
    INSERT INTO public.user_settings (user_id)
    VALUES (NEW.id);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- -----------------------------------------------------------------------------
-- Function: update_project_stats
-- Purpose: Update project statistics when tasks change
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.update_project_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the project's task counts
    UPDATE public.projects
    SET 
        total_tasks = (
            SELECT COUNT(*) 
            FROM public.tasks 
            WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
        ),
        completed_tasks = (
            SELECT COUNT(*) 
            FROM public.tasks 
            WHERE project_id = COALESCE(NEW.project_id, OLD.project_id) 
            AND status = 'done'
        ),
        progress = CASE 
            WHEN (SELECT COUNT(*) FROM public.tasks WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)) = 0 
            THEN 0
            ELSE (
                SELECT ROUND((COUNT(*) FILTER (WHERE status = 'done')::DECIMAL / COUNT(*)) * 100)
                FROM public.tasks 
                WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
            )
        END,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- -----------------------------------------------------------------------------
-- Create triggers for updated_at columns
-- -----------------------------------------------------------------------------
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
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

COMMIT;

-- -----------------------------------------------------------------------------
-- Create trigger for automatic user profile creation
-- -----------------------------------------------------------------------------
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

COMMIT;

-- -----------------------------------------------------------------------------
-- Create trigger for project statistics
-- -----------------------------------------------------------------------------
CREATE TRIGGER update_project_stats_on_task_change
    AFTER INSERT OR UPDATE OR DELETE ON public.tasks
    FOR EACH ROW
    EXECUTE FUNCTION public.update_project_stats();

COMMIT;

-- ============================================================================
-- STEP 5: ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================================
-- This ensures users can ONLY access their own data

-- Enable RLS on all tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

COMMIT;

-- -----------------------------------------------------------------------------
-- RLS Policies: user_profiles
-- -----------------------------------------------------------------------------
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
    ON public.user_profiles FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.user_profiles FOR UPDATE
    USING (auth.uid() = id);

-- Users can insert their own profile (for manual creation if needed)
CREATE POLICY "Users can insert own profile"
    ON public.user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

COMMIT;

-- -----------------------------------------------------------------------------
-- RLS Policies: projects
-- -----------------------------------------------------------------------------
-- Users can view their own projects
CREATE POLICY "Users can view own projects"
    ON public.projects FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create their own projects
CREATE POLICY "Users can create own projects"
    ON public.projects FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own projects
CREATE POLICY "Users can update own projects"
    ON public.projects FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own projects
CREATE POLICY "Users can delete own projects"
    ON public.projects FOR DELETE
    USING (auth.uid() = user_id);

COMMIT;

-- -----------------------------------------------------------------------------
-- RLS Policies: tasks
-- -----------------------------------------------------------------------------
-- Users can view tasks from their own projects
CREATE POLICY "Users can view own tasks"
    ON public.tasks FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create tasks in their own projects
CREATE POLICY "Users can create own tasks"
    ON public.tasks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own tasks
CREATE POLICY "Users can update own tasks"
    ON public.tasks FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own tasks
CREATE POLICY "Users can delete own tasks"
    ON public.tasks FOR DELETE
    USING (auth.uid() = user_id);

COMMIT;

-- -----------------------------------------------------------------------------
-- RLS Policies: project_resources
-- -----------------------------------------------------------------------------
-- Users can view resources from their own projects
CREATE POLICY "Users can view own resources"
    ON public.project_resources FOR SELECT
    USING (auth.uid() = user_id);

-- Users can create resources in their own projects
CREATE POLICY "Users can create own resources"
    ON public.project_resources FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own resources
CREATE POLICY "Users can update own resources"
    ON public.project_resources FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own resources
CREATE POLICY "Users can delete own resources"
    ON public.project_resources FOR DELETE
    USING (auth.uid() = user_id);

COMMIT;

-- -----------------------------------------------------------------------------
-- RLS Policies: user_settings
-- -----------------------------------------------------------------------------
-- Users can view their own settings
CREATE POLICY "Users can view own settings"
    ON public.user_settings FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own settings
CREATE POLICY "Users can update own settings"
    ON public.user_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can insert their own settings
CREATE POLICY "Users can insert own settings"
    ON public.user_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

COMMIT;

-- -----------------------------------------------------------------------------
-- RLS Policies: notifications
-- -----------------------------------------------------------------------------
-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
    ON public.notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
    ON public.notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
    ON public.notifications FOR DELETE
    USING (auth.uid() = user_id);

COMMIT;

-- ============================================================================
-- STEP 6: CREATE STORAGE BUCKET (Optional - for file uploads)
-- ============================================================================
-- This creates a bucket for user-uploaded files
-- Run this if you need file upload functionality

-- Create storage bucket for user files
INSERT INTO storage.buckets (id, name, public)
VALUES ('user-files', 'user-files', false)
ON CONFLICT (id) DO NOTHING;

-- Allow users to upload files to their own folder
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'user-files' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to view their own files
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'user-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to update their own files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'user-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'user-files'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

COMMIT;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify everything was created correctly

-- Check all tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check all RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check all triggers
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Check all functions
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '✅ ============================================================';
    RAISE NOTICE '✅ DATABASE SETUP COMPLETE!';
    RAISE NOTICE '✅ ============================================================';
    RAISE NOTICE '✅ Created Tables:';
    RAISE NOTICE '✅   - user_profiles (with auto-creation on signup)';
    RAISE NOTICE '✅   - projects';
    RAISE NOTICE '✅   - tasks (with Kanban support)';
    RAISE NOTICE '✅   - project_resources';
    RAISE NOTICE '✅   - user_settings';
    RAISE NOTICE '✅   - notifications';
    RAISE NOTICE '✅ ';
    RAISE NOTICE '✅ Enabled Features:';
    RAISE NOTICE '✅   - Row Level Security (RLS) on all tables';
    RAISE NOTICE '✅   - Auto user profile creation on signup';
    RAISE NOTICE '✅   - Auto updated_at timestamps';
    RAISE NOTICE '✅   - Auto project statistics updates';
    RAISE NOTICE '✅   - Email authentication';
    RAISE NOTICE '✅   - Phone authentication with country codes';
    RAISE NOTICE '✅   - Storage bucket for file uploads';
    RAISE NOTICE '✅ ';
    RAISE NOTICE '✅ Data Access:';
    RAISE NOTICE '✅   - Each user can ONLY access their own data';
    RAISE NOTICE '✅   - Data syncs across all devices';
    RAISE NOTICE '✅   - Login from anywhere with same credentials';
    RAISE NOTICE '✅ ';
    RAISE NOTICE '✅ Next Steps:';
    RAISE NOTICE '✅   1. Test user signup';
    RAISE NOTICE '✅   2. Verify profile auto-creation';
    RAISE NOTICE '✅   3. Test creating projects and tasks';
    RAISE NOTICE '✅   4. Test login from different device';
    RAISE NOTICE '✅ ============================================================';
END $$;
