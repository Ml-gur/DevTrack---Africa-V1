// =============================================
// DevTrack Africa - Discussions TypeScript Types
// =============================================
// Auto-generated types matching the discussions database schema

export interface Discussion {
  id: string;
  title: string;
  content: string;
  author_id: string;
  category: string;
  tags: string[];
  image_url?: string;
  is_pinned: boolean;
  is_resolved: boolean;
  is_locked: boolean;
  views_count: number;
  likes_count: number;
  comments_count: number;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
}

export interface DiscussionComment {
  id: string;
  discussion_id: string;
  parent_comment_id?: string;
  content: string;
  author_id: string;
  likes_count: number;
  is_deleted: boolean;
  is_edited: boolean;
  edited_at?: string;
  created_at: string;
  updated_at: string;
}

export interface DiscussionLike {
  id: string;
  user_id: string;
  discussion_id: string;
  created_at: string;
}

export interface DiscussionCommentLike {
  id: string;
  user_id: string;
  comment_id: string;
  created_at: string;
}

export interface DiscussionBookmark {
  id: string;
  user_id: string;
  discussion_id: string;
  created_at: string;
}

export interface DiscussionShare {
  id: string;
  user_id: string;
  discussion_id: string;
  platform: 'twitter' | 'linkedin' | 'facebook' | 'whatsapp' | 'email' | 'copy-link';
  created_at: string;
}

export interface DiscussionView {
  id: string;
  user_id?: string;
  discussion_id: string;
  ip_address?: string;
  user_agent?: string;
  viewed_at: string;
}

export interface DiscussionMention {
  id: string;
  user_id: string;
  discussion_id?: string;
  comment_id?: string;
  mentioned_by: string;
  is_read: boolean;
  created_at: string;
}

export interface DiscussionReport {
  id: string;
  discussion_id?: string;
  comment_id?: string;
  reported_by: string;
  reason: 'spam' | 'inappropriate' | 'harassment' | 'off-topic' | 'other';
  description?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'dismissed';
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

// Extended types with author information (from views)
export interface DiscussionWithAuthor extends Discussion {
  author_name: string;
  author_email: string;
  author_avatar: string;
}

export interface DiscussionCommentWithAuthor extends DiscussionComment {
  author_name: string;
  author_email: string;
  author_avatar: string;
}

// Insert types (for creating new records)
export type DiscussionInsert = Omit<
  Discussion,
  'id' | 'is_pinned' | 'is_resolved' | 'is_locked' | 'views_count' | 'likes_count' | 'comments_count' | 'last_activity_at' | 'created_at' | 'updated_at'
> & {
  id?: string;
  is_pinned?: boolean;
  is_resolved?: boolean;
  is_locked?: boolean;
  views_count?: number;
  likes_count?: number;
  comments_count?: number;
  last_activity_at?: string;
  created_at?: string;
  updated_at?: string;
};

export type DiscussionCommentInsert = Omit<
  DiscussionComment,
  'id' | 'likes_count' | 'is_deleted' | 'is_edited' | 'edited_at' | 'created_at' | 'updated_at'
> & {
  id?: string;
  likes_count?: number;
  is_deleted?: boolean;
  is_edited?: boolean;
  edited_at?: string;
  created_at?: string;
  updated_at?: string;
};

export type DiscussionLikeInsert = Omit<DiscussionLike, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type DiscussionCommentLikeInsert = Omit<DiscussionCommentLike, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

export type DiscussionBookmarkInsert = Omit<DiscussionBookmark, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

// Update types (for updating existing records)
export type DiscussionUpdate = Partial<Omit<Discussion, 'id' | 'author_id' | 'created_at'>>;

export type DiscussionCommentUpdate = Partial<Omit<DiscussionComment, 'id' | 'discussion_id' | 'author_id' | 'created_at'>>;

// Filter types
export interface DiscussionFilters {
  category?: string;
  tags?: string[];
  author_id?: string;
  is_pinned?: boolean;
  is_resolved?: boolean;
  is_locked?: boolean;
  search?: string;
}

export interface DiscussionSortOptions {
  field: 'created_at' | 'updated_at' | 'last_activity_at' | 'likes_count' | 'comments_count' | 'views_count';
  order: 'asc' | 'desc';
}

// Pagination
export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}
