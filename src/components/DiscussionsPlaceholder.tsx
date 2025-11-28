import { useState, useEffect } from 'react'
import { MessageSquare, Eye, Plus, X, Bookmark, ChevronDown, Send, Edit, Trash2, ThumbsUp, Bell } from 'lucide-react'
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

    // ... (rest of functions unchanged)

    const filteredDiscussions = getFilteredDiscussions()

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <section className="bg-white border-b border-gray-200 py-10">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="text-left max-w-2xl">
                            <h2 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
                                Join the <span className="text-orange-600">Conversation</span>
                            </h2>
                            <p className="text-gray-600 text-lg leading-relaxed font-medium">
                                Share knowledge, ask questions, and connect with developers across Africa.
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <div className="bg-orange-50 border border-orange-100 px-6 py-4 rounded-2xl text-center min-w-[110px] shadow-sm">
                                <p className="text-3xl font-extrabold text-orange-600">{stats.members}</p>
                                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mt-1">Members</p>
                            </div>
                            <div className="bg-blue-50 border border-blue-100 px-6 py-4 rounded-2xl text-center min-w-[110px] shadow-sm">
                                <p className="text-3xl font-extrabold text-blue-600">{stats.topics}</p>
                                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mt-1">Topics</p>
                            </div>
                            <div className="bg-green-50 border border-green-100 px-6 py-4 rounded-2xl text-center min-w-[110px] shadow-sm">
                                <p className="text-3xl font-extrabold text-green-600">{stats.answers}</p>
                                <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mt-1">Answers</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex gap-8">
                    <aside className="w-64 flex-shrink-0 hidden md:block">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm sticky top-6 overflow-hidden">
                            <div className="p-4 border-b border-gray-100 bg-gray-50">
                                <h3 className="font-bold text-gray-900">Categories</h3>
                            </div>
                            <ul className="p-2 space-y-1">
                                {categories.map(category => (
                                    <li key={category}>
                                        <button
                                            onClick={() => setActiveCategory(category)}
                                            className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all font-semibold ${activeCategory === category
                                                ? 'bg-orange-50 text-orange-700 border border-orange-100'
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

                    <div className="flex-1">
                        <div className="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                            <div className="flex items-center gap-3 w-full sm:w-auto">
                                <div className="relative w-full sm:w-auto">
                                    <select
                                        value={sortBy}
                                        onChange={e => setSortBy(e.target.value)}
                                        className="w-full sm:w-auto appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-sm cursor-pointer hover:border-gray-300 transition-colors"
                                    >
                                        <option>Most Recent</option>
                                        <option>Most Popular</option>
                                        <option>Unanswered</option>
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                                <div className="relative">
                                    <button
                                        onClick={() => setShowNotifications(!showNotifications)}
                                        className="relative p-2.5 text-gray-600 hover:bg-white hover:shadow-sm rounded-xl transition-all border border-transparent hover:border-gray-200"
                                    >
                                        <Bell className="w-5 h-5" />
                                        {notifications.length > 0 && (
                                            <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
                                        )}
                                    </button>

                                    {showNotifications && (
                                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                                            <div className="p-4 border-b border-gray-100 bg-gray-50">
                                                <h3 className="font-bold text-gray-900">Notifications</h3>
                                            </div>
                                            <div className="max-h-96 overflow-y-auto">
                                                {notifications.length === 0 ? (
                                                    <div className="p-8 text-center text-gray-500 text-sm">No new notifications</div>
                                                ) : (
                                                    notifications.map(notif => (
                                                        <div
                                                            key={notif.id}
                                                            className="p-4 border-b border-gray-50 hover:bg-gray-50 cursor-pointer transition-colors"
                                                            onClick={() => {
                                                                markNotificationAsRead(notif.id)
                                                                handleJoinDiscussion(notif.discussion_id)
                                                                setShowNotifications(false)
                                                            }}
                                                        >
                                                            <p className="text-sm font-semibold text-gray-900">{notif.discussion_title}</p>
                                                            <p className="text-xs text-gray-600 mt-1 font-medium">{notif.commenter_name} commented</p>
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
                                    className="flex items-center gap-2 bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-orange-700 transition-all shadow-sm hover:shadow-md active:scale-95"
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
                                    className="bg-orange-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-orange-700 transition-all shadow-sm"
                                >
                                    Start First Discussion
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {filteredDiscussions.map(discussion => (
                                    <div
                                        key={discussion.id}
                                        className="bg-white rounded-xl p-6 hover:shadow-lg transition-all border border-gray-200 group"
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
                                                            <button
                                                                onClick={() => handleAddComment(discussion.id)}
                                                                className="mt-2 flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600"
                                                            >
                                                                <Send className="w-4 h-4" />
                                                                Post Comment
                                                            </button>
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
                                    className="flex-1 bg-orange-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-orange-600"
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
