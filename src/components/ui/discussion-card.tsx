import React from 'react';
import { MessageCircle, Eye, ThumbsUp } from 'lucide-react';

interface DiscussionCardProps {
    id: number;
    title: string;
    author: {
        name: string;
        avatar: string;
        role: string;
    };
    excerpt: string;
    tags: string[];
    stats: {
        likes: number;
        replies: number;
        views: number;
    };
    timeAgo: string;
    trending?: boolean;
    verified?: boolean;
    onClick?: () => void;
}

export function DiscussionCard({
    title,
    author,
    excerpt,
    tags,
    stats,
    timeAgo,
    onClick,
}: DiscussionCardProps) {
    const getAvatarColor = (avatar: string) => {
        const colors = ['#7fb069', '#ff6b35', '#2d5a5a', '#c4655c', '#e76f51'];
        const index = avatar.charCodeAt(0) % colors.length;
        return colors[index];
    };

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-2xl p-8 hover:shadow-md transition-all duration-200 cursor-pointer border border-gray-200"
            style={{ minHeight: '240px' }}
        >
            <div className="flex gap-6">
                {/* Avatar */}
                <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl flex-shrink-0"
                    style={{ backgroundColor: getAvatarColor(author.avatar) }}
                >
                    {author.avatar}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col">
                    {/* Title */}
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 leading-tight">
                        {title}
                    </h3>

                    {/* Author and Time Info */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                        <span className="font-medium text-gray-600">{author.name}</span>
                        <span>•</span>
                        <span>{timeAgo}</span>
                        <span>•</span>
                        <span className="text-[#ff6347] font-medium">Last reply: {timeAgo}</span>
                    </div>

                    {/* Excerpt */}
                    <p className="text-gray-600 text-base mb-5 leading-relaxed" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {excerpt}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        {tags.map((tag, index) => (
                            <span
                                key={index}
                                className={`px-4 py-1.5 rounded-md text-sm font-medium ${index === 0
                                        ? 'bg-white border border-gray-200 text-gray-800'
                                        : index === 1
                                            ? 'bg-green-50 text-green-700 border border-green-100'
                                            : 'bg-orange-50 text-orange-700 border border-orange-100'
                                    }`}
                            >
                                {tag}
                            </span>
                        ))}
                    </div>

                    {/* Stats and Button */}
                    <div className="flex items-center justify-between mt-auto pt-2">
                        <div className="flex items-center gap-6 text-sm text-gray-500">
                            {/* Replies */}
                            <div className="flex items-center gap-2">
                                <MessageCircle className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">{stats.replies} replies</span>
                            </div>

                            {/* Views */}
                            <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">{stats.views} views</span>
                            </div>

                            {/* Likes */}
                            <div className="flex items-center gap-2">
                                <ThumbsUp className="w-4 h-4 text-gray-400" />
                                <span className="font-medium">{stats.likes}</span>
                            </div>
                        </div>

                        {/* Join Discussion Button */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onClick?.();
                            }}
                            className="bg-[#ff6347] hover:bg-[#ff5533] text-white px-7 py-2.5 rounded-lg font-semibold text-sm transition-colors shadow-sm hover:shadow flex-shrink-0"
                        >
                            Join Discussion
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
