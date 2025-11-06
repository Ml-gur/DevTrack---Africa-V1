-- ============================================
-- 🔍 DATABASE DIAGNOSTIC CHECK
-- ============================================
-- Run this to see what's currently in your database
-- This will NOT modify anything, just shows info
-- ============================================

-- Check if tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check profiles table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- Check projects table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'projects'
ORDER BY ordinal_position;

-- Check tasks table structure
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'tasks'
ORDER BY ordinal_position;

-- Check for user_id columns specifically
SELECT 
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name LIKE '%user%'
ORDER BY table_name, column_name;

-- Check RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('profiles', 'projects', 'tasks', 'notes', 'resources');

-- ============================================
-- ✅ DIAGNOSTIC COMPLETE
-- ============================================
-- Look at the results to see:
-- 1. Which tables exist
-- 2. What columns they have
-- 3. If user_id columns exist
-- ============================================
