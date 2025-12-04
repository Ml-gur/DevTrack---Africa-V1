-- 1. Forcefully add the column (using a DO block to handle existence check safely)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'projects' 
        AND column_name = 'images'
    ) THEN
        ALTER TABLE public.projects ADD COLUMN images text[] DEFAULT '{}';
    END IF;
END $$;

-- 2. Notify PostgREST to reload the schema cache (Critical for API to see the new column)
NOTIFY pgrst, 'reload schema';

-- 3. Verify the column exists (Run this and check the output)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'projects'
AND column_name = 'images';
