import React from 'react';
import { Card, CardContent } from './ui/card';
import { Users, MessageCircle, Calendar, BookOpen } from 'lucide-react';

export default function CommunityPlaceholder() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Community</h2>
                <p className="text-gray-600">
                    Connect with fellow developers, share knowledge, and collaborate on projects
                </p>
            </div>

            {/* Coming Soon Card */}
            <Card className="border-blue-200 shadow-sm">
                <CardContent className="py-16 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Users className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-3 text-gray-900">
                        Community Features Coming Soon!
                    </h3>
                    <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
                        We're building an amazing community platform where you can connect with other
                        developers across Africa, share your projects, and collaborate on exciting initiatives.
                    </p>

                    {/* Planned Features Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mt-8">
                        <div className="p-6 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                                <MessageCircle className="w-6 h-6 text-blue-600" />
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">Discussions</h4>
                            <p className="text-sm text-gray-600">
                                Engage in meaningful conversations with other developers
                            </p>
                        </div>

                        <div className="p-6 bg-green-50 rounded-lg border border-green-100">
                            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                                <Calendar className="w-6 h-6 text-green-600" />
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">Events</h4>
                            <p className="text-sm text-gray-600">
                                Join virtual meetups, hackathons, and workshops
                            </p>
                        </div>

                        <div className="p-6 bg-purple-50 rounded-lg border border-purple-100">
                            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                                <BookOpen className="w-6 h-6 text-purple-600" />
                            </div>
                            <h4 className="font-semibold text-gray-900 mb-2">Resources</h4>
                            <p className="text-sm text-gray-600">
                                Access shared tutorials, guides, and learning materials
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
