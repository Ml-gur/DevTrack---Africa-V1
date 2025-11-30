import { useState, useEffect } from 'react'
import { MessageSquare, Eye, Plus, X, Bookmark, ChevronDown, Send, Edit, Trash2, ThumbsUp, Bell, Pin } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

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
    const [timeFilter, setTimeFilter] = useState('All Time')
    const [showNewDiscussionModal, setShowNewDiscussionModal] = useState(false)
    const [expandedDiscussionId, setExpandedDiscussionId] = useState<string | null>(null)
    const [joinedDiscussions, setJoinedDiscussions] = useState<Set<string>>(new Set())
    const [comments, setComments] = useState<{ [key: string]: Comment[] }>({})
    const [newComment, setNewComment] = useState<{ [key: string]: string }>({})
    const [editingDiscussion, setEditingDiscussion] = useState<Discussion | null>(null)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [showNotifications, setShowNotifications] = useState(false)
    const [currentUserId, setCurrentUserId] = useState<string | null>(null)
    const [newDiscussion, setNewDiscussion] = useState({
        title: '',
        content: '',
        tags: '',
        category: 'Tech Help & Q&A'
    })

    const [stats, setStats] = useState({
        members: 0,
        topics: 0,
        answers: 0
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
            await loadStats()

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

    const loadStats = async () => {
        try {
            // Get members count
            const { count: membersCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })

            // Get answers (comments) count
            const { count: answersCount } = await supabase
                .from('discussion_comments')
                .select('*', { count: 'exact', head: true })

            setStats(prev => ({
                ...prev,
                members: membersCount || 0,
                answers: answersCount || 0
            }))
        } catch (error) {
            console.error('Error loading stats:', error)
        }
    }

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
            setStats(prev => ({ ...prev, topics: data?.length || 0 }))
        } catch (error) {
            console.error('Error loading discussions:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleJoinDiscussion = (discussionId: string) => {
        if (joinedDiscussions.has(discussionId)) {
            if (expandedDiscussionId === discussionId) {
                setExpandedDiscussionId(null)
            } else {
                setExpandedDiscussionId(discussionId)
                if (!comments[discussionId]) {
                    loadComments(discussionId)
                }
            }
        } else {
            saveJoinedDiscussion(discussionId)
            setExpandedDiscussionId(discussionId)
            loadComments(discussionId)
        }
    }

    const loadComments = async (discussionId: string) => {
        try {
            const { data, error } = await supabase
                .from('discussion_comments')
                .select('*')
                .eq('discussion_id', discussionId)
                .order('created_at', { ascending: true })

            if (error) throw error
            setComments(prev => ({ ...prev, [discussionId]: data || [] }))
        } catch (error) {
            console.error('Error loading comments:', error)
        }
    }

    const handleAddComment = async (discussionId: string) => {
        const content = newComment[discussionId]
        if (!content?.trim()) return

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                alert('Please sign in to comment')
                return
            }

            // Get user profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', user.id)
                .single()

            const commentData = {
                discussion_id: discussionId,
                content: content.trim(),
                author_id: user.id,
                author_name: profile?.full_name || user.email?.split('@')[0] || 'Anonymous',
                author_email: user.email || '',
                author_avatar: profile?.avatar_url || null
            }

            const { data, error } = await supabase
                .from('discussion_comments')
                .insert([commentData])
                .select()
                .single()

            if (error) throw error

            setComments(prev => ({
                ...prev,
                [discussionId]: [...(prev[discussionId] || []), data]
            }))
            setNewComment(prev => ({ ...prev, [discussionId]: '' }))

            // Update local discussion comment count
            setDiscussions(prev => prev.map(d =>
                d.id === discussionId
                    ? { ...d, comments_count: (d.comments_count || 0) + 1 }
                    : d
            ))
            setStats(prev => ({ ...prev, answers: prev.answers + 1 }))

        } catch (error) {
            console.error('Error adding comment:', error)
            alert('Failed to post comment')
        }
    }

    const handleCreateDiscussion = async () => {
        if (!newDiscussion.title.trim() || !newDiscussion.content.trim()) {
            alert('Please fill in all required fields')
            return
        }

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) {
                alert('Please sign in to post')
                return
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', user.id)
                .single()

            const discussionData = {
                title: newDiscussion.title.trim(),
                content: newDiscussion.content.trim(),
                category: newDiscussion.category,
                tags: newDiscussion.tags.split(',').map(t => t.trim()).filter(Boolean),
                author_id: user.id,
                author_name: profile?.full_name || user.email?.split('@')[0] || 'Anonymous',
                author_email: user.email || '',
                author_avatar: profile?.avatar_url || null
            }

            const { data, error } = await supabase
                .from('discussions')
                .insert([discussionData])
                .select()
                .single()

            if (error) throw error

            setDiscussions(prev => [data, ...prev])
            setShowNewDiscussionModal(false)
            setNewDiscussion({ title: '', content: '', tags: '', category: 'Tech Help & Q&A' })
            setStats(prev => ({ ...prev, topics: prev.topics + 1 }))

        } catch (error) {
            console.error('Error creating discussion:', error)
            alert('Failed to create discussion')
        }
    }

    const handleUpdateDiscussion = async () => {
        if (!editingDiscussion) return

        try {
            const { error } = await supabase
                .from('discussions')
                .update({
                    title: editingDiscussion.title,
                    content: editingDiscussion.content,
                    tags: editingDiscussion.tags,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editingDiscussion.id)

            if (error) throw error

            setDiscussions(prev => prev.map(d =>
                d.id === editingDiscussion.id ? editingDiscussion : d
            ))
            setEditingDiscussion(null)
        } catch (error) {
            console.error('Error updating discussion:', error)
            alert('Failed to update discussion')
        }
    }

    const handleDeleteDiscussion = async (id: string, authorId: string) => {
        if (!confirm('Are you sure you want to delete this discussion?')) return

        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user || user.id !== authorId) {
                alert('You can only delete your own discussions')
                return
            }

            const { error } = await supabase
                .from('discussions')
                .delete()
                .eq('id', id)

            if (error) throw error

            setDiscussions(prev => prev.filter(d => d.id !== id))
            setStats(prev => ({ ...prev, topics: Math.max(0, prev.topics - 1) }))
        } catch (error) {
            console.error('Error deleting discussion:', error)
            alert('Failed to delete discussion')
        }
    }

    const handleLikeDiscussion = async (id: string) => {
        // Optimistic update
        setDiscussions(prev => prev.map(d =>
            d.id === id ? { ...d, likes_count: d.likes_count + 1 } : d
        ))

        try {
            const { error } = await supabase.rpc('increment_discussion_likes', { row_id: id })
            if (error) throw error
        } catch (error) {
            console.error('Error liking discussion:', error)
            // Revert on error
            setDiscussions(prev => prev.map(d =>
                d.id === id ? { ...d, likes_count: d.likes_count - 1 } : d
            ))
        }
    }

    const handleBookmark = (id: string) => {
        // Placeholder for bookmark functionality
        alert('Bookmark saved!')
    }

    const getAvatarColor = (name: string = '') => {
        const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500']
        let hash = 0
        for (let i = 0; i < name.length; i++) {
            hash = name.charCodeAt(i) + ((hash << 5) - hash)
        }
        return colors[Math.abs(hash) % colors.length]
    }

    const getTagStyle = (tag: string, idx: number) => {
        const styles = [
            'bg-blue-100 text-blue-700',
            'bg-green-100 text-green-700',
            'bg-purple-100 text-purple-700',
            'bg-orange-100 text-orange-700',
            'bg-pink-100 text-pink-700'
        ]
        return styles[idx % styles.length]
    }

    const formatTimeAgo = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

        if (diffInSeconds < 60) return 'just now'

        const diffInMinutes = Math.floor(diffInSeconds / 60)
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`

        const diffInHours = Math.floor(diffInMinutes / 60)
        if (diffInHours < 24) return `${diffInHours}h ago`

        const diffInDays = Math.floor(diffInHours / 24)
        if (diffInDays < 30) return `${diffInDays}d ago`

        const diffInMonths = Math.floor(diffInDays / 30)
        if (diffInMonths < 12) return `${diffInMonths}mo ago`

        const diffInYears = Math.floor(diffInDays / 365)
        return `${diffInYears}y ago`
    }

    const getFilteredDiscussions = () => {
        let filtered = [...discussions]

        // Filter by category
        if (activeCategory !== 'All Discussions') {
            filtered = filtered.filter(d => d.category === activeCategory)
        }

        // Sort
        switch (sortBy) {
            case 'Most Recent':
                filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                break
            case 'Most Popular':
                filtered.sort((a, b) => (b.likes_count + b.comments_count) - (a.likes_count + a.comments_count))
                break
            case 'Unanswered':
                filtered = filtered.filter(d => d.comments_count === 0)
                filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                break
        }

        return filtered
    }

    const filteredDiscussions = getFilteredDiscussions()

    return (
        <div className="min-h-screen bg-gray-50 font-sans p-6 md:p-8">
            <main className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar */}
                    <aside className="w-full md:w-64 flex-shrink-0">
                        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm sticky top-6 p-6">
                            <h3 className="font-bold text-gray-900 text-lg mb-4">Discussion Categories</h3>
                            <ul className="space-y-2">
                                {categories.map(category => (
                                    <li key={category}>
                                        <button
                                            onClick={() => setActiveCategory(category)}
                                            className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeCategory === category
                                                ? 'bg-[#FF5722] text-white shadow-md'
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                                }`}
                                        >
                                            {category}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </aside>

                    {/* Main Content */}
                    <div className="flex-1">
                        {/* Header Filters & Action */}
                        <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <div className="relative w-full sm:w-auto">
                                    <select
                                        value={sortBy}
                                        onChange={e => setSortBy(e.target.value)}
                                        className="w-full sm:w-auto appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-sm cursor-pointer hover:border-gray-300 transition-colors"
                                    >
                                        <option>Most Recent</option>
                                        <option>Most Popular</option>
                                        <option>Unanswered</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>

                                <div className="relative w-full sm:w-auto">
                                    <select
                                        value={timeFilter}
                                        onChange={e => setTimeFilter(e.target.value)}
                                        className="w-full sm:w-auto appearance-none bg-white border border-gray-200 rounded-lg px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500/20 shadow-sm cursor-pointer hover:border-gray-300 transition-colors"
                                    >
                                        <option>All Time</option>
                                        <option>This Week</option>
                                        <option>This Month</option>
                                        <option>This Year</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="w-full sm:w-auto flex justify-end">
                                <button
                                    onClick={() => setShowNewDiscussionModal(true)}
                                    className="flex items-center gap-2 bg-[#FF5722] hover:bg-[#F4511E] text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all shadow-sm hover:shadow-md active:scale-95"
                                >
                                    <Plus className="w-5 h-5" />
                                    Start Discussion
                                </button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                                <p className="text-gray-500 font-medium">Loading discussions...</p>
                            </div>
                        ) : filteredDiscussions.length === 0 ? (
                            <div className="bg-white rounded-xl p-12 text-center border border-gray-200">
                                <p className="text-gray-500 mb-4 font-medium">No discussions yet. Be the first to start one!</p>
                                <button
                                    onClick={() => setShowNewDiscussionModal(true)}
                                    className="bg-[#FF5722] text-white px-6 py-2.5 rounded-lg font-bold hover:bg-[#F4511E] transition-all shadow-sm"
                                >
                                    Start First Discussion
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredDiscussions.map(discussion => (
                                    <div
                                        key={discussion.id}
                                        className="bg-white rounded-2xl p-6 hover:shadow-lg transition-all border border-gray-200 group mb-4"
                                    >
                                        <div className="flex gap-4">
                                            <div className={`w-12 h-12 ${getAvatarColor(discussion.author_name || discussion.author_email)} rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                                                {(discussion.author_name?.[0] || discussion.author_email?.[0] || 'A').toUpperCase()}
                                                {(discussion.author_name?.[1] || discussion.author_email?.[1] || 'U').toUpperCase()}
                                            </div>

                                            <div className="flex-1">
                                                <div className="mb-2">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#FF5722] hover:text-[#FF5722] transition-colors cursor-pointer">
                                                            {discussion.title}
                                                        </h3>
                                                        {discussion.is_pinned && <Pin className="w-4 h-4 text-red-500 fill-current rotate-45" />}
                                                    </div>
                                                    <p className="text-sm text-gray-500 font-medium flex items-center flex-wrap gap-2">
                                                        <span className="text-gray-600">{discussion.author_name || 'Anonymous'}</span>
                                                        <span className="text-gray-300">•</span>
                                                        <span>{formatTimeAgo(discussion.created_at)}</span>
                                                        <span className="text-gray-300">•</span>
                                                        <span className="text-[#FF5722]">
                                                            Last reply: {formatTimeAgo(discussion.updated_at)}
                                                        </span>
                                                    </p>
                                                </div>

                                                <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-2">{discussion.content}</p>

                                                {discussion.tags && discussion.tags.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mb-6">
                                                        {discussion.tags.map((tag, idx) => {
                                                            let tagStyle = 'bg-gray-100 text-gray-700'
                                                            if (tag.toLowerCase().includes('react')) tagStyle = 'bg-blue-100 text-blue-700'
                                                            if (tag.toLowerCase().includes('performance')) tagStyle = 'bg-orange-100 text-orange-700'
                                                            if (tag.toLowerCase().includes('best practices')) tagStyle = 'bg-gray-100 text-gray-700'

                                                            return (
                                                                <span key={idx} className={`px-3 py-1 rounded-md text-xs font-semibold ${tagStyle}`}>
                                                                    {tag}
                                                                </span>
                                                            )
                                                        })}
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between pt-2">
                                                    <div className="flex items-center gap-6 text-gray-500 text-sm font-medium">
                                                        <div className="flex items-center gap-2">
                                                            <MessageSquare className="w-4 h-4" />
                                                            <span>{discussion.comments_count} replies</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Eye className="w-4 h-4" />
                                                            <span>{discussion.views_count} views</span>
                                                        </div>
                                                        <button
                                                            onClick={() => handleLikeDiscussion(discussion.id)}
                                                            className="flex items-center gap-2 hover:text-[#FF5722] transition"
                                                        >
                                                            <ThumbsUp className="w-4 h-4" />
                                                            <span>{discussion.likes_count}</span>
                                                        </button>
                                                    </div>

                                                    <button
                                                        onClick={() => handleJoinDiscussion(discussion.id)}
                                                        className="px-6 py-2.5 bg-[#FF5722] text-white rounded-lg text-sm font-bold hover:bg-[#F4511E] transition-all shadow-sm hover:shadow-md"
                                                    >
                                                        {joinedDiscussions.has(discussion.id)
                                                            ? (expandedDiscussionId === discussion.id ? 'Hide Discussion' : 'View Discussion')
                                                            : 'Join Discussion'
                                                        }
                                                    </button>
                                                </div>

                                                {expandedDiscussionId === discussion.id && (
                                                    <div className="mt-6 pt-6 border-t border-gray-100">
                                                        <h5 className="font-bold text-gray-900 mb-4">Comments ({comments[discussion.id]?.length || 0})</h5>

                                                        <div className="mb-6">
                                                            <textarea
                                                                value={newComment[discussion.id] || ''}
                                                                onChange={e => setNewComment({ ...newComment, [discussion.id]: e.target.value })}
                                                                placeholder="Write a comment..."
                                                                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-[#FF5722]/20 focus:border-[#FF5722] focus:outline-none resize-none transition-all"
                                                                rows={3}
                                                            />
                                                            <button
                                                                onClick={() => handleAddComment(discussion.id)}
                                                                className="mt-3 flex items-center gap-2 bg-[#FF5722] text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-[#F4511E] transition-all"
                                                            >
                                                                <Send className="w-4 h-4" />
                                                                Post Comment
                                                            </button>
                                                        </div>

                                                        <div className="space-y-4">
                                                            {comments[discussion.id]?.map(comment => (
                                                                <div key={comment.id} className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                                                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
                                                                        {(comment.author_name?.[0] || comment.author_email?.[0] || '?').toUpperCase()}
                                                                    </div>
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <span className="font-bold text-gray-900 text-sm">{comment.author_name || 'Anonymous'}</span>
                                                                            <span className="text-xs text-gray-500">• {formatTimeAgo(comment.created_at)}</span>
                                                                            {comment.is_edited && <span className="text-xs text-gray-400">(edited)</span>}
                                                                        </div>
                                                                        <p className="text-gray-700 text-sm leading-relaxed">{comment.content}</p>
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

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={handleCreateDiscussion}
                                    className="flex-1 bg-[#FF5722] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#F4511E]"
                                >
                                    Post Discussion
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
