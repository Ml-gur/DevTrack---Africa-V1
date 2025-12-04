"use client";

import { cn } from "@/lib/utils";
import {
    Heart,
    MessageCircle,
    Share2,
    Bookmark,
    MoreHorizontal,
    ArrowRight
} from "lucide-react";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SocialPostProps {
    id: number;
    author: {
        name: string;
        username: string;
        avatar: string;
        timeAgo: string;
        role?: string;
    };
    content: {
        title: string;
        text: string;
        tags?: string[];
    };
    engagement: {
        likes: number;
        comments: number;
        shares: number;
        isLiked?: boolean;
        isBookmarked?: boolean;
    };
    onLike?: () => void;
    onComment?: () => void;
    onShare?: () => void;
    onBookmark?: () => void;
    onJoin?: () => void;
    className?: string;
}

export function SocialPost({
    id,
    author,
    content,
    engagement,
    onLike,
    onComment,
    onShare,
    onBookmark,
    onJoin,
    className
}: SocialPostProps) {
    const [isLiked, setIsLiked] = useState(engagement?.isLiked ?? false);
    const [isBookmarked, setIsBookmarked] = useState(engagement?.isBookmarked ?? false);
    const [likes, setLikes] = useState(engagement?.likes ?? 0);

    const handleLike = () => {
        setIsLiked(!isLiked);
        setLikes(prev => isLiked ? prev - 1 : prev + 1);
        onLike?.();
    };

    const handleBookmark = () => {
        setIsBookmarked(!isBookmarked);
        onBookmark?.();
    };

    return (
        <div
            className={cn(
                "w-full bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800 py-6 px-4 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors",
                className
            )}
        >
            <div className="flex gap-4">
                {/* Avatar */}
                <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                    <AvatarImage src={author.avatar} alt={author.name} />
                    <AvatarFallback>{author.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>

                {/* Main Content */}
                <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-zinc-900 dark:text-zinc-100 text-base">
                                {author.name}
                            </span>
                            <span className="text-zinc-500 text-sm">@{author.username}</span>
                            <span className="text-zinc-400 text-sm">·</span>
                            <span className="text-zinc-500 text-sm hover:underline cursor-pointer">
                                {author.timeAgo}
                            </span>
                            {author.role && (
                                <Badge variant="secondary" className="text-xs font-normal bg-zinc-100 text-zinc-600 hover:bg-zinc-200">
                                    {author.role}
                                </Badge>
                            )}
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-400">
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </div>

                    {/* Post Body */}
                    <div className="mb-4">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-2 leading-tight">
                            {content.title}
                        </h3>
                        <p className="text-zinc-600 dark:text-zinc-300 text-base leading-relaxed whitespace-pre-wrap">
                            {content.text}
                        </p>
                    </div>

                    {/* Tags */}
                    {content.tags && content.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                            {content.tags.map((tag) => (
                                <span key={tag} className="text-blue-500 hover:text-blue-600 text-sm cursor-pointer">
                                    #{tag.replace(/\s+/g, '')}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Interaction Bar */}
                    <div className="flex items-center justify-between pt-2">
                        <div className="flex items-center gap-6">
                            {/* Like */}
                            <button
                                onClick={handleLike}
                                className={cn(
                                    "group flex items-center gap-2 text-sm transition-colors",
                                    isLiked ? "text-rose-500" : "text-zinc-500 hover:text-rose-500"
                                )}
                            >
                                <div className={cn(
                                    "p-2 rounded-full group-hover:bg-rose-50 transition-colors",
                                    isLiked && "bg-rose-50"
                                )}>
                                    <Heart className={cn("w-5 h-5", isLiked && "fill-current")} />
                                </div>
                                <span className="font-medium">{likes}</span>
                            </button>

                            {/* Comment */}
                            <button
                                onClick={onComment}
                                className="group flex items-center gap-2 text-sm text-zinc-500 hover:text-blue-500 transition-colors"
                            >
                                <div className="p-2 rounded-full group-hover:bg-blue-50 transition-colors">
                                    <MessageCircle className="w-5 h-5" />
                                </div>
                                <span className="font-medium">{engagement.comments}</span>
                            </button>

                            {/* Share */}
                            <button
                                onClick={onShare}
                                className="group flex items-center gap-2 text-sm text-zinc-500 hover:text-green-500 transition-colors"
                            >
                                <div className="p-2 rounded-full group-hover:bg-green-50 transition-colors">
                                    <Share2 className="w-5 h-5" />
                                </div>
                                <span className="font-medium">{engagement.shares}</span>
                            </button>

                            {/* Bookmark */}
                            <button
                                onClick={handleBookmark}
                                className={cn(
                                    "group flex items-center gap-2 text-sm transition-colors",
                                    isBookmarked ? "text-yellow-500" : "text-zinc-500 hover:text-yellow-500"
                                )}
                            >
                                <div className={cn(
                                    "p-2 rounded-full group-hover:bg-yellow-50 transition-colors",
                                    isBookmarked && "bg-yellow-50"
                                )}>
                                    <Bookmark className={cn("w-5 h-5", isBookmarked && "fill-current")} />
                                </div>
                            </button>
                        </div>

                        {/* Join Button */}
                        <Button
                            onClick={onJoin}
                            className="bg-orange-500 hover:bg-orange-600 text-white rounded-full px-6 font-semibold shadow-sm hover:shadow-md transition-all"
                        >
                            Join Discussion
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
