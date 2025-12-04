import { useState, useEffect } from 'react'
import { MessageSquare, Eye, Plus, X, Bookmark, ChevronDown, Send, Edit, Trash2, ThumbsUp, Bell, Image as ImageIcon, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import { toast } from 'sonner'
import { uploadToCloudinary } from '@/utils/uploadImage'

type Comment = {
    id: string
    discussion_id: string
    content: string
    author_id: string
    author_name: string
    author_email: string
    author_avatar: string | null
    likes_count: number
    created_at: string
    is_edited: boolean
    image_url?: string | null
}

type Discussion = {
    id: string
    title: string
    content: string
    author_id: string
    author_name: string
    author_email: string
    author_avatar: string | null
    category: string
    tags: string[]
    image_url: string | null
    likes_count: number
    comments_count: number
    views_count: number
    is_pinned: boolean
    is_resolved: boolean
    created_at: string
    updated_at: string
}

type Notification = {
    id: string
    discussion_id: string
    discussion_title: string
    commenter_name: string
    created_at: string
}

export default function CommunityPage() {
    const [discussions, setDiscussions] = useState<Discussion[]>([])
    const [loading, setLoading] = useState(true)
    const [activeCategory, setActiveCategory] = useState('All Discussions')
    const [sortBy, setSortBy] = useState('Most Recent')
    const [showNewDiscussionModal, setShowNewDiscussionModal] = useState(false)
    const [expandedDiscussionId, setExpandedDiscussionId] = useState<string | null>(null)
    const [joinedDiscussions, setJoinedDiscussions] = useState<Set<string>>(new Set())
    const [comments, setComments] = useState<{ [key: string]: Comment[] }>({})
    const [newComment, setNewComment] = useState<{ [key: string]: string }>({})
    const [editingDiscussion, setEditingDiscussion] = useState<Discussion | null>(null)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [showNotifications, setShowNotifications] = useState(false)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [activeMembersCount, setActiveMembersCount] = useState(0)
    const [isUploading, setIsUploading] = useState(false)
    const [newDiscussionImage, setNewDiscussionImage] = useState<File | null>(null)
    const [newCommentImage, setNewCommentImage] = useState<{ [key: string]: File | null }>({})
    const [newDiscussion, setNewDiscussion] = useState({
        title: '',
        content: '',
        tags: '',
        category: 'Tech Help & Q&A'
    })

    const categories = [
        'All Discussions',
        'Tech Help & Q&A',
        'Career Advice',
        'Project Showcase',
        'Learning Resources',
        'Job Opportunities',
        'Random Chat'
    ]

    useEffect(() => {
        const init = async () => {
            await loadDiscussions()
            loadJoinedDiscussions()
            await loadNotifications()
            loadActiveMembersCount()

            const { data: { user } } = await supabase.auth.getUser()
            setCurrentUserId(user?.id || null)
        }

        init()

        const channel = supabase
            .channel('notifications')
            .on('postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'notifications' },
                () => loadNotifications()
            )
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const loadJoinedDiscussions = () => {
        const saved = localStorage.getItem('joinedDiscussions')
        if (saved) {
            setJoinedDiscussions(new Set(JSON.parse(saved)))
        }
    }

    const saveJoinedDiscussion = (discussionId: string) => {
        const updated = new Set(joinedDiscussions)
        updated.add(discussionId)
        setJoinedDiscussions(updated)
        localStorage.setItem('joinedDiscussions', JSON.stringify([...updated]))
    }

    const loadActiveMembersCount = async () => {
        try {
            const { count, error } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })

            if (error) throw error
            setActiveMembersCount(count || 0)
        } catch (error) {
            console.error('Error loading active members count:', error)
        }
    }

    const loadNotifications = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .eq('is_read', false)
                .order('created_at', { ascending: false })
                .limit(10)

            if (error) throw error

            const transformedNotifications: Notification[] = (data || []).map(n => ({
                id: n.id,
                discussion_id: n.metadata?.discussion_id || '',
                discussion_title: n.title || '',
                commenter_name: n.metadata?.commenter_name || 'Someone',
                created_at: n.created_at
            }))

            setNotifications(transformedNotifications)
        } catch (error) {
            console.error('Error loading notifications:', error)
        }
    }

    const markNotificationAsRead = async (notificationId: string) => {
        try {
            await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId)

            await loadNotifications()
        } catch (error) {
            console.error('Error marking notification as read:', error)
        }
    }

    const loadDiscussions = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('discussion_feed')
                .select('*')
                .order('is_pinned', { ascending: false })
                .order('created_at', { ascending: false })

            if (error) throw error
            setDiscussions(data || [])
        } catch (error) {
            console.error('Error loading discussions:', error)
        } finally {
            setLoading(false)
        }
    }

    const loadComments = async (discussionId: string) => {
        try {
            const { data, error } = await supabase
                .from('discussion_comments_with_author')
                .select('*')
                .eq('discussion_id', discussionId)
                .order('created_at', { ascending: true })

            if (error) throw error
            setComments(prev => ({ ...prev, [discussionId]: data || [] }))
        } catch (error) {
            console.error('Error loading comments:', error)
        }
    }

    const trackView = async (discussionId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()

            await supabase
                .from('discussion_views')
                .insert({
                    discussion_id: discussionId,
                    user_id: user?.id || null
                })
        } catch (error) {
            console.error('Error tracking view:', error)
        }
    }

    const handleJoinDiscussion = async (discussionId: string) => {
        const isAlreadyJoined = joinedDiscussions.has(discussionId)

        if (isAlreadyJoined) {
            if (expandedDiscussionId === discussionId) {
                setExpandedDiscussionId(null)
            } else {
                setExpandedDiscussionId(discussionId)
                await loadComments(discussionId)
            }
        } else {
            setExpandedDiscussionId(discussionId)
            saveJoinedDiscussion(discussionId)
            await trackView(discussionId)
            await loadComments(discussionId)
            await loadDiscussions()
        }
    }

    const handleCreateDiscussion = async () => {
        if (!newDiscussion.title.trim() || !newDiscussion.content.trim()) {
            toast.error('Please fill in title and content')
            return
        }

        try {
            const { data: { user }, error: authError } = await supabase.auth.getUser()

            if (authError || !user) {
                toast.error('Please log in to create a discussion')
                return
            }

            setIsUploading(true)
            let imageUrl = null

            if (newDiscussionImage) {
                try {
                    imageUrl = await uploadToCloudinary(newDiscussionImage)
                } catch (error) {
                    toast.error('Failed to upload image')
                    setIsUploading(false)
                    return
                }
            }

            const tags = newDiscussion.tags
                .split(',')
                .map(t => t.trim())
                .filter(Boolean)

            const { error } = await supabase
                .from('discussions')
                .insert({
                    title: newDiscussion.title,
                    content: newDiscussion.content,
                    author_id: user.id,
                    category: newDiscussion.category === 'All Discussions' ? 'Tech Help & Q&A' : newDiscussion.category,
                    tags: tags,
                    image_url: imageUrl
                })

            if (error) throw error

            await loadDiscussions()
            setNewDiscussion({ title: '', content: '', tags: '', category: 'Tech Help & Q&A' })
            setNewDiscussionImage(null)
            setShowNewDiscussionModal(false)
            toast.success('Discussion created successfully!')
        } catch (error: any) {
            console.error('Error creating discussion:', error)
            toast.error('Failed to create discussion: ' + error.message)
        } finally {
            setIsUploading(false)
        }
    }

    const handleUpdateDiscussion = async () => {
        if (!editingDiscussion) return

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user || user.id !== editingDiscussion.author_id) {
                toast.error('You can only edit your own discussions')
                return
            }

            const { error } = await supabase
                .from('discussions')
                .update({
                    title: editingDiscussion.title,
                    content: editingDiscussion.content,
                    tags: editingDiscussion.tags
                })
                .eq('id', editingDiscussion.id)

            if (error) throw error

            await loadDiscussions()
            setEditingDiscussion(null)
            toast.success('Discussion updated successfully!')
        } catch (error: any) {
            console.error('Error updating discussion:', error)
            toast.error('Failed to update discussion: ' + error.message)
        }
    }

    const handleDeleteDiscussion = async (discussionId: string, authorId: string) => {
        if (!confirm('Are you sure you want to delete this discussion?')) return

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user || user.id !== authorId) {
                toast.error('You can only delete your own discussions')
                return
            }

            const { error } = await supabase
                .from('discussions')
                .delete()
                .eq('id', discussionId)

            if (error) throw error

            await loadDiscussions()
            toast.success('Discussion deleted successfully!')
        } catch (error: any) {
            console.error('Error deleting discussion:', error)
            toast.error('Failed to delete discussion: ' + error.message)
        }
    }

    const handleAddComment = async (discussionId: string) => {
        const commentContent = newComment[discussionId]?.trim()
        if (!commentContent && !newCommentImage[discussionId]) return

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                toast.error('Please log in to comment')
                return
            }

            let imageUrl = null
            if (newCommentImage[discussionId]) {
                const toastId = toast.loading('Uploading image...')
                try {
                    imageUrl = await uploadToCloudinary(newCommentImage[discussionId]!)
                    toast.dismiss(toastId)
                } catch (error) {
                    toast.dismiss(toastId)
                    toast.error('Failed to upload image')
                    return
                }
            }

            const { error } = await supabase
                .from('discussion_comments')
                .insert({
                    discussion_id: discussionId,
                    content: commentContent || '',
                    author_id: user.id,
                    image_url: imageUrl
                })

            if (error) throw error

            const discussion = discussions.find(d => d.id === discussionId)
            if (discussion && discussion.author_id !== user.id) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('full_name')
                    .eq('user_id', user.id)
                    .single()

                await supabase
                    .from('notifications')
                    .insert({
                        user_id: discussion.author_id,
                        type: 'community',
                        title: 'New comment on your discussion',
                        message: `${profile?.full_name || 'Someone'} commented on "${discussion.title}"`,
                        metadata: {
                            discussion_id: discussionId,
                            commenter_name: profile?.full_name || 'Someone'
                        }
                    })
            }

            setNewComment(prev => ({ ...prev, [discussionId]: '' }))
            setNewCommentImage(prev => {
                const newState = { ...prev }
                delete newState[discussionId]
                return newState
            })
            await loadComments(discussionId)
            await loadDiscussions()
        } catch (error: any) {
            console.error('Error adding comment:', error)
            toast.error('Failed to add comment')
        }
    }

    const handleLikeDiscussion = async (discussionId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: existing } = await supabase
                .from('discussion_likes')
                .select('id')
                .eq('user_id', user.id)
                .eq('discussion_id', discussionId)
                .maybeSingle()

            if (existing) {
                await supabase
                    .from('discussion_likes')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('discussion_id', discussionId)
            } else {
                await supabase
                    .from('discussion_likes')
                    .insert({ user_id: user.id, discussion_id: discussionId })
            }

            await loadDiscussions()
        } catch (error) {
            console.error('Error liking discussion:', error)
        }
    }

    const handleBookmark = async (discussionId: string) => {
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: existing } = await supabase
                .from('discussion_bookmarks')
                .select('id')
                .eq('user_id', user.id)
                .eq('discussion_id', discussionId)
                .maybeSingle()

            if (existing) {
                await supabase
                    .from('discussion_bookmarks')
                    .delete()
                    .eq('user_id', user.id)
                    .eq('discussion_id', discussionId)
            } else {
                await supabase
                    .from('discussion_bookmarks')
                    .insert({ user_id: user.id, discussion_id: discussionId })
            }
        } catch (error) {
            console.error('Error bookmarking:', error)
        }
    }

    const getFilteredDiscussions = () => {
        let filtered = [...discussions]

        if (activeCategory !== 'All Discussions') {
            filtered = filtered.filter(d => d.category === activeCategory)
        }

        if (sortBy === 'Most Popular') {
            filtered.sort((a, b) => b.likes_count - a.likes_count)
        } else if (sortBy === 'Unanswered') {
            filtered = filtered.filter(d => d.comments_count === 0)
        }

        return filtered
    }

    const getAvatarColor = (name: string) => {
        const colors = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-pink-500', 'bg-orange-500', 'bg-teal-500']
        return colors[(name?.charCodeAt(0) || 0) % colors.length]
    }

    const getTagStyle = (_tag: string, index: number) => {
        const styles = ['bg-gray-800 text-white', 'bg-green-100 text-green-700', 'bg-yellow-100 text-yellow-700']
        return styles[index % styles.length]
    }

    const filteredDiscussions = getFilteredDiscussions()

    return (
        <div className="min-h-screen bg-[#F1F7FF]">
            <section className="bg-gradient-to-b from-orange-50 via-green-50/30 to-gray-50 py-12 text-center">
                <h2 className="text-4xl font-bold text-gray-900 mb-4">
                    Join the <span className="text-orange-500">Conversation</span>
                </h2>
                <p className="text-gray-600 max-w-xl mx-auto mb-10">
                    Share knowledge, ask questions, and connect with developers across Africa.
                </p>

                <div className="flex justify-center gap-16">
                    <div>
                        <p className="text-3xl font-bold text-orange-500">{activeMembersCount.toLocaleString()}</p>
                        <p className="text-sm text-gray-500">Active Members</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-green-500">{discussions.length}</p>
                        <p className="text-sm text-gray-500">Discussions</p>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-gray-700">5,678</p>
                        <p className="text-sm text-gray-500">Helpful Answers</p>
                    </div>
                </div>
            </section>

            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex gap-8">
                    <aside className="w-64 flex-shrink-0">
                        <div className="bg-white rounded-xl p-5 shadow-sm sticky top-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Discussion Categories</h3>
                            <ul className="space-y-1">
                                {categories.map(category => (
                                    <li key={category}>
                                        <button
                                            onClick={() => setActiveCategory(category)}
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${activeCategory === category
                                                ? 'bg-orange-500 text-white'
                                                : 'text-gray-600 hover:bg-gray-100'
                                                }`}
                                        >
                                            {category}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </aside>

                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <select
                                        value={sortBy}
                                        onChange={e => setSortBy(e.target.value)}
                                        className="appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2 pr-10 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
                                    >
                                        <option>Most Recent</option>
                                        <option>Most Popular</option>
                                        <option>Unanswered</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <button
                                        onClick={() => setShowNotifications(!showNotifications)}
                                        className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                                    >
                                        <Bell className="w-5 h-5" />
                                        {notifications.length > 0 && (
                                            <span className="absolute top-1 right-1 w-2 h-2 bg-orange-500 rounded-full"></span>
                                        )}
                                    </button>

                                    {showNotifications && (
                                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border z-50">
                                            <div className="p-4 border-b">
                                                <h3 className="font-semibold">Notifications</h3>
                                            </div>
                                            <div className="max-h-96 overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <div className="p-8 text-center text-gray-500">No new notifications</div>
                                                ) : (
                                                    notifications.map(notif => (
                                                        <div
                                                            key={notif.id}
                                                            className="p-4 border-b hover:bg-gray-50 cursor-pointer"
                                                            onClick={() => {
                                                                markNotificationAsRead(notif.id)
                                                                handleJoinDiscussion(notif.discussion_id)
                                                                setShowNotifications(false)
                                                            }}
                                                        >
                                                            <p className="text-sm font-medium text-gray-900">{notif.discussion_title}</p>
                                                            <p className="text-xs text-gray-600 mt-1">{notif.commenter_name} commented</p>
                                                            <p className="text-xs text-gray-400 mt-1">{new Date(notif.created_at).toLocaleString()}</p>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={() => setShowNewDiscussionModal(true)}
                                    className="flex items-center gap-2 bg-orange-500 text-white px-6 py-3 rounded-lg text-base font-semibold hover:bg-orange-600 transition-all shadow-sm hover:shadow"
                                >
                                    <Plus className="w-5 h-5" />
                                    Start Discussion
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="bg-white rounded-xl p-12 text-center">
                                <p className="text-gray-500">Loading discussions...</p>
                            </div>
                        ) : filteredDiscussions.length === 0 ? (
                            <div className="bg-white rounded-xl p-12 text-center">
                                <p className="text-gray-500 mb-4">No discussions yet. Be the first to start one!</p>
                                <button
                                    onClick={() => setShowNewDiscussionModal(true)}
                                    className="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600"
                                >
                                    Start First Discussion
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredDiscussions.map(discussion => (
                                    <div
                                        key={discussion.id}
                                        className="bg-white rounded-xl p-6 hover:shadow-md transition-all border border-gray-200 group"
                                    >
                                        <div className="flex gap-4">
                                            <div className={`w-12 h-12 ${getAvatarColor(discussion.author_name || discussion.author_email)} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                                                {(discussion.author_name?.[0] || discussion.author_email?.[0] || 'A').toUpperCase()}
                                                {(discussion.author_name?.[1] || discussion.author_email?.[1] || 'U').toUpperCase()}
                                            </div>

                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="flex-1">
                                                        <h3 className="text-lg font-semibold text-gray-900 hover:text-orange-500 transition-colors cursor-pointer mb-1">
                                                            {discussion.title} {discussion.is_pinned && '📌'}
                                                        </h3>
                                                        <p className="text-sm text-gray-500">
                                                            <span className="text-gray-700">{discussion.author_name || 'Anonymous'}</span>
                                                            <span className="mx-2">•</span>
                                                            {new Date(discussion.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            <span className="mx-2">•</span>
                                                            <span className="text-orange-500">
                                                                Last reply: {new Date(discussion.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                            </span>
                                                        </p>
                                                    </div>

                                                    {currentUserId && discussion.author_id === currentUserId && (
                                                        <div className="flex gap-1">
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    setEditingDiscussion(discussion)
                                                                }}
                                                                className="text-gray-400 hover:text-blue-600 p-2 rounded hover:bg-blue-50"
                                                                title="Edit"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleDeleteDiscussion(discussion.id, discussion.author_id)
                                                                }}
                                                                className="text-gray-400 hover:text-red-600 p-2 rounded hover:bg-red-50"
                                                                title="Delete"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                <p className="text-gray-700 text-sm leading-relaxed mb-4">{discussion.content}</p>

                                                {discussion.image_url && (
                                                    <div className="mb-4">
                                                        <img
                                                            src={discussion.image_url}
                                                            alt="Discussion attachment"
                                                            className="rounded-lg max-h-96 object-cover border border-gray-100"
                                                        />
                                                    </div>
                                                )}

                                                {discussion.tags && discussion.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mb-4">
                                                        {discussion.tags.map((tag, idx) => (
                                                            <span key={idx} className={`px-3 py-1 rounded text-xs font-medium ${getTagStyle(tag, idx)}`}>
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4 text-gray-500 text-sm">
                                                        <div className="flex items-center gap-1.5">
                                                            <MessageSquare className="w-4 h-4" />
                                                            <span className="font-medium">{discussion.comments_count}</span>
                                                            <span>replies</span>
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <Eye className="w-4 h-4" />
                                                            <span className="font-medium">{discussion.views_count}</span>
                                                            <span>views</span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleLikeDiscussion(discussion.id)}
                                                            className="flex items-center gap-1.5 hover:text-orange-500 transition"
                                                        >
                                                            <ThumbsUp className="w-4 h-4" />
                                                            <span className="font-medium">{discussion.likes_count}</span>
                                                        </button>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() => handleBookmark(discussion.id)}
                                                            className="text-gray-400 hover:text-orange-500 p-1.5"
                                                            title="Bookmark"
                                                        >
                                                            <Bookmark className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleJoinDiscussion(discussion.id)}
                                                            className="px-6 py-3 bg-orange-500 text-white rounded-lg text-base font-semibold hover:bg-orange-600 transition-all shadow-sm hover:shadow"
                                                        >
                                                            {joinedDiscussions.has(discussion.id)
                                                                ? (expandedDiscussionId === discussion.id ? 'Hide' : 'View Discussion')
                                                                : 'Join Discussion'
                                                            }
                                                        </button>
                                                    </div>
                                                </div>

                                                {expandedDiscussionId === discussion.id && (
                                                    <div className="mt-6 pt-6 border-t">
                                                        <h5 className="font-semibold mb-4">Comments ({comments[discussion.id]?.length || 0})</h5>

                                                        <div className="mb-6">
                                                            <textarea
                                                                value={newComment[discussion.id] || ''}
                                                                onChange={e => setNewComment({ ...newComment, [discussion.id]: e.target.value })}
                                                                placeholder="Write a comment..."
                                                                className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none resize-none"
                                                                rows={3}
                                                            />
                                                            <div className="flex items-center justify-between mt-2">
                                                                <div className="flex items-center gap-2">
                                                                    <label className="cursor-pointer p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition-colors">
                                                                        <input
                                                                            type="file"
                                                                            className="hidden"
                                                                            accept="image/*"
                                                                            onChange={(e) => {
                                                                                const file = e.target.files?.[0]
                                                                                if (file) {
                                                                                    setNewCommentImage(prev => ({ ...prev, [discussion.id]: file }))
                                                                                }
                                                                            }}
                                                                        />
                                                                        <ImageIcon className="w-5 h-5" />
                                                                    </label>
                                                                    {newCommentImage[discussion.id] && (
                                                                        <div className="flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs">
                                                                            <span className="truncate max-w-[150px]">{newCommentImage[discussion.id]?.name}</span>
                                                                            <button
                                                                                onClick={() => setNewCommentImage(prev => {
                                                                                    const newState = { ...prev }
                                                                                    delete newState[discussion.id]
                                                                                    return newState
                                                                                })}
                                                                                className="hover:text-orange-900"
                                                                            >
                                                                                <X className="w-3 h-3" />
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <button
                                                                    onClick={() => handleAddComment(discussion.id)}
                                                                    className="flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
                                                                >
                                                                    <Send className="w-4 h-4" />
                                                                    Post Comment
                                                                </button>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-4">
                                                            {comments[discussion.id]?.map(comment => (
                                                                <div key={comment.id} className="flex gap-3 p-4 bg-gray-50 rounded-lg">
                                                                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                                                        {(comment.author_name?.[0] || comment.author_email?.[0] || '?').toUpperCase()}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="font-semibold text-sm">{comment.author_name || 'Anonymous'}</span>
                                                                            <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                                                                            {comment.is_edited && <span className="text-xs text-gray-400">(edited)</span>}
                                                                        </div>
                                                                        <p className="text-gray-700 text-sm">{comment.content}</p>
                                                                        {comment.image_url && (
                                                                            <div className="mt-2">
                                                                                <img
                                                                                    src={comment.image_url}
                                                                                    alt="Comment attachment"
                                                                                    className="rounded-lg max-h-60 object-cover border border-gray-100"
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {showNewDiscussionModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                            <h3 className="text-xl font-bold">Start New Discussion</h3>
                            <button onClick={() => setShowNewDiscussionModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                                <input
                                    type="text"
                                    value={newDiscussion.title}
                                    onChange={e => setNewDiscussion({ ...newDiscussion, title: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    placeholder="What's your question or topic?"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                                <select
                                    value={newDiscussion.category}
                                    onChange={e => setNewDiscussion({ ...newDiscussion, category: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                >
                                    {categories.filter(c => c !== 'All Discussions').map(cat => (
                                        <option key={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
                                <textarea
                                    value={newDiscussion.content}
                                    onChange={e => setNewDiscussion({ ...newDiscussion, content: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    rows={6}
                                    placeholder="Describe your question..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                                <input
                                    type="text"
                                    value={newDiscussion.tags}
                                    onChange={e => setNewDiscussion({ ...newDiscussion, tags: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    placeholder="e.g. React, JavaScript"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Image (Optional)</label>
                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center hover:bg-gray-50 transition-colors cursor-pointer relative">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) setNewDiscussionImage(file)
                                        }}
                                    />
                                    {newDiscussionImage ? (
                                        <div className="flex items-center justify-center gap-2 text-orange-600">
                                            <ImageIcon className="w-5 h-5" />
                                            <span className="text-sm font-medium">{newDiscussionImage.name}</span>
                                        </div>
                                    ) : (
                                        <div className="text-gray-500">
                                            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                                            <p className="text-sm">Click to upload an image</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleCreateDiscussion}
                                    disabled={isUploading}
                                    className="flex-1 bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isUploading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Posting...
                                        </>
                                    ) : (
                                        'Post Discussion'
                                    )}
                                </button>
                                <button
                                    onClick={() => setShowNewDiscussionModal(false)}
                                    className="px-6 py-3 border rounded-lg font-medium hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {editingDiscussion && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                            <h3 className="text-xl font-bold">Edit Discussion</h3>
                            <button onClick={() => setEditingDiscussion(null)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                                <input
                                    type="text"
                                    value={editingDiscussion.title}
                                    onChange={e => setEditingDiscussion({ ...editingDiscussion, title: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Content *</label>
                                <textarea
                                    value={editingDiscussion.content}
                                    onChange={e => setEditingDiscussion({ ...editingDiscussion, content: e.target.value })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                    rows={6}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
                                <input
                                    type="text"
                                    value={editingDiscussion.tags?.join(', ') || ''}
                                    onChange={e => setEditingDiscussion({ ...editingDiscussion, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:outline-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleUpdateDiscussion}
                                    className="flex-1 bg-blue-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-600"
                                >
                                    Update Discussion
                                </button>
                                <button
                                    onClick={() => setEditingDiscussion(null)}
                                    className="px-6 py-3 border rounded-lg font-medium hover:bg-gray-50"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
