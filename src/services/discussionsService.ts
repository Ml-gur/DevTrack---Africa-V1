// =============================================
// DevTrack Africa - Discussions Service
// =============================================
// Service for interacting with discussions database tables

import { supabase } from '@/lib/supabaseClient';
import type {
  Discussion,
  DiscussionWithAuthor,
  DiscussionComment,
  DiscussionCommentWithAuthor,
  DiscussionInsert,
  DiscussionCommentInsert,
  DiscussionUpdate,
  DiscussionCommentUpdate,
  DiscussionFilters,
  DiscussionSortOptions,
  PaginationParams,
  PaginatedResponse
} from '@/types/discussions';

// =============================================
// DISCUSSIONS CRUD
// =============================================

/**
 * Get all discussions with pagination and filtering
 */
export async function getDiscussions(
  filters?: DiscussionFilters,
  sort: DiscussionSortOptions = { field: 'last_activity_at', order: 'desc' },
  pagination?: PaginationParams
) {
  let query = supabase
    .from('discussion_feed')
    .select('*', { count: 'exact' });

  // Apply filters
  if (filters?.category) {
    query = query.eq('category', filters.category);
  }
  if (filters?.author_id) {
    query = query.eq('author_id', filters.author_id);
  }
  if (filters?.is_pinned !== undefined) {
    query = query.eq('is_pinned', filters.is_pinned);
  }
  if (filters?.is_resolved !== undefined) {
    query = query.eq('is_resolved', filters.is_resolved);
  }
  if (filters?.is_locked !== undefined) {
    query = query.eq('is_locked', filters.is_locked);
  }
  if (filters?.tags && filters.tags.length > 0) {
    query = query.contains('tags', filters.tags);
  }
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`);
  }

  // Apply sorting
  query = query.order(sort.field, { ascending: sort.order === 'asc' });

  // Apply pagination
  if (pagination) {
    const start = (pagination.page - 1) * pagination.pageSize;
    const end = start + pagination.pageSize - 1;
    query = query.range(start, end);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  if (pagination && count !== null) {
    return {
      data: data as DiscussionWithAuthor[],
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        total: count,
        totalPages: Math.ceil(count / pagination.pageSize)
      }
    } as PaginatedResponse<DiscussionWithAuthor>;
  }

  return data as DiscussionWithAuthor[];
}

/**
 * Get a single discussion by ID
 */
export async function getDiscussionById(id: string) {
  const { data, error } = await supabase
    .from('discussion_feed')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as DiscussionWithAuthor;
}

/**
 * Create a new discussion
 */
export async function createDiscussion(discussion: DiscussionInsert) {
  const { data, error } = await supabase
    .from('discussions')
    .insert(discussion)
    .select()
    .single();

  if (error) throw error;
  return data as Discussion;
}

/**
 * Update a discussion
 */
export async function updateDiscussion(id: string, updates: DiscussionUpdate) {
  const { data, error } = await supabase
    .from('discussions')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Discussion;
}

/**
 * Delete a discussion
 */
export async function deleteDiscussion(id: string) {
  const { error } = await supabase
    .from('discussions')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Increment discussion view count
 */
export async function trackDiscussionView(discussionId: string, userId?: string) {
  const { error } = await supabase
    .from('discussion_views')
    .insert({
      discussion_id: discussionId,
      user_id: userId
    });

  // Silently fail if already viewed (due to unique constraint)
  if (error && !error.message.includes('duplicate')) {
    console.error('Error tracking view:', error);
  }

  // Update views count
  const { error: updateError } = await supabase.rpc('increment_discussion_views', {
    discussion_id: discussionId
  });

  if (updateError) {
    console.error('Error incrementing views:', updateError);
  }
}

// =============================================
// COMMENTS CRUD
// =============================================

/**
 * Get comments for a discussion
 */
export async function getDiscussionComments(discussionId: string) {
  const { data, error } = await supabase
    .from('discussion_comments_with_author')
    .select('*')
    .eq('discussion_id', discussionId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as DiscussionCommentWithAuthor[];
}

/**
 * Create a comment
 */
export async function createComment(comment: DiscussionCommentInsert) {
  const { data, error } = await supabase
    .from('discussion_comments')
    .insert(comment)
    .select()
    .single();

  if (error) throw error;
  return data as DiscussionComment;
}

/**
 * Update a comment
 */
export async function updateComment(id: string, updates: DiscussionCommentUpdate) {
  const { data, error } = await supabase
    .from('discussion_comments')
    .update({
      ...updates,
      is_edited: true,
      edited_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as DiscussionComment;
}

/**
 * Delete a comment (soft delete)
 */
export async function deleteComment(id: string) {
  const { data, error } = await supabase
    .from('discussion_comments')
    .update({ is_deleted: true })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as DiscussionComment;
}

// =============================================
// LIKES
// =============================================

/**
 * Like a discussion
 */
export async function likeDiscussion(discussionId: string, userId: string) {
  const { error } = await supabase
    .from('discussion_likes')
    .insert({
      discussion_id: discussionId,
      user_id: userId
    });

  if (error) throw error;
}

/**
 * Unlike a discussion
 */
export async function unlikeDiscussion(discussionId: string, userId: string) {
  const { error } = await supabase
    .from('discussion_likes')
    .delete()
    .eq('discussion_id', discussionId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Check if user liked a discussion
 */
export async function hasUserLikedDiscussion(discussionId: string, userId: string) {
  const { data, error } = await supabase
    .from('discussion_likes')
    .select('id')
    .eq('discussion_id', discussionId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

/**
 * Like a comment
 */
export async function likeComment(commentId: string, userId: string) {
  const { error } = await supabase
    .from('discussion_comment_likes')
    .insert({
      comment_id: commentId,
      user_id: userId
    });

  if (error) throw error;
}

/**
 * Unlike a comment
 */
export async function unlikeComment(commentId: string, userId: string) {
  const { error } = await supabase
    .from('discussion_comment_likes')
    .delete()
    .eq('comment_id', commentId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Check if user liked a comment
 */
export async function hasUserLikedComment(commentId: string, userId: string) {
  const { data, error } = await supabase
    .from('discussion_comment_likes')
    .select('id')
    .eq('comment_id', commentId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

// =============================================
// BOOKMARKS
// =============================================

/**
 * Bookmark a discussion
 */
export async function bookmarkDiscussion(discussionId: string, userId: string) {
  const { error } = await supabase
    .from('discussion_bookmarks')
    .insert({
      discussion_id: discussionId,
      user_id: userId
    });

  if (error) throw error;
}

/**
 * Remove bookmark
 */
export async function unbookmarkDiscussion(discussionId: string, userId: string) {
  const { error } = await supabase
    .from('discussion_bookmarks')
    .delete()
    .eq('discussion_id', discussionId)
    .eq('user_id', userId);

  if (error) throw error;
}

/**
 * Check if user bookmarked a discussion
 */
export async function hasUserBookmarkedDiscussion(discussionId: string, userId: string) {
  const { data, error } = await supabase
    .from('discussion_bookmarks')
    .select('id')
    .eq('discussion_id', discussionId)
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return !!data;
}

/**
 * Get user's bookmarked discussions
 */
export async function getUserBookmarks(userId: string) {
  const { data, error } = await supabase
    .from('discussion_bookmarks')
    .select(`
      id,
      created_at,
      discussion:discussions (
        *,
        author:profiles (
          full_name,
          username,
          avatar_url
        )
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

// =============================================
// SHARES
// =============================================

/**
 * Track discussion share
 */
export async function trackDiscussionShare(
  discussionId: string,
  platform: 'twitter' | 'linkedin' | 'facebook' | 'whatsapp' | 'email' | 'copy-link',
  userId: string
) {
  const { error } = await supabase
    .from('discussion_shares')
    .insert({
      discussion_id: discussionId,
      platform,
      user_id: userId
    });

  if (error) throw error;
}

// =============================================
// REPORTS
// =============================================

/**
 * Report a discussion or comment
 */
export async function reportContent(
  contentId: string,
  contentType: 'discussion' | 'comment',
  reason: 'spam' | 'inappropriate' | 'harassment' | 'off-topic' | 'other',
  description: string,
  userId: string
) {
  const { error } = await supabase
    .from('discussion_reports')
    .insert({
      [contentType === 'discussion' ? 'discussion_id' : 'comment_id']: contentId,
      reported_by: userId,
      reason,
      description
    });

  if (error) throw error;
}

// =============================================
// REALTIME SUBSCRIPTIONS
// =============================================

/**
 * Subscribe to new comments on a discussion
 */
export function subscribeToDiscussionComments(
  discussionId: string,
  callback: (comment: DiscussionComment) => void
) {
  return supabase
    .channel(`discussion-${discussionId}-comments`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'discussion_comments',
        filter: `discussion_id=eq.${discussionId}`
      },
      (payload) => callback(payload.new as DiscussionComment)
    )
    .subscribe();
}

/**
 * Subscribe to discussion updates
 */
export function subscribeToDiscussion(
  discussionId: string,
  callback: (discussion: Discussion) => void
) {
  return supabase
    .channel(`discussion-${discussionId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'discussions',
        filter: `id=eq.${discussionId}`
      },
      (payload) => callback(payload.new as Discussion)
    )
    .subscribe();
}
