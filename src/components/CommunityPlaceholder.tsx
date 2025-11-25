// CommunityPlaceholder.tsx
// A simple placeholder component for the Community section.
// This component can be expanded later with full community features.

import React from 'react';
import { Card, CardContent } from './ui/card';
import { Users } from 'lucide-react';

export default function CommunityPlaceholder() {
    return (
        <Card className="border-dashed border-2 border-gray-300 bg-gray-50 hover:bg-gray-100 transition-colors">
            <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="w-12 h-12 text-gray-400 mb-4" />
                <h2 className="text-xl font-semibold text-gray-600 mb-2">
                    Community Coming Soon
                </h2>
                <p className="text-center text-gray-500 max-w-sm">
                    We're working hard to bring you a vibrant community space where you can collaborate,
                    share ideas, and connect with other developers. Stay tuned!
                </p>
            </CardContent>
        </Card>
    );
}
