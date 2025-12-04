import { Rocket, Sparkles, Bell } from 'lucide-react'

export default function DiscoverProjectsPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center p-6">
            <div className="max-w-2xl w-full text-center">
                {/* Icon */}
                <div className="mb-8 flex justify-center">
                    <div className="relative">
                        <div className="w-32 h-32 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl flex items-center justify-center shadow-2xl transform hover:scale-105 transition-transform">
                            <Rocket className="w-16 h-16 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2">
                            <Sparkles className="w-8 h-8 text-yellow-500 animate-pulse" />
                        </div>
                    </div>
                </div>

                {/* Heading */}
                <h1 className="text-5xl font-bold text-gray-900 mb-4">
                    Discover Amazing Projects
                </h1>

                <div className="inline-block mb-6">
                    <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded-full text-sm font-semibold shadow-lg">
                        Coming Soon
                    </span>
                </div>

                {/* Description */}
                <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                    Get ready to explore innovative projects from talented developers across Africa.
                    Discover, collaborate, and showcase your work with the community.
                </p>

                {/* Features Preview */}
                <div className="grid md:grid-cols-3 gap-6 mb-12">
                    <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow">
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                            <span className="text-2xl">🔍</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Browse Projects</h3>
                        <p className="text-sm text-gray-600">
                            Explore cutting-edge projects from developers across the continent
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                            <span className="text-2xl">💡</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Get Inspired</h3>
                        <p className="text-sm text-gray-600">
                            Find innovative solutions and creative ideas from your peers
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-md hover:shadow-xl transition-shadow">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 mx-auto">
                            <span className="text-2xl">🤝</span>
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">Collaborate</h3>
                        <p className="text-sm text-gray-600">
                            Connect with developers and contribute to exciting projects
                        </p>
                    </div>
                </div>

                {/* CTA */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-8 text-white shadow-2xl">
                    <Bell className="w-12 h-12 mx-auto mb-4" />
                    <h2 className="text-2xl font-bold mb-3">Be the First to Know</h2>
                    <p className="mb-6 text-orange-100">
                        We're working hard to bring you this exciting feature. Stay tuned for updates!
                    </p>
                    <div className="flex gap-3 justify-center flex-wrap">
                        <button className="bg-white text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors shadow-md">
                            Notify Me
                        </button>
                        <button className="bg-orange-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-800 transition-colors">
                            Learn More
                        </button>
                    </div>
                </div>

                {/* Timeline */}
                <div className="mt-12 text-sm text-gray-500">
                    <p>Expected Launch: <span className="font-semibold text-gray-700">Q1 2025</span></p>
                </div>
            </div>
        </div>
    )
}
