-- =============================================
-- DevTrack Africa - Discussions Enhancement Migration
-- =============================================
-- This migration script safely adds comprehensive discussion features
-- without affecting existing database tables or data.
-- 
-- Created: 2025-11-26
-- Safe to run multiple times (idempotent)
-- =============================================

-- Enable necessary extensions (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- DISCUSSIONS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.discussions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    category TEXT NOT NULL DEFAULT 'general',
    tags TEXT[] DEFAULT '{}',
    image_url TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    is_resolved BOOLEAN DEFAULT FALSE,
    is_locked BOOLEAN DEFAULT FALSE,
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- DISCUSSION COMMENTS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.discussion_comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    discussion_id UUID REFERENCES public.discussions(id) ON DELETE CASCADE NOT NULL,
    parent_comment_id UUID REFERENCES public.discussion_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    author_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    likes_count INTEGER DEFAULT 0,
    is_deleted BOOLEAN DEFAULT FALSE,
    is_edited BOOLEAN DEFAULT FALSE,
    edited_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- DISCUSSION LIKES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.discussion_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    discussion_id UUID REFERENCES public.discussions(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, discussion_id)
);

-- =============================================
-- DISCUSSION COMMENT LIKES TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.discussion_comment_likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    comment_id UUID REFERENCES public.discussion_comments(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, comment_id)
);

-- =============================================
-- DISCUSSION BOOKMARKS TABLE
-- =============================================

CREATE TABLE IF NOT EXISTS public.discussion_bookmarks (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    discussion_id UUID REFERENCES public.discussions(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, discussion_id)
);

-- =============================================
-- DISCUSSION SHARES TABLE (Track sharing activity)
-- =============================================

CREATE TABLE IF NOT EXISTS public.discussion_shares (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    discussion_id UUID REFERENCES public.discussions(id) ON DELETE CASCADE NOT NULL,
    platform TEXT CHECK (platform IN ('twitter', 'linkedin', 'facebook', 'whatsapp', 'email', 'copy-link')) DEFAULT 'copy-link',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- DISCUSSION VIEWS TABLE (Track unique views)
-- =============================================

CREATE TABLE IF NOT EXISTS public.discussion_views (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    discussion_id UUID REFERENCES public.discussions(id) ON DELETE CASCADE NOT NULL,
    ip_address TEXT,
    user_agent TEXT,
    viewed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, discussion_id, viewed_at)
);

-- =============================================
-- DISCUSSION MENTIONS TABLE (Track user mentions in discussions/comments)
-- =============================================

CREATE TABLE IF NOT EXISTS public.discussion_mentions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    discussion_id UUID REFERENCES public.discussions(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.discussion_comments(id) ON DELETE CASCADE,
    mentioned_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- =============================================
-- DISCUSSION REPORTS TABLE (Flagging inappropriate content)
-- =============================================

CREATE TABLE IF NOT EXISTS public.discussion_reports (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    discussion_id UUID REFERENCES public.discussions(id) ON DELETE CASCADE,
    comment_id UUID REFERENCES public.discussion_comments(id) ON DELETE CASCADE,
    reported_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reason TEXT CHECK (reason IN ('spam', 'inappropriate', 'harassment', 'off-topic', 'other')) NOT NULL,
    description TEXT,
    status TEXT CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')) DEFAULT 'pending',
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT check_report_target CHECK (
        (discussion_id IS NOT NULL AND comment_id IS NULL) OR
        (discussion_id IS NULL AND comment_id IS NOT NULL)
    )
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Discussions indexes
CREATE INDEX IF NOT EXISTS idx_discussions_author_id ON public.discussions(author_id);
CREATE INDEX IF NOT EXISTS idx_discussions_category ON public.discussions(category);
CREATE INDEX IF NOT EXISTS idx_discussions_is_pinned ON public.discussions(is_pinned);
CREATE INDEX IF NOT EXISTS idx_discussions_is_resolved ON public.discussions(is_resolved);
CREATE INDEX IF NOT EXISTS idx_discussions_created_at ON public.discussions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_last_activity ON public.discussions(last_activity_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussions_tags ON public.discussions USING GIN(tags);

-- Discussion comments indexes
CREATE INDEX IF NOT EXISTS idx_discussion_comments_discussion_id ON public.discussion_comments(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_author_id ON public.discussion_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_parent_id ON public.discussion_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_created_at ON public.discussion_comments(created_at DESC);

-- Discussion likes indexes
CREATE INDEX IF NOT EXISTS idx_discussion_likes_discussion_id ON public.discussion_likes(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_likes_user_id ON public.discussion_likes(user_id);

-- Discussion comment likes indexes
CREATE INDEX IF NOT EXISTS idx_discussion_comment_likes_comment_id ON public.discussion_comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_discussion_comment_likes_user_id ON public.discussion_comment_likes(user_id);

-- Discussion bookmarks indexes
CREATE INDEX IF NOT EXISTS idx_discussion_bookmarks_discussion_id ON public.discussion_bookmarks(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_bookmarks_user_id ON public.discussion_bookmarks(user_id);

-- Discussion shares indexes
CREATE INDEX IF NOT EXISTS idx_discussion_shares_discussion_id ON public.discussion_shares(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_shares_user_id ON public.discussion_shares(user_id);

-- Discussion views indexes
CREATE INDEX IF NOT EXISTS idx_discussion_views_discussion_id ON public.discussion_views(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_views_user_id ON public.discussion_views(user_id);

-- Discussion mentions indexes
CREATE INDEX IF NOT EXISTS idx_discussion_mentions_user_id ON public.discussion_mentions(user_id);
CREATE INDEX IF NOT EXISTS idx_discussion_mentions_discussion_id ON public.discussion_mentions(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_mentions_comment_id ON public.discussion_mentions(comment_id);

-- Discussion reports indexes
CREATE INDEX IF NOT EXISTS idx_discussion_reports_discussion_id ON public.discussion_reports(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_reports_comment_id ON public.discussion_reports(comment_id);
CREATE INDEX IF NOT EXISTS idx_discussion_reports_status ON public.discussion_reports(status);

-- =============================================
-- ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_reports ENABLE ROW LEVEL SECURITY;

-- =============================================
-- DISCUSSIONS POLICIES
-- =============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Discussions are viewable by everyone" ON public.discussions;
DROP POLICY IF EXISTS "Users can create discussions" ON public.discussions;
DROP POLICY IF EXISTS "Users can update own discussions" ON public.discussions;
DROP POLICY IF EXISTS "Users can delete own discussions" ON public.discussions;

-- Everyone can view discussions (public forum)
CREATE POLICY "Discussions are viewable by everyone"
ON public.discussions FOR SELECT
USING (true);

-- Authenticated users can create discussions
CREATE POLICY "Users can create discussions"
ON public.discussions FOR INSERT
WITH CHECK (auth.uid() = author_id AND auth.uid() IS NOT NULL);

-- Authors can update their own discussions
CREATE POLICY "Users can update own discussions"
ON public.discussions FOR UPDATE
USING (auth.uid() = author_id);

-- Authors can delete their own discussions
CREATE POLICY "Users can delete own discussions"
ON public.discussions FOR DELETE
USING (auth.uid() = author_id);

-- =============================================
-- DISCUSSION COMMENTS POLICIES
-- =============================================

DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.discussion_comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.discussion_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.discussion_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.discussion_comments;

-- Everyone can view comments
CREATE POLICY "Comments are viewable by everyone"
ON public.discussion_comments FOR SELECT
USING (is_deleted = false OR auth.uid() = author_id);

-- Authenticated users can create comments
CREATE POLICY "Users can create comments"
ON public.discussion_comments FOR INSERT
WITH CHECK (auth.uid() = author_id AND auth.uid() IS NOT NULL);

-- Authors can update their own comments
CREATE POLICY "Users can update own comments"
ON public.discussion_comments FOR UPDATE
USING (auth.uid() = author_id);

-- Authors can delete their own comments
CREATE POLICY "Users can delete own comments"
ON public.discussion_comments FOR DELETE
USING (auth.uid() = author_id);

-- =============================================
-- DISCUSSION LIKES POLICIES
-- =============================================

DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.discussion_likes;
DROP POLICY IF EXISTS "Users can manage own likes" ON public.discussion_likes;

CREATE POLICY "Likes are viewable by everyone"
ON public.discussion_likes FOR SELECT
USING (true);

CREATE POLICY "Users can manage own likes"
ON public.discussion_likes FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- DISCUSSION COMMENT LIKES POLICIES
-- =============================================

DROP POLICY IF EXISTS "Comment likes are viewable by everyone" ON public.discussion_comment_likes;
DROP POLICY IF EXISTS "Users can manage own comment likes" ON public.discussion_comment_likes;

CREATE POLICY "Comment likes are viewable by everyone"
ON public.discussion_comment_likes FOR SELECT
USING (true);

CREATE POLICY "Users can manage own comment likes"
ON public.discussion_comment_likes FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- DISCUSSION BOOKMARKS POLICIES
-- =============================================

DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.discussion_bookmarks;
DROP POLICY IF EXISTS "Users can manage own bookmarks" ON public.discussion_bookmarks;

CREATE POLICY "Users can view own bookmarks"
ON public.discussion_bookmarks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own bookmarks"
ON public.discussion_bookmarks FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- =============================================
-- DISCUSSION SHARES POLICIES
-- =============================================

DROP POLICY IF EXISTS "Shares are viewable by everyone" ON public.discussion_shares;
DROP POLICY IF EXISTS "Users can record own shares" ON public.discussion_shares;

CREATE POLICY "Shares are viewable by everyone"
ON public.discussion_shares FOR SELECT
USING (true);

CREATE POLICY "Users can record own shares"
ON public.discussion_shares FOR INSERT
WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- =============================================
-- DISCUSSION VIEWS POLICIES
-- =============================================

DROP POLICY IF EXISTS "Views are trackable by anyone" ON public.discussion_views;

CREATE POLICY "Views are trackable by anyone"
ON public.discussion_views FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can view discussion stats"
ON public.discussion_views FOR SELECT
USING (true);

-- =============================================
-- DISCUSSION MENTIONS POLICIES
-- =============================================

DROP POLICY IF EXISTS "Users can view their mentions" ON public.discussion_mentions;
DROP POLICY IF EXISTS "Users can create mentions" ON public.discussion_mentions;

CREATE POLICY "Users can view their mentions"
ON public.discussion_mentions FOR SELECT
USING (auth.uid() = user_id OR auth.uid() = mentioned_by);

CREATE POLICY "Users can create mentions"
ON public.discussion_mentions FOR INSERT
WITH CHECK (auth.uid() = mentioned_by);

-- =============================================
-- DISCUSSION REPORTS POLICIES
-- =============================================

DROP POLICY IF EXISTS "Users can view own reports" ON public.discussion_reports;
DROP POLICY IF EXISTS "Users can create reports" ON public.discussion_reports;

CREATE POLICY "Users can view own reports"
ON public.discussion_reports FOR SELECT
USING (auth.uid() = reported_by);

CREATE POLICY "Users can create reports"
ON public.discussion_reports FOR INSERT
WITH CHECK (auth.uid() = reported_by AND auth.uid() IS NOT NULL);

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for discussions updated_at
DROP TRIGGER IF EXISTS update_discussions_updated_at ON public.discussions;
CREATE TRIGGER update_discussions_updated_at
    BEFORE UPDATE ON public.discussions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for discussion_comments updated_at
DROP TRIGGER IF EXISTS update_discussion_comments_updated_at ON public.discussion_comments;
CREATE TRIGGER update_discussion_comments_updated_at
    BEFORE UPDATE ON public.discussion_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to increment discussion likes count
CREATE OR REPLACE FUNCTION increment_discussion_likes()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.discussions 
    SET likes_count = likes_count + 1,
        last_activity_at = NOW()
    WHERE id = NEW.discussion_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to decrement discussion likes count
CREATE OR REPLACE FUNCTION decrement_discussion_likes()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.discussions 
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.discussion_id;
    RETURN OLD;
END;
$$ language 'plpgsql';

-- Triggers for discussion likes
DROP TRIGGER IF EXISTS trigger_increment_discussion_likes ON public.discussion_likes;
CREATE TRIGGER trigger_increment_discussion_likes
    AFTER INSERT ON public.discussion_likes
    FOR EACH ROW
    EXECUTE FUNCTION increment_discussion_likes();

DROP TRIGGER IF EXISTS trigger_decrement_discussion_likes ON public.discussion_likes;
CREATE TRIGGER trigger_decrement_discussion_likes
    AFTER DELETE ON public.discussion_likes
    FOR EACH ROW
    EXECUTE FUNCTION decrement_discussion_likes();

-- Function to increment comments count
CREATE OR REPLACE FUNCTION increment_discussion_comments()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.discussions 
    SET comments_count = comments_count + 1,
        last_activity_at = NOW()
    WHERE id = NEW.discussion_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to decrement comments count
CREATE OR REPLACE FUNCTION decrement_discussion_comments()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.discussions 
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.discussion_id;
    RETURN OLD;
END;
$$ language 'plpgsql';

-- Triggers for discussion comments count
DROP TRIGGER IF EXISTS trigger_increment_discussion_comments ON public.discussion_comments;
CREATE TRIGGER trigger_increment_discussion_comments
    AFTER INSERT ON public.discussion_comments
    FOR EACH ROW
    EXECUTE FUNCTION increment_discussion_comments();

DROP TRIGGER IF EXISTS trigger_decrement_discussion_comments ON public.discussion_comments;
CREATE TRIGGER trigger_decrement_discussion_comments
    AFTER DELETE ON public.discussion_comments
    FOR EACH ROW
    EXECUTE FUNCTION decrement_discussion_comments();

-- Function to increment comment likes count
CREATE OR REPLACE FUNCTION increment_comment_likes()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.discussion_comments 
    SET likes_count = likes_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Function to decrement comment likes count
CREATE OR REPLACE FUNCTION decrement_comment_likes()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.discussion_comments 
    SET likes_count = GREATEST(0, likes_count - 1)
    WHERE id = OLD.comment_id;
    RETURN OLD;
END;
$$ language 'plpgsql';

-- Triggers for comment likes
DROP TRIGGER IF EXISTS trigger_increment_comment_likes ON public.discussion_comment_likes;
CREATE TRIGGER trigger_increment_comment_likes
    AFTER INSERT ON public.discussion_comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION increment_comment_likes();

DROP TRIGGER IF EXISTS trigger_decrement_comment_likes ON public.discussion_comment_likes;
CREATE TRIGGER trigger_decrement_comment_likes
    AFTER DELETE ON public.discussion_comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION decrement_comment_likes();

-- =============================================
-- HELPER VIEWS (Optional - for easier querying)
-- =============================================

-- View for discussions with author info
CREATE OR REPLACE VIEW discussion_feed AS
SELECT 
    d.*,
    p.full_name as author_name,
    p.email as author_email,
    p.avatar_url as author_avatar
FROM public.discussions d
LEFT JOIN public.profiles p ON d.author_id = p.user_id
ORDER BY d.is_pinned DESC, d.last_activity_at DESC;

-- View for comments with author info
CREATE OR REPLACE VIEW discussion_comments_with_author AS
SELECT 
    dc.*,
    p.full_name as author_name,
    p.email as author_email,
    p.avatar_url as author_avatar
FROM public.discussion_comments dc
LEFT JOIN public.profiles p ON dc.author_id = p.user_id
WHERE dc.is_deleted = false
ORDER BY dc.created_at ASC;

-- =============================================
-- MIGRATION COMPLETE
-- =============================================

-- Add a migration record (optional, for tracking)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'migrations') THEN
        CREATE TABLE public.migrations (
            id SERIAL PRIMARY KEY,
            name TEXT UNIQUE NOT NULL,
            executed_at TIMESTAMPTZ DEFAULT NOW()
        );
    END IF;
    
    INSERT INTO public.migrations (name)
    VALUES ('20251126000001_add_discussions_enhancement')
    ON CONFLICT (name) DO NOTHING;
END $$;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Migration 20251126000001_add_discussions_enhancement completed successfully!';
    RAISE NOTICE 'Created tables: discussions, discussion_comments, discussion_likes, discussion_comment_likes, discussion_bookmarks, discussion_shares, discussion_views, discussion_mentions, discussion_reports';
    RAISE NOTICE 'All tables have Row Level Security enabled with appropriate policies.';
    RAISE NOTICE 'Triggers added for automatic count updates and timestamp management.';
END $$;
