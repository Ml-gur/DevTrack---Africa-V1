# Discussions Enhancement Migration - Quick Reference Guide

## 📋 Overview
This migration adds comprehensive discussion forum functionality to DevTrack Africa without affecting any existing database tables or data.

**Migration File:** `supabase/migrations/20251126000001_add_discussions_enhancement.sql`

---

## 🗄️ New Tables Created

### 1. **discussions**
Main table for discussion posts.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| title | TEXT | Discussion title |
| content | TEXT | Main content/body |
| author_id | UUID | Reference to auth.users |
| category | TEXT | Discussion category (e.g., "general", "help", "showcase") |
| tags | TEXT[] | Array of tags |
| image_url | TEXT | Optional featured image |
| is_pinned | BOOLEAN | Whether discussion is pinned to top |
| is_resolved | BOOLEAN | Whether the discussion is resolved |
| is_locked | BOOLEAN | Whether comments are locked |
| views_count | INTEGER | Number of views (auto-updated) |
| likes_count | INTEGER | Number of likes (auto-updated via trigger) |
| comments_count | INTEGER | Number of comments (auto-updated via trigger) |
| last_activity_at | TIMESTAMPTZ | Last activity timestamp |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp (auto-updated via trigger) |

### 2. **discussion_comments**
Comments on discussions with nested reply support.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| discussion_id | UUID | Reference to discussions |
| parent_comment_id | UUID | For nested replies (nullable) |
| content | TEXT | Comment content |
| author_id | UUID | Reference to auth.users |
| likes_count | INTEGER | Number of likes (auto-updated) |
| is_deleted | BOOLEAN | Soft delete flag |
| is_edited | BOOLEAN | Whether comment was edited |
| edited_at | TIMESTAMPTZ | Edit timestamp |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### 3. **discussion_likes**
Track who liked which discussions.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Reference to auth.users |
| discussion_id | UUID | Reference to discussions |
| created_at | TIMESTAMPTZ | When the like was created |

**Unique constraint:** (user_id, discussion_id) - prevents duplicate likes

### 4. **discussion_comment_likes**
Track who liked which comments.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Reference to auth.users |
| comment_id | UUID | Reference to discussion_comments |
| created_at | TIMESTAMPTZ | When the like was created |

**Unique constraint:** (user_id, comment_id)

### 5. **discussion_bookmarks**
Users can bookmark discussions for later.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Reference to auth.users |
| discussion_id | UUID | Reference to discussions |
| created_at | TIMESTAMPTZ | When bookmarked |

**Unique constraint:** (user_id, discussion_id)

### 6. **discussion_shares**
Track social sharing activity.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Reference to auth.users |
| discussion_id | UUID | Reference to discussions |
| platform | TEXT | 'twitter', 'linkedin', 'facebook', 'whatsapp', 'email', 'copy-link' |
| created_at | TIMESTAMPTZ | When shared |

### 7. **discussion_views**
Track unique and anonymous views.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Reference to auth.users (nullable for anonymous) |
| discussion_id | UUID | Reference to discussions |
| ip_address | TEXT | Optional IP tracking |
| user_agent | TEXT | Optional user agent |
| viewed_at | TIMESTAMPTZ | When viewed |

### 8. **discussion_mentions**
Track @mentions in discussions and comments.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User who was mentioned |
| discussion_id | UUID | Discussion where mentioned (nullable) |
| comment_id | UUID | Comment where mentioned (nullable) |
| mentioned_by | UUID | User who did the mentioning |
| is_read | BOOLEAN | Whether notification was read |
| created_at | TIMESTAMPTZ | When mentioned |

### 9. **discussion_reports**
Flagging system for inappropriate content.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| discussion_id | UUID | Reported discussion (nullable) |
| comment_id | UUID | Reported comment (nullable) |
| reported_by | UUID | User who reported |
| reason | TEXT | 'spam', 'inappropriate', 'harassment', 'off-topic', 'other' |
| description | TEXT | Additional details |
| status | TEXT | 'pending', 'reviewed', 'resolved', 'dismissed' |
| reviewed_by | UUID | Admin who reviewed (nullable) |
| reviewed_at | TIMESTAMPTZ | Review timestamp (nullable) |
| created_at | TIMESTAMPTZ | Report timestamp |

---

## 🔐 Row Level Security (RLS)

All tables have RLS enabled with the following policies:

### Discussions
- ✅ **View:** Everyone (public forum)
- ✅ **Create:** Authenticated users only
- ✅ **Update:** Authors only
- ✅ **Delete:** Authors only

### Comments
- ✅ **View:** Everyone (unless soft-deleted and not the author)
- ✅ **Create:** Authenticated users only
- ✅ **Update:** Comment authors only
- ✅ **Delete:** Comment authors only

### Likes (both discussion and comment)
- ✅ **View:** Everyone
- ✅ **Create/Delete:** Users can manage their own likes only

### Bookmarks
- ✅ **View:** Users can only see their own bookmarks
- ✅ **Create/Delete:** Users can manage their own bookmarks only

### Other Tables
Similar secure policies ensuring users can only manage their own data.

---

## 🚀 Automatic Features (Database Triggers)

The following counts are **automatically updated** via database triggers:

1. **`discussions.likes_count`** - Incremented/decremented when likes are added/removed
2. **`discussions.comments_count`** - Incremented/decremented when comments are added/removed
3. **`discussion_comments.likes_count`** - Incremented/decremented when comment likes are added/removed
4. **`discussions.updated_at`** - Auto-updated on any change
5. **`discussion_comments.updated_at`** - Auto-updated on any change
6. **`discussions.last_activity_at`** - Updated when likes or comments are added

---

## 📊 Helper Views Created

### `discussion_feed`
Pre-joined view of discussions with author information:
```sql
SELECT * FROM discussion_feed
ORDER BY is_pinned DESC, last_activity_at DESC;
```

### `discussion_comments_with_author`
Pre-joined view of comments with author information:
```sql
SELECT * FROM discussion_comments_with_author
WHERE discussion_id = 'some-uuid'
ORDER BY created_at ASC;
```

---

## 🔍 Indexes for Performance

All tables are properly indexed on:
- Foreign keys (author_id, discussion_id, etc.)
- Sort columns (created_at, last_activity_at)
- Filter columns (category, is_pinned, status)
- GIN indexes for array columns (tags)

---

## ✅ Safety Features

1. **Idempotent:** Can be run multiple times safely
   - Uses `CREATE TABLE IF NOT EXISTS`
   - Uses `DROP POLICY IF EXISTS` before creating policies
   - Uses `DROP TRIGGER IF EXISTS` before creating triggers

2. **Non-Destructive:**
   - No `DROP TABLE` statements
   - No data deletion
   - All existing tables remain untouched

3. **Referential Integrity:**
   - All foreign keys have `ON DELETE CASCADE`
   - Unique constraints prevent duplicates
   - Check constraints ensure valid data

4. **Migration Tracking:**
   - Creates a `migrations` table if it doesn't exist
   - Records this migration execution

---

## 📝 How to Apply

### Option 1: Supabase Dashboard (Recommended)
1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy the entire contents of `supabase/migrations/20251126000001_add_discussions_enhancement.sql`
4. Paste and click **Run**

### Option 2: Supabase CLI
```bash
supabase migration up
```

### Option 3: Manual SQL Execution
Run the SQL file in your preferred PostgreSQL client.

---

## 🧪 Testing the Migration

After running the migration, you can verify it worked:

```sql
-- Check tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'discussion%';

-- Check policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE tablename LIKE 'discussion%';

-- Check triggers
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE event_object_table LIKE 'discussion%';
```

---

## 🎨 Frontend Integration

Use the TypeScript types from `src/types/discussions.ts`:

```typescript
import { Discussion, DiscussionComment, DiscussionInsert } from '@/types/discussions';

// Create a new discussion
const newDiscussion: DiscussionInsert = {
  title: "How do I deploy to production?",
  content: "I'm having trouble deploying...",
  author_id: userId,
  category: "help",
  tags: ["deployment", "production"]
};

// Insert to database
const { data, error } = await supabase
  .from('discussions')
  .insert(newDiscussion)
  .select()
  .single();
```

---

## 📌 Next Steps

1. ✅ Run the migration
2. ✅ Test basic CRUD operations
3. Update your frontend components to use the new tables
4. Implement discussion creation UI
5. Implement comment system
6. Add like/bookmark functionality
7. Implement search and filtering

---

## 🆘 Rollback (if needed)

If you need to remove these tables:

```sql
-- WARNING: This will delete all discussion data permanently
DROP TABLE IF EXISTS public.discussion_reports CASCADE;
DROP TABLE IF EXISTS public.discussion_mentions CASCADE;
DROP TABLE IF EXISTS public.discussion_views CASCADE;
DROP TABLE IF EXISTS public.discussion_shares CASCADE;
DROP TABLE IF EXISTS public.discussion_bookmarks CASCADE;
DROP TABLE IF EXISTS public.discussion_comment_likes CASCADE;
DROP TABLE IF EXISTS public.discussion_likes CASCADE;
DROP TABLE IF EXISTS public.discussion_comments CASCADE;
DROP TABLE IF EXISTS public.discussions CASCADE;

DROP VIEW IF EXISTS discussion_feed;
DROP VIEW IF EXISTS discussion_comments_with_author;

DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
DROP FUNCTION IF EXISTS increment_discussion_likes CASCADE;
DROP FUNCTION IF EXISTS decrement_discussion_likes CASCADE;
DROP FUNCTION IF EXISTS increment_discussion_comments CASCADE;
DROP FUNCTION IF EXISTS decrement_discussion_comments CASCADE;
DROP FUNCTION IF EXISTS increment_comment_likes CASCADE;
DROP FUNCTION IF EXISTS decrement_comment_likes CASCADE;
```

---

## 📞 Support

If you encounter any issues:
1. Check the Supabase logs for error messages
2. Verify all existing tables (profiles, auth.users) exist
3. Ensure you have proper permissions
4. Check that extensions (uuid-ossp, pgcrypto) are enabled

---

**Created:** 2025-11-26  
**Status:** Production Ready ✅  
**Safe to Run:** Yes ✅
