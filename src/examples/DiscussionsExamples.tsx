// =============================================
// Example: Discussions Component
// =============================================
// This is a starter template showing how to use the discussions service
// Copy and customize for your needs

import React, { useEffect, useState } from 'react';
import {
    getDiscussions,
    createDiscussion,
    likeDiscussion,
    unlikeDiscussion,
    hasUserLikedDiscussion,
    bookmarkDiscussion,
    unbookmarkDiscussion
} from '@/services/discussionsService';
import type { DiscussionWithAuthor, DiscussionInsert } from '@/types/discussions';

export function DiscussionsExample() {
    const [discussions, setDiscussions] = useState<DiscussionWithAuthor[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    // Load discussions on mount
    useEffect(() => {
        loadDiscussions();
    }, []);

    const loadDiscussions = async () => {
        try {
            setLoading(true);
            const data = await getDiscussions(
                {}, // filters
                { field: 'last_activity_at', order: 'desc' }, // sort
                { page: 1, pageSize: 20 } // pagination
            );

            if (Array.isArray(data)) {
                setDiscussions(data);
            } else {
                setDiscussions(data.data);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load discussions');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDiscussion = async () => {
        if (!currentUserId) {
            alert('Please log in to create a discussion');
            return;
        }

        const newDiscussion: DiscussionInsert = {
            title: "Example Discussion Title",
            content: "This is the content of the discussion...",
            author_id: currentUserId,
            category: "general",
            tags: ["example", "test"]
        };

        try {
            await createDiscussion(newDiscussion);
            await loadDiscussions(); // Reload to show new discussion
        } catch (err) {
            console.error('Error creating discussion:', err);
        }
    };

    const handleLike = async (discussionId: string) => {
        if (!currentUserId) {
            alert('Please log in to like discussions');
            return;
        }

        try {
            // Check if already liked
            const isLiked = await hasUserLikedDiscussion(discussionId, currentUserId);

            if (isLiked) {
                await unlikeDiscussion(discussionId, currentUserId);
            } else {
                await likeDiscussion(discussionId, currentUserId);
            }

            // Reload to update counts
            await loadDiscussions();
        } catch (err) {
            console.error('Error toggling like:', err);
        }
    };

    const handleBookmark = async (discussionId: string) => {
        if (!currentUserId) {
            alert('Please log in to bookmark discussions');
            return;
        }

        try {
            await bookmarkDiscussion(discussionId, currentUserId);
            alert('Discussion bookmarked!');
        } catch (err) {
            console.error('Error bookmarking:', err);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Loading discussions...</div>;
    }

    if (error) {
        return <div className="p-8 text-center text-red-600">Error: {error}</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Discussions</h1>
                <button
                    onClick={handleCreateDiscussion}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Create Discussion
                </button>
            </div>

            <div className="space-y-4">
                {discussions.map((discussion) => (
                    <div
                        key={discussion.id}
                        className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition"
                    >
                        {/* Header */}
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                                {discussion.author_name?.[0]?.toUpperCase() || discussion.author_email?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div>
                                <div className="font-semibold">{discussion.author_name || 'Unknown'}</div>
                                <div className="text-sm text-gray-500">
                                    {new Date(discussion.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>

                        {/* Title & Content */}
                        <h2 className="text-xl font-bold mb-2">{discussion.title}</h2>
                        <p className="text-gray-700 mb-4 line-clamp-3">{discussion.content}</p>

                        {/* Tags */}
                        {discussion.tags && discussion.tags.length > 0 && (
                            <div className="flex gap-2 mb-4">
                                {discussion.tags.map((tag, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                                    >
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Stats & Actions */}
                        <div className="flex items-center justify-between pt-4 border-t">
                            <div className="flex gap-6 text-sm text-gray-600">
                                <span>{discussion.likes_count} likes</span>
                                <span>{discussion.comments_count} comments</span>
                                <span>{discussion.views_count} views</span>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleLike(discussion.id)}
                                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    👍 Like
                                </button>
                                <button
                                    onClick={() => handleBookmark(discussion.id)}
                                    className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                                >
                                    🔖 Bookmark
                                </button>
                                <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                                    💬 Comment
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {discussions.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                    No discussions yet. Be the first to create one!
                </div>
            )}
        </div>
    );
}

// =============================================
// Example: Single Discussion View with Comments
// =============================================

import {
    getDiscussionById,
    getDiscussionComments,
    createComment
} from '@/services/discussionsService';
import type { DiscussionCommentWithAuthor } from '@/types/discussions';

export function DiscussionDetailExample({ discussionId }: { discussionId: string }) {
    const [discussion, setDiscussion] = useState<DiscussionWithAuthor | null>(null);
    const [comments, setComments] = useState<DiscussionCommentWithAuthor[]>([]);
    const [newCommentText, setNewCommentText] = useState('');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        loadDiscussionAndComments();
    }, [discussionId]);

    const loadDiscussionAndComments = async () => {
        try {
            const [discussionData, commentsData] = await Promise.all([
                getDiscussionById(discussionId),
                getDiscussionComments(discussionId)
            ]);
            setDiscussion(discussionData);
            setComments(commentsData);
        } catch (err) {
            console.error('Error loading discussion:', err);
        }
    };

    const handleAddComment = async () => {
        if (!currentUserId) {
            alert('Please log in to comment');
            return;
        }

        if (!newCommentText.trim()) {
            alert('Please enter a comment');
            return;
        }

        try {
            await createComment({
                discussion_id: discussionId,
                content: newCommentText,
                author_id: currentUserId
            });

            setNewCommentText('');
            await loadDiscussionAndComments(); // Reload comments
        } catch (err) {
            console.error('Error adding comment:', err);
        }
    };

    if (!discussion) {
        return <div className="p-8 text-center">Loading...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto p-6">
            {/* Discussion */}
            <div className="bg-white rounded-lg shadow-md p-8 mb-6">
                <h1 className="text-3xl font-bold mb-4">{discussion.title}</h1>

                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {discussion.author_name?.[0]?.toUpperCase() || discussion.author_email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                        <div className="font-semibold">{discussion.author_name}</div>
                        <div className="text-sm text-gray-500">
                            {new Date(discussion.created_at).toLocaleDateString()}
                        </div>
                    </div>
                </div>

                <div className="prose max-w-none mb-6">{discussion.content}</div>

                <div className="flex gap-6 text-sm text-gray-600 pt-6 border-t">
                    <span>👍 {discussion.likes_count} likes</span>
                    <span>💬 {discussion.comments_count} comments</span>
                    <span>👁 {discussion.views_count} views</span>
                </div>
            </div>

            {/* Comments Section */}
            <div className="bg-white rounded-lg shadow-md p-8">
                <h2 className="text-2xl font-bold mb-6">Comments ({comments.length})</h2>

                {/* Add Comment Form */}
                <div className="mb-8">
                    <textarea
                        value={newCommentText}
                        onChange={(e) => setNewCommentText(e.target.value)}
                        placeholder="Write a comment..."
                        className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                    />
                    <button
                        onClick={handleAddComment}
                        className="mt-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Post Comment
                    </button>
                </div>

                {/* Comments List */}
                <div className="space-y-6">
                    {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-4 pb-6 border-b last:border-b-0">
                            <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                                {comment.author_name?.[0]?.toUpperCase() || comment.author_email?.[0]?.toUpperCase() || '?'}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="font-semibold">{comment.author_name}</span>
                                    <span className="text-sm text-gray-500">
                                        {new Date(comment.created_at).toLocaleDateString()}
                                    </span>
                                    {comment.is_edited && (
                                        <span className="text-xs text-gray-400">(edited)</span>
                                    )}
                                </div>
                                <p className="text-gray-700">{comment.content}</p>
                                <div className="mt-2 flex gap-4 text-sm">
                                    <button className="text-gray-600 hover:text-blue-600">
                                        👍 {comment.likes_count}
                                    </button>
                                    <button className="text-gray-600 hover:text-blue-600">
                                        Reply
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {comments.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        No comments yet. Be the first to comment!
                    </div>
                )}
            </div>
        </div>
    );
}

// =============================================
// Example: Real-time Comments
// =============================================

import { subscribeToDiscussionComments } from '@/services/discussionsService';

export function DiscussionWithRealtime({ discussionId }: { discussionId: string }) {
    const [comments, setComments] = useState<DiscussionCommentWithAuthor[]>([]);

    useEffect(() => {
        // Load initial comments
        getDiscussionComments(discussionId).then(setComments);

        // Subscribe to new comments
        const subscription = subscribeToDiscussionComments(
            discussionId,
            (newComment) => {
                // Add new comment to the list
                setComments((prev) => [...prev, newComment as any]);
            }
        );

        // Cleanup subscription on unmount
        return () => {
            subscription.unsubscribe();
        };
    }, [discussionId]);

    return (
        <div>
            {/* Your UI here */}
            <p>Real-time comments: {comments.length}</p>
        </div>
    );
}
