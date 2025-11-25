-- ============================================================================
-- DATABASE SETUP VERIFICATION SCRIPT
-- ============================================================================
-- Run this after the main setup to verify everything is correct
-- ============================================================================

-- Check 1: Verify all tables exist
-- ============================================================================
DO $$
DECLARE
    table_count INTEGER;
    expected_tables TEXT[] := ARRAY[
        'user_profiles',
        'projects', 
        'tasks',
        'project_resources',
        'user_settings',
        'notifications'
    ];
    missing_tables TEXT[] := '{}';
    table_name TEXT;
BEGIN
    RAISE NOTICE '🔍 Checking Tables...';
    RAISE NOTICE '----------------------------------------';
    
    FOREACH table_name IN ARRAY expected_tables LOOP
        IF EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = table_name
        ) THEN
            RAISE NOTICE '✅ Table exists: %', table_name;
        ELSE
            RAISE NOTICE '❌ Table MISSING: %', table_name;
            missing_tables := array_append(missing_tables, table_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'Missing tables: %. Please run setup script again.', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE '✅ All tables exist!';
    END IF;
END $$;

-- Check 2: Verify RLS is enabled
-- ============================================================================
DO $$
DECLARE
    table_name TEXT;
    rls_enabled BOOLEAN;
    tables_to_check TEXT[] := ARRAY[
        'user_profiles',
        'projects',
        'tasks', 
        'project_resources',
        'user_settings',
        'notifications'
    ];
    tables_without_rls TEXT[] := '{}';
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔒 Checking Row Level Security...';
    RAISE NOTICE '----------------------------------------';
    
    FOREACH table_name IN ARRAY tables_to_check LOOP
        SELECT relrowsecurity INTO rls_enabled
        FROM pg_class
        WHERE relname = table_name AND relnamespace = 'public'::regnamespace;
        
        IF rls_enabled THEN
            RAISE NOTICE '✅ RLS enabled on: %', table_name;
        ELSE
            RAISE NOTICE '❌ RLS NOT enabled on: %', table_name;
            tables_without_rls := array_append(tables_without_rls, table_name);
        END IF;
    END LOOP;
    
    IF array_length(tables_without_rls, 1) > 0 THEN
        RAISE WARNING 'RLS not enabled on: %. Security may be compromised!', array_to_string(tables_without_rls, ', ');
    ELSE
        RAISE NOTICE '✅ RLS enabled on all tables!';
    END IF;
END $$;

-- Check 3: Count RLS policies
-- ============================================================================
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📋 Checking RLS Policies...';
    RAISE NOTICE '----------------------------------------';
    
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public';
    
    RAISE NOTICE '✅ Total RLS policies: %', policy_count;
    
    IF policy_count < 20 THEN
        RAISE WARNING 'Expected at least 20 policies, found %. Some may be missing.', policy_count;
    END IF;
END $$;

-- Check 4: Verify functions exist
-- ============================================================================
DO $$
DECLARE
    function_count INTEGER;
    expected_functions TEXT[] := ARRAY[
        'handle_new_user',
        'update_updated_at_column',
        'update_project_stats'
    ];
    missing_functions TEXT[] := '{}';
    func_name TEXT;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '⚙️  Checking Functions...';
    RAISE NOTICE '----------------------------------------';
    
    FOREACH func_name IN ARRAY expected_functions LOOP
        IF EXISTS (
            SELECT FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public' AND p.proname = func_name
        ) THEN
            RAISE NOTICE '✅ Function exists: %', func_name;
        ELSE
            RAISE NOTICE '❌ Function MISSING: %', func_name;
            missing_functions := array_append(missing_functions, func_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_functions, 1) > 0 THEN
        RAISE WARNING 'Missing functions: %. Auto-features may not work!', array_to_string(missing_functions, ', ');
    ELSE
        RAISE NOTICE '✅ All functions exist!';
    END IF;
END $$;

-- Check 5: Verify triggers exist
-- ============================================================================
DO $$
DECLARE
    trigger_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🔧 Checking Triggers...';
    RAISE NOTICE '----------------------------------------';
    
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE trigger_schema = 'public';
    
    RAISE NOTICE '✅ Total triggers: %', trigger_count;
    
    IF trigger_count < 5 THEN
        RAISE WARNING 'Expected at least 5 triggers, found %. Some auto-features may not work.', trigger_count;
    END IF;
END $$;

-- Check 6: Verify indexes exist
-- ============================================================================
DO $$
DECLARE
    index_count INTEGER;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📊 Checking Indexes...';
    RAISE NOTICE '----------------------------------------';
    
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname = 'public';
    
    RAISE NOTICE '✅ Total indexes: %', index_count;
    
    IF index_count < 15 THEN
        RAISE WARNING 'Expected at least 15 indexes, found %. Performance may be affected.', index_count;
    END IF;
END $$;

-- Check 7: Verify storage bucket exists
-- ============================================================================
DO $$
DECLARE
    bucket_exists BOOLEAN;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '📁 Checking Storage Bucket...';
    RAISE NOTICE '----------------------------------------';
    
    SELECT EXISTS (
        SELECT FROM storage.buckets WHERE id = 'user-files'
    ) INTO bucket_exists;
    
    IF bucket_exists THEN
        RAISE NOTICE '✅ Storage bucket "user-files" exists!';
    ELSE
        RAISE WARNING '⚠️  Storage bucket "user-files" not found. File uploads may not work.';
    END IF;
END $$;

-- Check 8: Test auto-profile creation (simulation)
-- ============================================================================
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '🧪 Testing Auto-Features...';
    RAISE NOTICE '----------------------------------------';
    
    -- Check if trigger exists
    IF EXISTS (
        SELECT FROM information_schema.triggers
        WHERE trigger_name = 'on_auth_user_created'
        AND event_object_table = 'users'
    ) THEN
        RAISE NOTICE '✅ Auto-profile creation trigger exists';
    ELSE
        RAISE WARNING '⚠️  Auto-profile creation trigger not found!';
    END IF;
    
    -- Check if updated_at triggers exist
    IF EXISTS (
        SELECT FROM information_schema.triggers
        WHERE trigger_name LIKE 'update_%_updated_at'
    ) THEN
        RAISE NOTICE '✅ Auto timestamp triggers exist';
    ELSE
        RAISE WARNING '⚠️  Auto timestamp triggers not found!';
    END IF;
    
    -- Check if project stats trigger exists
    IF EXISTS (
        SELECT FROM information_schema.triggers
        WHERE trigger_name = 'update_project_stats_on_task_change'
    ) THEN
        RAISE NOTICE '✅ Auto project stats trigger exists';
    ELSE
        RAISE WARNING '⚠️  Auto project stats trigger not found!';
    END IF;
END $$;

-- ============================================================================
-- DETAILED REPORTS
-- ============================================================================

-- Report 1: List all tables with row counts
-- ============================================================================
RAISE NOTICE '';
RAISE NOTICE '📊 Table Statistics:';
RAISE NOTICE '----------------------------------------';

SELECT 
    schemaname,
    tablename,
    COALESCE((
        SELECT COUNT(*) 
        FROM (SELECT * FROM pg_class WHERE relname = tablename LIMIT 1) t
    ), 0) as row_count
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Report 2: List all RLS policies by table
-- ============================================================================
RAISE NOTICE '';
RAISE NOTICE '🔒 RLS Policies by Table:';
RAISE NOTICE '----------------------------------------';

SELECT 
    tablename,
    COUNT(*) as policy_count,
    string_agg(policyname, ', ') as policies
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- Report 3: List all functions
-- ============================================================================
RAISE NOTICE '';
RAISE NOTICE '⚙️  Functions:';
RAISE NOTICE '----------------------------------------';

SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;

-- Report 4: List all triggers
-- ============================================================================
RAISE NOTICE '';
RAISE NOTICE '🔧 Triggers:';
RAISE NOTICE '----------------------------------------';

SELECT 
    trigger_name,
    event_object_table as table_name,
    event_manipulation as event_type
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Report 5: List all indexes
-- ============================================================================
RAISE NOTICE '';
RAISE NOTICE '📊 Indexes:';
RAISE NOTICE '----------------------------------------';

SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================
DO $$
DECLARE
    table_count INTEGER;
    policy_count INTEGER;
    function_count INTEGER;
    trigger_count INTEGER;
    index_count INTEGER;
    all_good BOOLEAN := true;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
    RAISE NOTICE '📋 FINAL VERIFICATION SUMMARY';
    RAISE NOTICE '============================================================';
    
    -- Count everything
    SELECT COUNT(*) INTO table_count FROM pg_tables WHERE schemaname = 'public';
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public';
    SELECT COUNT(*) INTO function_count FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public';
    SELECT COUNT(*) INTO trigger_count FROM information_schema.triggers WHERE trigger_schema = 'public';
    SELECT COUNT(*) INTO index_count FROM pg_indexes WHERE schemaname = 'public';
    
    RAISE NOTICE '';
    RAISE NOTICE '📊 Database Objects:';
    RAISE NOTICE '   Tables: %', table_count;
    RAISE NOTICE '   RLS Policies: %', policy_count;
    RAISE NOTICE '   Functions: %', function_count;
    RAISE NOTICE '   Triggers: %', trigger_count;
    RAISE NOTICE '   Indexes: %', index_count;
    RAISE NOTICE '';
    
    -- Verify minimum requirements
    IF table_count < 6 THEN
        RAISE NOTICE '❌ Not enough tables (expected 6+, found %)!', table_count;
        all_good := false;
    END IF;
    
    IF policy_count < 20 THEN
        RAISE NOTICE '⚠️  Not enough RLS policies (expected 20+, found %)!', policy_count;
        all_good := false;
    END IF;
    
    IF function_count < 3 THEN
        RAISE NOTICE '❌ Not enough functions (expected 3+, found %)!', function_count;
        all_good := false;
    END IF;
    
    IF trigger_count < 5 THEN
        RAISE NOTICE '⚠️  Not enough triggers (expected 5+, found %)!', trigger_count;
        all_good := false;
    END IF;
    
    -- Final verdict
    RAISE NOTICE '';
    IF all_good THEN
        RAISE NOTICE '✅ ✅ ✅  DATABASE SETUP VERIFIED! ✅ ✅ ✅';
        RAISE NOTICE '';
        RAISE NOTICE 'Everything looks good! You can now:';
        RAISE NOTICE '  1. Configure authentication in Supabase dashboard';
        RAISE NOTICE '  2. Test user registration';
        RAISE NOTICE '  3. Verify auto-profile creation';
        RAISE NOTICE '  4. Test multi-device access';
    ELSE
        RAISE NOTICE '⚠️  VERIFICATION INCOMPLETE';
        RAISE NOTICE '';
        RAISE NOTICE 'Some components may be missing.';
        RAISE NOTICE 'Please review the warnings above.';
        RAISE NOTICE 'Consider re-running the setup script.';
    END IF;
    
    RAISE NOTICE '';
    RAISE NOTICE '============================================================';
END $$;
