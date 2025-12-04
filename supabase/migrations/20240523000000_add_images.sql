-- Add image_url column to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add image_url column to discussion_comments table
ALTER TABLE discussion_comments ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Ensure discussions table has image_url (it likely does based on types, but good to be safe)
ALTER TABLE discussions ADD COLUMN IF NOT EXISTS image_url TEXT;
