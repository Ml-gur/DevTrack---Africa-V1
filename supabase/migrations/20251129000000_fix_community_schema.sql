-- Rename comments to discussion_comments if it exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'comments') THEN
        ALTER TABLE public.comments RENAME TO discussion_comments;
    END IF;
END $$;

-- Create discussion_comments if it doesn't exist (and wasn't renamed)
CREATE TABLE IF NOT EXISTS public.discussion_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    discussion_id UUID REFERENCES public.discussions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Create discussion_feed view
CREATE OR REPLACE VIEW public.discussion_feed AS
SELECT 
    d.id,
    d.title,
    d.content,
    d.author_id,
    d.category,
    d.tags,
    d.image_url,
    d.is_pinned,
    d.is_resolved,
    d.views_count,
    d.created_at,
    d.updated_at,
    p.full_name AS author_name,
    p.email AS author_email,
    p.avatar_url AS author_avatar,
    (SELECT COUNT(*) FROM public.discussion_likes dl WHERE dl.discussion_id = d.id) AS likes_count,
    (SELECT COUNT(*) FROM public.discussion_comments c WHERE c.discussion_id = d.id) AS comments_count
FROM public.discussions d
LEFT JOIN public.profiles p ON d.author_id = p.id;

-- Create increment_discussion_likes RPC
CREATE OR REPLACE FUNCTION increment_discussion_likes(row_id UUID)
RETURNS VOID AS $$
BEGIN
    -- Check if user already liked
    IF EXISTS (SELECT 1 FROM public.discussion_likes WHERE discussion_id = row_id AND user_id = auth.uid()) THEN
        -- Unlike
        DELETE FROM public.discussion_likes WHERE discussion_id = row_id AND user_id = auth.uid();
    ELSE
        -- Like
        INSERT INTO public.discussion_likes (discussion_id, user_id) VALUES (row_id, auth.uid());
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
