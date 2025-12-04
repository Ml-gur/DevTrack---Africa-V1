-- Create discussions table
CREATE TABLE IF NOT EXISTS public.discussions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    image_url TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_resolved BOOLEAN DEFAULT FALSE,
    views_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    discussion_id UUID REFERENCES public.discussions(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create discussion_likes table
CREATE TABLE IF NOT EXISTS public.discussion_likes (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    discussion_id UUID REFERENCES public.discussions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, discussion_id)
);

-- Create comment_likes table
CREATE TABLE IF NOT EXISTS public.comment_likes (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, comment_id)
);

-- Create discussion_bookmarks table
CREATE TABLE IF NOT EXISTS public.discussion_bookmarks (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    discussion_id UUID REFERENCES public.discussions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, discussion_id)
);

-- Add RLS policies (examples)
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_bookmarks ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view discussions
CREATE POLICY "Discussions are viewable by everyone" ON public.discussions
    FOR SELECT USING (true);

-- Policy: Authenticated users can insert discussions
CREATE POLICY "Users can create discussions" ON public.discussions
    FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Policy: Authors can update their own discussions
CREATE POLICY "Users can update own discussions" ON public.discussions
    FOR UPDATE USING (auth.uid() = author_id);

-- (Similar policies would be needed for comments, likes, etc.)
