# Discussions Database Schema - Entity Relationship Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DISCUSSIONS DATABASE SCHEMA                           │
│                         DevTrack Africa Platform                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────┐
│    auth.users        │
│  (Supabase Auth)     │
├──────────────────────┤
│ • id (UUID) PK       │
│ • email              │
│ • created_at         │
└──────────┬───────────┘
           │
           │ Referenced by all tables as author_id/user_id
           │
     ┌─────┴──────┬─────────────┬──────────────┬────────────┐
     │            │             │              │            │
     ▼            ▼             ▼              ▼            ▼
┌──────────┐ ┌─────────┐ ┌──────────┐ ┌─────────────┐ ┌────────────┐
│DISCUSSIONS│ │ LIKES   │ │BOOKMARKS │ │   SHARES    │ │   VIEWS    │
└──────────┘ └─────────┘ └──────────┘ └─────────────┘ └────────────┘


═══════════════════════════════════════════════════════════════════════════════
                          CORE DISCUSSION TABLES
═══════════════════════════════════════════════════════════════════════════════

┌────────────────────────────────────────────┐
│          DISCUSSIONS (Main Table)          │
├────────────────────────────────────────────┤
│ • id                    UUID PK            │
│ • title                 TEXT               │
│ • content               TEXT               │
│ • author_id             UUID FK ──────┐    │
│ • category              TEXT          │    │
│ • tags                  TEXT[]        │    │
│ • image_url             TEXT          │    │
│ • is_pinned             BOOLEAN       │    │
│ • is_resolved           BOOLEAN       │    │
│ • is_locked             BOOLEAN       │    │
│ • views_count           INT (auto)    │    │
│ • likes_count           INT (auto)◄───┼────┼─── Auto-updated by trigger
│ • comments_count        INT (auto)◄───┼────┼─── Auto-updated by trigger
│ • last_activity_at      TIMESTAMP◄────┼────┼─── Auto-updated by trigger
│ • created_at            TIMESTAMP     │    │
│ • updated_at            TIMESTAMP◄────┼────┘─── Auto-updated by trigger
└───────────┬────────────────────────────────┘
            │
            │ Referenced by (1-to-many)
            │
    ┌───────┴──────┬───────────┬──────────┬─────────┬─────────┐
    │              │           │          │         │         │
    ▼              ▼           ▼          ▼         ▼         ▼


┌──────────────────────────────────────────────────────────────────┐
│              DISCUSSION_COMMENTS (Nested Comments)               │
├──────────────────────────────────────────────────────────────────┤
│ • id                    UUID PK                                  │
│ • discussion_id         UUID FK ──► discussions.id              │
│ • parent_comment_id     UUID FK ──► discussion_comments.id ◄─┐  │  Self-referencing
│ • content               TEXT                                  │  │  for nested replies
│ • author_id             UUID FK ──► auth.users.id             │  │
│ • likes_count           INT (auto) ◄──── Auto-updated         │  │
│ • is_deleted            BOOLEAN (soft delete)                 ▼  │
│ • is_edited             BOOLEAN                              ────┘
│ • edited_at             TIMESTAMP
│ • created_at            TIMESTAMP
│ • updated_at            TIMESTAMP ◄──── Auto-updated
└──────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════════
                          INTERACTION TABLES
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────┐      ┌──────────────────────────────────┐
│      DISCUSSION_LIKES           │      │   DISCUSSION_COMMENT_LIKES       │
├─────────────────────────────────┤      ├──────────────────────────────────┤
│ • id            UUID PK         │      │ • id            UUID PK          │
│ • user_id       UUID FK         │      │ • user_id       UUID FK          │
│ • discussion_id UUID FK         │      │ • comment_id    UUID FK          │
│ • created_at    TIMESTAMP       │      │ • created_at    TIMESTAMP        │
├─────────────────────────────────┤      ├──────────────────────────────────┤
│ UNIQUE(user_id, discussion_id)  │      │ UNIQUE(user_id, comment_id)      │
└─────────────────────────────────┘      └──────────────────────────────────┘
         │                                          │
         └──► Triggers increment/decrement ◄───────┘
              respective likes_count fields


┌─────────────────────────────────┐      ┌──────────────────────────────────┐
│    DISCUSSION_BOOKMARKS         │      │     DISCUSSION_SHARES            │
├─────────────────────────────────┤      ├──────────────────────────────────┤
│ • id            UUID PK         │      │ • id            UUID PK          │
│ • user_id       UUID FK         │      │ • user_id       UUID FK          │
│ • discussion_id UUID FK         │      │ • discussion_id UUID FK          │
│ • created_at    TIMESTAMP       │      │ • platform      TEXT             │
├─────────────────────────────────┤      │   ┌─ twitter                     │
│ UNIQUE(user_id, discussion_id)  │      │   ├─ linkedin                    │
└─────────────────────────────────┘      │   ├─ facebook                    │
     Users save discussions               │   ├─ whatsapp                    │
     for later reading                    │   ├─ email                       │
                                          │   └─ copy-link                   │
                                          │ • created_at    TIMESTAMP        │
                                          └──────────────────────────────────┘
                                               Track social shares analytics


┌─────────────────────────────────────────┐
│        DISCUSSION_VIEWS                 │
├─────────────────────────────────────────┤
│ • id            UUID PK                 │
│ • user_id       UUID FK (nullable)      │ ◄─── Nullable for anonymous views
│ • discussion_id UUID FK                 │
│ • ip_address    TEXT                    │
│ • user_agent    TEXT                    │
│ • viewed_at     TIMESTAMP               │
└─────────────────────────────────────────┘
   Track unique views (logged-in + anonymous)


═══════════════════════════════════════════════════════════════════════════════
                          NOTIFICATION & MODERATION
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────┐
│      DISCUSSION_MENTIONS                │
├─────────────────────────────────────────┤
│ • id            UUID PK                 │
│ • user_id       UUID FK                 │ ◄─── User who was mentioned
│ • discussion_id UUID FK (nullable)      │
│ • comment_id    UUID FK (nullable)      │
│ • mentioned_by  UUID FK                 │ ◄─── User who mentioned them
│ • is_read       BOOLEAN                 │
│ • created_at    TIMESTAMP               │
├─────────────────────────────────────────┤
│ Either discussion_id OR comment_id      │
│ must be set (not both, not neither)     │
└─────────────────────────────────────────┘
   When users @mention others


┌──────────────────────────────────────────────┐
│        DISCUSSION_REPORTS                    │
├──────────────────────────────────────────────┤
│ • id            UUID PK                      │
│ • discussion_id UUID FK (nullable)           │
│ • comment_id    UUID FK (nullable)           │
│ • reported_by   UUID FK                      │
│ • reason        TEXT ENUM                    │
│   ├─ spam                                    │
│   ├─ inappropriate                           │
│   ├─ harassment                              │
│   ├─ off-topic                               │
│   └─ other                                   │
│ • description   TEXT                         │
│ • status        TEXT ENUM                    │
│   ├─ pending                                 │
│   ├─ reviewed                                │
│   ├─ resolved                                │
│   └─ dismissed                               │
│ • reviewed_by   UUID FK (nullable)           │
│ • reviewed_at   TIMESTAMP (nullable)         │
│ • created_at    TIMESTAMP                    │
├──────────────────────────────────────────────┤
│ Either discussion_id OR comment_id           │
│ must be set (not both, not neither)          │
└──────────────────────────────────────────────┘
   Flag inappropriate content for moderation


═══════════════════════════════════════════════════════════════════════════════
                              HELPER VIEWS
═══════════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│  VIEW: discussion_feed                                          │
├─────────────────────────────────────────────────────────────────┤
│  SELECT discussions.*, profiles.full_name, profiles.username,   │
│         profiles.avatar_url                                     │
│  FROM discussions                                               │
│  LEFT JOIN profiles ON discussions.author_id = profiles.id      │
│  ORDER BY is_pinned DESC, last_activity_at DESC                 │
└─────────────────────────────────────────────────────────────────┘
   Pre-joined view with author information for easy querying


┌─────────────────────────────────────────────────────────────────┐
│  VIEW: discussion_comments_with_author                          │
├─────────────────────────────────────────────────────────────────┤
│  SELECT discussion_comments.*,                                  │
│         profiles.full_name, profiles.username, profiles.avatar  │
│  FROM discussion_comments                                       │
│  LEFT JOIN profiles ON discussion_comments.author_id = ...     │
│  WHERE is_deleted = false                                       │
└─────────────────────────────────────────────────────────────────┘
   Pre-joined comments with author info, excluding deleted


═══════════════════════════════════════════════════════════════════════════════
                          DATABASE TRIGGERS
═══════════════════════════════════════════════════════════════════════════════

TRIGGER: update_discussions_updated_at
├─ ON: discussions (BEFORE UPDATE)
└─ SETS: updated_at = NOW()

TRIGGER: update_discussion_comments_updated_at
├─ ON: discussion_comments (BEFORE UPDATE)
└─ SETS: updated_at = NOW()

TRIGGER: trigger_increment_discussion_likes
├─ ON: discussion_likes (AFTER INSERT)
└─ UPDATES: discussions.likes_count += 1, last_activity_at = NOW()

TRIGGER: trigger_decrement_discussion_likes
├─ ON: discussion_likes (AFTER DELETE)
└─ UPDATES: discussions.likes_count -= 1

TRIGGER: trigger_increment_discussion_comments
├─ ON: discussion_comments (AFTER INSERT)
└─ UPDATES: discussions.comments_count += 1, last_activity_at = NOW()

TRIGGER: trigger_decrement_discussion_comments
├─ ON: discussion_comments (AFTER DELETE)
└─ UPDATES: discussions.comments_count -= 1

TRIGGER: trigger_increment_comment_likes
├─ ON: discussion_comment_likes (AFTER INSERT)
└─ UPDATES: discussion_comments.likes_count += 1

TRIGGER: trigger_decrement_comment_likes
├─ ON: discussion_comment_likes (AFTER DELETE)
└─ UPDATES: discussion_comments.likes_count -= 1


═══════════════════════════════════════════════════════════════════════════════
                          ROW LEVEL SECURITY (RLS)
═══════════════════════════════════════════════════════════════════════════════

DISCUSSIONS:
├─ SELECT:  Everyone (public forum)
├─ INSERT:  Authenticated users (author_id = auth.uid())
├─ UPDATE:  Authors only (author_id = auth.uid())
└─ DELETE:  Authors only (author_id = auth.uid())

DISCUSSION_COMMENTS:
├─ SELECT:  Everyone (except deleted comments unless you're the author)
├─ INSERT:  Authenticated users (author_id = auth.uid())
├─ UPDATE:  Comment authors only
└─ DELETE:  Comment authors only (soft delete)

DISCUSSION_LIKES:
├─ SELECT:  Everyone
└─ ALL:     Users can manage their own likes only

DISCUSSION_COMMENT_LIKES:
├─ SELECT:  Everyone
└─ ALL:     Users can manage their own likes only

DISCUSSION_BOOKMARKS:
├─ SELECT:  Users see only their own bookmarks
└─ ALL:     Users can manage their own bookmarks only

DISCUSSION_SHARES:
├─ SELECT:  Everyone (for analytics)
└─ INSERT:  Anyone can record shares

DISCUSSION_VIEWS:
├─ SELECT:  Everyone (for analytics)
└─ INSERT:  Anyone can record views

DISCUSSION_MENTIONS:
├─ SELECT:  Mentioned user or mentioner
└─ INSERT:  Authenticated users creating mentions

DISCUSSION_REPORTS:
├─ SELECT:  Reporter sees their own reports
└─ INSERT:  Authenticated users can report content


═══════════════════════════════════════════════════════════════════════════════
                              INDEXES
═══════════════════════════════════════════════════════════════════════════════

DISCUSSIONS:
├─ idx_discussions_author_id
├─ idx_discussions_category
├─ idx_discussions_is_pinned
├─ idx_discussions_is_resolved
├─ idx_discussions_created_at (DESC)
├─ idx_discussions_last_activity (DESC)
└─ idx_discussions_tags (GIN)

DISCUSSION_COMMENTS:
├─ idx_discussion_comments_discussion_id
├─ idx_discussion_comments_author_id
├─ idx_discussion_comments_parent_id
└─ idx_discussion_comments_created_at (DESC)

All other tables have indexes on:
├─ Foreign keys (discussion_id, user_id, comment_id)
└─ Common filter fields (status, platform, etc.)


═══════════════════════════════════════════════════════════════════════════════
                          KEY RELATIONSHIPS
═══════════════════════════════════════════════════════════════════════════════

1 User → Many Discussions (author_id)
1 Discussion → Many Comments (discussion_id)
1 Comment → Many Replies (parent_comment_id, self-referencing)
1 Discussion → Many Likes (discussion_id)
1 Comment → Many Likes (comment_id)
1 User → Many Bookmarks (user_id)
1 Discussion → Many Bookmarks (discussion_id)
1 Discussion → Many Shares (discussion_id)
1 Discussion → Many Views (discussion_id)
1 Discussion → Many Mentions (discussion_id)
1 Comment → Many Mentions (comment_id)
1 Discussion → Many Reports (discussion_id)
1 Comment → Many Reports (comment_id)

CASCADE DELETE:
All tables have ON DELETE CASCADE on foreign keys
└─ When a user is deleted, all their content is removed
└─ When a discussion is deleted, all comments/likes/bookmarks are removed
└─ When a comment is deleted, all child comments are removed
```
