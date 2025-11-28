"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import {
  Search,
  Heart,
  MessageCircle,
  Eye,
  Share2,
  X,
  ChevronDown,
  Grid3X3,
  List,
  TrendingUp,
  Filter,
  Reply,
  ThumbsUp,
} from "lucide-react"

// Types
interface Comment {
  id: string
  userId: string
  userName: string
  userAvatar: string
  content: string
  createdAt: Date
  likes: number
  likedBy: string[]
  replies?: Comment[]
}

interface Project {
  id: string
  title: string
  description: string
  longDescription: string
  category: string
  skillLevel: string
  techStack: string[]
  country: string
  author: {
    name: string
    avatar: string
    role: string
  }
  images: string[]
  views: number
  likes: number
  likedBy: string[]
  shares: number
  comments: Comment[]
  progress: number
  milestones: { name: string; completed: boolean }[]
  createdAt: Date
  engagementScore: number
}

// Initial Projects Data
const initialProjects: Project[] = [
  {
    id: "1",
    title: "E-Commerce Platform for Local Artisans",
    description:
      "A comprehensive e-commerce solution connecting African artisans with global markets. Features include multi-vendor support, mobile payments, and logistics integration.",
    longDescription:
      "A comprehensive e-commerce solution connecting African artisans with global markets. Features include multi-vendor support, mobile payments, and logistics integration. This platform empowers local craftspeople to reach international customers while maintaining their cultural authenticity.",
    category: "Web Development",
    skillLevel: "Advanced",
    techStack: ["React", "Node.js", "MongoDB", "Stripe"],
    country: "Nigeria",
    author: { name: "Amara Okafor", avatar: "/african-woman-professional.jpg", role: "Senior" },
    images: ["/ecommerce-dashboard-dark-theme.jpg", "/mobile-app-ecommerce.jpg"],
    views: 1300,
    likes: 89,
    likedBy: [],
    shares: 15,
    comments: [
      {
        id: "c1",
        userId: "u1",
        userName: "Kofi Asante",
        userAvatar: "/thoughtful-african-man.png",
        content:
          "This is amazing! The payment integration is seamless. Would love to know more about how you handled the logistics API.",
        createdAt: new Date(Date.now() - 7200000),
        likes: 12,
        likedBy: [],
      },
      {
        id: "c2",
        userId: "u2",
        userName: "Fatima Al-Hassan",
        userAvatar: "/african-woman-hijab.png",
        content: "The UI design is beautiful! Did you use any specific design system or was this custom?",
        createdAt: new Date(Date.now() - 14400000),
        likes: 8,
        likedBy: [],
      },
    ],
    progress: 85,
    milestones: [
      { name: "Design System", completed: true },
      { name: "Payment Integration", completed: true },
      { name: "Mobile App", completed: true },
      { name: "Beta Testing", completed: false },
    ],
    createdAt: new Date("2024-01-15"),
    engagementScore: 0,
  },
  {
    id: "2",
    title: "Mobile Health App for Rural Clinics",
    description:
      "A Flutter-based mobile application helping rural healthcare workers track patient records, schedule appointments, and access medical resources offline.",
    longDescription:
      "A Flutter-based mobile application helping rural healthcare workers track patient records, schedule appointments, and access medical resources offline. Designed specifically for areas with limited connectivity.",
    category: "Mobile Development",
    skillLevel: "Intermediate",
    techStack: ["Flutter", "Firebase", "Dart", "SQLite"],
    country: "Kenya",
    author: { name: "James Kariuki", avatar: "/african-man-developer.jpg", role: "Mid-level" },
    images: ["/health-app-mobile-interface.png", "/medical-dashboard.jpg"],
    views: 890,
    likes: 67,
    likedBy: [],
    shares: 12,
    comments: [
      {
        id: "c3",
        userId: "u3",
        userName: "Grace Mwangi",
        userAvatar: "/african-woman-doctor.png",
        content: "This is exactly what we need in our clinic! How can we pilot this?",
        createdAt: new Date(Date.now() - 3600000),
        likes: 15,
        likedBy: [],
      },
    ],
    progress: 70,
    milestones: [
      { name: "UI Design", completed: true },
      { name: "Offline Mode", completed: true },
      { name: "Testing", completed: false },
      { name: "Launch", completed: false },
    ],
    createdAt: new Date("2024-01-18"),
    engagementScore: 0,
  },
  {
    id: "3",
    title: "AI-Powered Agricultural Advisory System",
    description:
      "Machine learning system that provides personalized farming advice based on weather data, soil conditions, and crop types. Helps farmers optimize yields and reduce losses.",
    longDescription:
      "Machine learning system that provides personalized farming advice based on weather data, soil conditions, and crop types. Helps farmers optimize yields and reduce losses through data-driven recommendations.",
    category: "AI/ML",
    skillLevel: "Advanced",
    techStack: ["Python", "TensorFlow", "React", "PostgreSQL"],
    country: "South Africa",
    author: { name: "Zanele Mbatha", avatar: "/african-woman-scientist.jpg", role: "Senior" },
    images: ["/ai-farming-dashboard.jpg", "/agricultural-data-visualization.png"],
    views: 1700,
    likes: 134,
    likedBy: [],
    shares: 28,
    comments: [
      {
        id: "c4",
        userId: "u4",
        userName: "Emmanuel Osei",
        userAvatar: "/african-farmer.png",
        content: "This could revolutionize farming in Africa!",
        createdAt: new Date(Date.now() - 86400000),
        likes: 24,
        likedBy: [],
      },
    ],
    progress: 90,
    milestones: [
      { name: "ML Model", completed: true },
      { name: "API", completed: true },
      { name: "Mobile App", completed: true },
      { name: "Scale Testing", completed: false },
    ],
    createdAt: new Date("2024-01-10"),
    engagementScore: 0,
  },
  {
    id: "4",
    title: "Blockchain-Based Land Registry System",
    description:
      "Decentralized land ownership verification system using blockchain technology to prevent fraud and streamline property transactions in Ghana.",
    longDescription:
      "Decentralized land ownership verification system using blockchain technology to prevent fraud and streamline property transactions in Ghana. Provides immutable records and transparent ownership history.",
    category: "Blockchain",
    skillLevel: "Advanced",
    techStack: ["Solidity", "Web3.js", "React", "Ethereum"],
    country: "Ghana",
    author: { name: "Kwame Asiedu", avatar: "/african-man-professional-suit.jpg", role: "Lead" },
    images: ["/blockchain-land-registry.jpg", "/property-verification-system.jpg"],
    views: 2100,
    likes: 156,
    likedBy: [],
    shares: 41,
    comments: [
      {
        id: "c5",
        userId: "u5",
        userName: "Ama Darko",
        userAvatar: "/african-woman-lawyer.jpg",
        content: "Finally, a solution to our land dispute problems!",
        createdAt: new Date(Date.now() - 172800000),
        likes: 31,
        likedBy: [],
      },
    ],
    progress: 75,
    milestones: [
      { name: "Smart Contracts", completed: true },
      { name: "Frontend", completed: true },
      { name: "Government API", completed: false },
      { name: "Pilot", completed: false },
    ],
    createdAt: new Date("2024-01-12"),
    engagementScore: 0,
  },
  {
    id: "5",
    title: "EdTech Platform for African Languages",
    description:
      "Interactive learning platform teaching programming concepts in local African languages including Swahili, Yoruba, and Zulu.",
    longDescription:
      "Interactive learning platform teaching programming concepts in local African languages including Swahili, Yoruba, and Zulu. Making tech education accessible to non-English speakers.",
    category: "Web Development",
    skillLevel: "Intermediate",
    techStack: ["Next.js", "TypeScript", "Prisma", "PostgreSQL"],
    country: "Tanzania",
    author: { name: "Neema Kimaro", avatar: "/african-woman-teacher.jpg", role: "Mid-level" },
    images: ["/edtech-learning-platform.jpg", "/coding-education-interface.jpg"],
    views: 980,
    likes: 78,
    likedBy: [],
    shares: 19,
    comments: [],
    progress: 60,
    milestones: [
      { name: "Curriculum", completed: true },
      { name: "Platform", completed: true },
      { name: "Translations", completed: false },
      { name: "Launch", completed: false },
    ],
    createdAt: new Date("2024-01-20"),
    engagementScore: 0,
  },
  {
    id: "6",
    title: "Fintech Solution for Microloans",
    description:
      "Peer-to-peer microloan platform connecting investors with small business owners across Africa. Features credit scoring using alternative data.",
    longDescription:
      "Peer-to-peer microloan platform connecting investors with small business owners across Africa. Features credit scoring using alternative data and mobile money integration.",
    category: "Fintech",
    skillLevel: "Advanced",
    techStack: ["React", "Node.js", "Python", "AWS"],
    country: "Rwanda",
    author: { name: "Jean-Pierre Habimana", avatar: "/african-man-fintech.jpg", role: "Senior" },
    images: ["/fintech-loan-platform.jpg", "/mobile-banking-interface.jpg"],
    views: 1450,
    likes: 98,
    likedBy: [],
    shares: 22,
    comments: [
      {
        id: "c6",
        userId: "u6",
        userName: "Marie Uwimana",
        userAvatar: "/placeholder.svg?height=32&width=32",
        content: "This helped me start my small business!",
        createdAt: new Date(Date.now() - 259200000),
        likes: 45,
        likedBy: [],
      },
    ],
    progress: 95,
    milestones: [
      { name: "MVP", completed: true },
      { name: "Credit Scoring", completed: true },
      { name: "Mobile App", completed: true },
      { name: "Expansion", completed: true },
    ],
    createdAt: new Date("2024-01-08"),
    engagementScore: 0,
  },
]

// Calculate engagement score
const calculateEngagement = (project: Project): number => {
  return project.views * 1 + project.likes * 5 + project.comments.length * 10 + project.shares * 3
}

// Current user simulation
const currentUserId = "current-user"

export default function DevTrackAfrica() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTech, setSelectedTech] = useState<string[]>([])
  const [selectedSkillLevel, setSelectedSkillLevel] = useState<string>("")
  const [selectedCountry, setSelectedCountry] = useState<string>("")
  const [sortBy, setSortBy] = useState<string>("Latest")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [newComment, setNewComment] = useState("")
  const [showFilters, setShowFilters] = useState(true)

  const [stats, setStats] = useState({
    activeDevelopers: 2847,
    projectsShared: 1523,
    countries: 89,
    collaborations: 456,
  })

  // Initialize projects with engagement scores
  useEffect(() => {
    const projectsWithEngagement = initialProjects.map((p) => ({
      ...p,
      engagementScore: calculateEngagement(p),
    }))
    setProjects(projectsWithEngagement)
  }, [])

  useEffect(() => {
    const totalViews = projects.reduce((sum, p) => sum + p.views, 0)
    const totalLikes = projects.reduce((sum, p) => sum + p.likes, 0)
    const totalComments = projects.reduce((sum, p) => sum + p.comments.length, 0)
    const totalShares = projects.reduce((sum, p) => sum + p.shares, 0)

    setStats({
      activeDevelopers: 2847 + Math.floor(totalLikes / 10),
      projectsShared: projects.length + 1517,
      countries: 89,
      collaborations: 456 + Math.floor((totalComments + totalShares) / 5),
    })
  }, [projects])

  // Tech stack options
  const techStacks = [
    "JavaScript",
    "React",
    "Python",
    "Node.js",
    "Django",
    "Flutter",
    "TypeScript",
    "Next.js",
    "MongoDB",
    "PostgreSQL",
    "Firebase",
    "AWS",
    "TensorFlow",
    "Solidity",
    "Web3.js",
  ]

  // Countries
  const countries = ["Nigeria", "Kenya", "South Africa", "Ghana", "Tanzania", "Rwanda", "Ethiopia", "Uganda", "Egypt"]

  // Categories
  const categories = ["Web Development", "Mobile Development", "AI/ML", "Blockchain", "Fintech", "EdTech"]

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    const filtered = projects.filter((project) => {
      const matchesSearch =
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.author.name.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesTech = selectedTech.length === 0 || selectedTech.some((tech) => project.techStack.includes(tech))

      const matchesSkill = !selectedSkillLevel || project.skillLevel === selectedSkillLevel

      const matchesCountry = !selectedCountry || project.country === selectedCountry

      return matchesSearch && matchesTech && matchesSkill && matchesCountry
    })

    // Sort
    switch (sortBy) {
      case "Trending":
        filtered.sort((a, b) => b.engagementScore - a.engagementScore)
        break
      case "Most Viewed":
        filtered.sort((a, b) => b.views - a.views)
        break
      case "Most Liked":
        filtered.sort((a, b) => b.likes - a.likes)
        break
      case "Latest":
      default:
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    return filtered
  }, [projects, searchQuery, selectedTech, selectedSkillLevel, selectedCountry, sortBy])

  // Trending projects (top 3 by engagement)
  const trendingProjects = useMemo(() => {
    return [...projects].sort((a, b) => b.engagementScore - a.engagementScore).slice(0, 3)
  }, [projects])

  // Handle project view
  const handleViewProject = (project: Project) => {
    setProjects((prev) =>
      prev.map((p) =>
        p.id === project.id
          ? { ...p, views: p.views + 1, engagementScore: calculateEngagement({ ...p, views: p.views + 1 }) }
          : p,
      ),
    )
    setSelectedProject({ ...project, views: project.views + 1 })
  }

  // Handle like project
  const handleLikeProject = (projectId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const isLiked = p.likedBy.includes(currentUserId)
          const newLikedBy = isLiked ? p.likedBy.filter((id) => id !== currentUserId) : [...p.likedBy, currentUserId]
          const newLikes = isLiked ? p.likes - 1 : p.likes + 1
          const updated = { ...p, likes: newLikes, likedBy: newLikedBy }
          return { ...updated, engagementScore: calculateEngagement(updated) }
        }
        return p
      }),
    )
    if (selectedProject?.id === projectId) {
      setSelectedProject((prev) => {
        if (!prev) return null
        const isLiked = prev.likedBy.includes(currentUserId)
        const newLikedBy = isLiked
          ? prev.likedBy.filter((id) => id !== currentUserId)
          : [...prev.likedBy, currentUserId]
        return { ...prev, likes: isLiked ? prev.likes - 1 : prev.likes + 1, likedBy: newLikedBy }
      })
    }
  }

  // Handle add comment
  const handleAddComment = () => {
    if (!newComment.trim() || !selectedProject) return

    const comment: Comment = {
      id: `c${Date.now()}`,
      userId: currentUserId,
      userName: "You",
      userAvatar: "/placeholder.svg?height=32&width=32",
      content: newComment,
      createdAt: new Date(),
      likes: 0,
      likedBy: [],
    }

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === selectedProject.id) {
          const updated = { ...p, comments: [...p.comments, comment] }
          return { ...updated, engagementScore: calculateEngagement(updated) }
        }
        return p
      }),
    )
    setSelectedProject((prev) => (prev ? { ...prev, comments: [...prev.comments, comment] } : null))
    setNewComment("")
  }

  // Handle like comment
  const handleLikeComment = (commentId: string) => {
    if (!selectedProject) return

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === selectedProject.id) {
          return {
            ...p,
            comments: p.comments.map((c) => {
              if (c.id === commentId) {
                const isLiked = c.likedBy.includes(currentUserId)
                return {
                  ...c,
                  likes: isLiked ? c.likes - 1 : c.likes + 1,
                  likedBy: isLiked ? c.likedBy.filter((id) => id !== currentUserId) : [...c.likedBy, currentUserId],
                }
              }
              return c
            }),
          }
        }
        return p
      }),
    )
    setSelectedProject((prev) => {
      if (!prev) return null
      return {
        ...prev,
        comments: prev.comments.map((c) => {
          if (c.id === commentId) {
            const isLiked = c.likedBy.includes(currentUserId)
            return {
              ...c,
              likes: isLiked ? c.likes - 1 : c.likes + 1,
              likedBy: isLiked ? c.likedBy.filter((id) => id !== currentUserId) : [...c.likedBy, currentUserId],
            }
          }
          return c
        }),
      }
    })
  }

  // Handle share
  const handleShare = (projectId: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const updated = { ...p, shares: p.shares + 1 }
          return { ...updated, engagementScore: calculateEngagement(updated) }
        }
        return p
      }),
    )
    if (selectedProject?.id === projectId) {
      setSelectedProject((prev) => (prev ? { ...prev, shares: prev.shares + 1 } : null))
    }
  }

  // Toggle tech filter
  const handleTechFilter = (tech: string) => {
    setSelectedTech((prev) => (prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]))
  }

  // Format date
  const formatDate = (date: Date) => {
    const now = new Date()
    const diff = now.getTime() - new Date(date).getTime()
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)
    if (hours < 1) return "Just now"
    if (hours < 24) return `${hours} hours ago`
    if (days < 7) return `${days} days ago`
    return new Date(date).toLocaleDateString()
  }

  // Format number
  const formatNumber = (num: number) => {
    if (num >= 1000) return (num / 1000).toFixed(1) + "k"
    return num.toString()
  }

  // Handler to open the project modal
  const handleOpenProject = (project: Project) => {
    handleViewProject(project) // Increment view count
    setSelectedProject(project)
  }

  return (
    <div className="min-h-screen bg-[#F6F8FB]">
      {/* Header removed */}

      {/* Hero Section */}
      <section className="relative bg-[#F3EDE6] text-gray-900 py-16 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/placeholder.svg?height=400&width=1200')] bg-cover bg-center opacity-10" />
        <div className="relative max-w-4xl mx-auto text-center px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Discover Amazing <span className="text-[#EA580C]">Projects</span>
          </h1>
          <p className="text-lg text-gray-700 mb-8">
            Explore innovative projects from African developers. Share your work, get feedback, and collaborate with the
            community.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <button className="px-6 py-3 bg-[#EA580C] text-white rounded-lg font-medium hover:bg-[#EA580C]/90 transition-colors">
              Share Your Project
            </button>
            <button className="px-6 py-3 border border-gray-400 text-gray-900 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              Explore Community
            </button>
          </div>
        </div>
      </section>

      {/* Stats - Now uses real-time stats state */}
      <section className="py-12 bg-white/50">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-[#EA580C]">{stats.activeDevelopers.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Active Developers</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#EA580C]">{stats.projectsShared.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">Projects Shared</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#EA580C]">{stats.countries}</div>
            <div className="text-sm text-muted-foreground">Countries</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-[#EA580C]">{stats.collaborations}</div>
            <div className="text-sm text-muted-foreground">Collaborations</div>
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="py-8 bg-gradient-to-r from-[#c9a227]/10 to-[#EA580C]/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-[#c9a227]" />
            <h2 className="font-semibold">Trending Now</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {trendingProjects.map((project, index) => (
              <button
                key={project.id}
                onClick={() => handleOpenProject(project)}
                className="flex-shrink-0 flex items-center gap-3 bg-background rounded-lg p-3 border border-border hover:border-[#EA580C] transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-[#c9a227] flex items-center justify-center text-white font-bold text-sm">
                  {index + 1}
                </div>
                <div className="text-left">
                  <div className="font-medium text-sm line-clamp-1">{project.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {formatNumber(project.engagementScore)} engagement
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Filters */}
          <aside className={`lg:w-64 flex-shrink-0 space-y-6 ${showFilters ? "" : "hidden lg:block"}`}>
            {/* Search */}
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="font-semibold mb-3">Search Projects</h3>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EA580C] bg-background"
                />
              </div>
            </div>

            {/* Tech Stack Filter */}
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="font-semibold mb-3">Tech Stack</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {techStacks.slice(0, 6).map((tech) => (
                  <label key={tech} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      id={tech}
                      checked={selectedTech.includes(tech)}
                      onChange={() => handleTechFilter(tech)}
                      className="w-4 h-4 rounded border-border text-[#EA580C] focus:ring-[#EA580C]"
                    />
                    <span className="text-sm">{tech}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Skill Level Filter */}
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="font-semibold mb-3">Skill Level</h3>
              <div className="space-y-2">
                {["Beginner", "Intermediate", "Advanced"].map((level) => (
                  <label key={level} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="skillLevel"
                      id={level}
                      checked={selectedSkillLevel === level}
                      onChange={() => setSelectedSkillLevel(level)}
                      className="w-4 h-4 border-border text-[#EA580C] focus:ring-[#EA580C]"
                    />
                    <span className="text-sm">{level}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Country Filter */}
            <div className="bg-card rounded-xl border border-border p-4">
              <h3 className="font-semibold mb-3">Country</h3>
              <div className="relative">
                <select
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  className="w-full p-2 pr-8 border border-border rounded-lg text-sm appearance-none bg-background focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                >
                  <option value="">All Countries</option>
                  {countries.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </aside>

          {/* Projects Grid */}
          <div className="flex-1">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold">Latest Projects</h2>
                <p className="text-muted-foreground text-sm">Discover amazing projects from developers across Africa</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="lg:hidden p-2 border border-border rounded-lg"
                >
                  <Filter className="w-4 h-4" />
                </button>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="appearance-none bg-background border border-border rounded-lg px-4 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-[#EA580C]"
                  >
                    <option>Latest</option>
                    <option>Trending</option>
                    <option>Most Viewed</option>
                    <option>Most Liked</option>
                  </select>
                  <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>
                <div className="flex border border-border rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 ${viewMode === "grid" ? "bg-muted" : ""}`}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 ${viewMode === "list" ? "bg-muted" : ""}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {(selectedTech.length > 0 || selectedSkillLevel || selectedCountry !== "") && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedTech.map((tech) => (
                  <button
                    key={tech}
                    onClick={() => handleTechFilter(tech)}
                    className="flex items-center gap-1 px-3 py-1 bg-[#EA580C] text-white rounded-full text-sm"
                  >
                    {tech}
                    <X className="w-3 h-3" />
                  </button>
                ))}
                {selectedSkillLevel && (
                  <button
                    onClick={() => setSelectedSkillLevel("")}
                    className="flex items-center gap-1 px-3 py-1 bg-[#EA580C] text-white rounded-full text-sm"
                  >
                    {selectedSkillLevel}
                    <X className="w-3 h-3" />
                  </button>
                )}
                {selectedCountry && (
                  <button
                    onClick={() => setSelectedCountry("")}
                    className="flex items-center gap-1 px-3 py-1 bg-[#EA580C] text-white rounded-full text-sm"
                  >
                    {selectedCountry}
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            )}

            {/* Projects */}
            <div className={`grid gap-6 ${viewMode === "grid" ? "md:grid-cols-2" : "grid-cols-1"}`}>
              {filteredProjects.map((project) => (
                <article
                  key={project.id}
                  onClick={() => handleOpenProject(project)}
                  className="bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                >
                  {/* Image */}
                  <div className="relative aspect-video bg-muted overflow-hidden">
                    <img
                      src={project.images[0] || "/placeholder.svg"}
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex gap-2">
                      <span className="px-2 py-1 bg-[#EA580C] text-white text-xs rounded-full">{project.category}</span>
                      <span className="px-2 py-1 bg-white/90 text-[#EA580C] text-xs rounded-full">
                        {project.skillLevel}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    {/* Author */}
                    <div className="flex items-center gap-2 mb-3">
                      <img
                        src={project.author.avatar || "/placeholder.svg"}
                        alt={project.author.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <div className="font-medium text-sm">{project.author.name}</div>
                        <div className="text-xs text-muted-foreground">{project.country}</div>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="font-semibold mb-2 line-clamp-2">{project.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{project.description}</p>

                    {/* Tech Stack */}
                    <div className="flex flex-wrap gap-1 mb-4">
                      {project.techStack.slice(0, 4).map((tech) => (
                        <span key={tech} className="px-2 py-0.5 bg-muted text-xs rounded-md">
                          {tech}
                        </span>
                      ))}
                    </div>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {formatNumber(project.views)}
                        </span>
                        <button
                          onClick={(e) => handleLikeProject(project.id, e)}
                          className={`flex items-center gap-1 hover:text-red-500 transition-colors ${project.likedBy.includes(currentUserId) ? "text-red-500" : ""}`}
                        >
                          <Heart
                            className={`w-4 h-4 ${project.likedBy.includes(currentUserId) ? "fill-current" : ""}`}
                          />
                          {formatNumber(project.likes)}
                        </button>
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {project.comments.length}
                        </span>
                      </div>
                      <span className="text-xs">{new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>

                    {/* Progress */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#EA580C] rounded-full transition-all"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No projects found matching your filters.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Project Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 overflow-y-auto py-8 px-4">
          <div className="bg-card rounded-xl w-full max-w-2xl relative">
            {/* Close Button */}
            <button
              onClick={() => setSelectedProject(null)}
              className="absolute top-4 right-4 p-2 hover:bg-muted rounded-full transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="p-6 border-b border-border">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={selectedProject.author.avatar || "/placeholder.svg"}
                  alt={selectedProject.author.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div>
                  <div className="font-semibold">{selectedProject.author.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedProject.country} • {selectedProject.author.role}
                  </div>
                </div>
              </div>
              <h2 className="text-xl font-bold mb-3">{selectedProject.title}</h2>
              <div className="flex flex-wrap gap-2 mb-6">
                {selectedProject.techStack.map((tech) => (
                  <span key={tech} className="px-3 py-1 bg-[#EA580C] text-white text-xs rounded-full">
                    {tech}
                  </span>
                ))}
              </div>
            </div>

            {/* Images */}
            <div className="p-6 border-b border-border">
              <div className="grid grid-cols-2 gap-4">
                {selectedProject.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img || "/placeholder.svg"}
                    alt={`Screenshot ${idx + 1}`}
                    className="rounded-lg w-full aspect-video object-cover"
                  />
                ))}
              </div>
            </div>

            {/* About */}
            <div className="p-6 border-b border-border">
              <h3 className="font-semibold mb-2">About This Project</h3>
              <p className="text-sm text-muted-foreground">{selectedProject.longDescription}</p>
            </div>

            {/* Progress & Stats */}
            <div className="p-6 border-b border-border grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-3">Project Progress</h3>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Overall Progress</span>
                  <span>{selectedProject.progress}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-[#EA580C] rounded-full" style={{ width: `${selectedProject.progress}%` }} />
                </div>
                <div className="space-y-2">
                  {selectedProject.milestones.map((milestone, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <div className={`w-3 h-3 rounded-full ${milestone.completed ? "bg-green-500" : "bg-muted"}`} />
                      <span className={milestone.completed ? "" : "text-muted-foreground"}>{milestone.name}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-3">Project Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Views</span>
                    <span className="font-medium">{formatNumber(selectedProject.views)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Likes</span>
                    <span className="font-medium">{selectedProject.likes}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Comments</span>
                    <span className="font-medium">{selectedProject.comments.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Shares</span>
                    <span className="font-medium">{selectedProject.shares}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-6 border-b border-border flex items-center gap-4">
              <button
                onClick={() => handleLikeProject(selectedProject.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                  selectedProject.likedBy.includes(currentUserId)
                    ? "bg-red-50 border-red-200 text-red-600"
                    : "border-border hover:bg-muted"
                }`}
              >
                <Heart className={`w-4 h-4 ${selectedProject.likedBy.includes(currentUserId) ? "fill-current" : ""}`} />
                {selectedProject.likedBy.includes(currentUserId) ? "Liked" : "Like"}
              </button>
              <button
                onClick={(e) => handleShare(selectedProject.id, e)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>

            {/* Comments */}
            <div className="p-6">
              <h3 className="font-semibold mb-4">Comments ({selectedProject.comments.length})</h3>

              <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                {selectedProject.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <img
                      src={comment.userAvatar || "/placeholder.svg"}
                      alt={comment.userName}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{comment.userName}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{comment.content}</p>
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => handleLikeComment(comment.id)}
                          className={`flex items-center gap-1 text-xs ${comment.likedBy.includes(currentUserId) ? "text-[#EA580C]" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          <ThumbsUp
                            className={`w-3 h-3 ${comment.likedBy.includes(currentUserId) ? "fill-current" : ""}`}
                          />
                          {comment.likes}
                        </button>
                        <button className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                          <Reply className="w-3 h-3" />
                          Reply
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {selectedProject.comments.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No comments yet. Be the first to comment!
                  </p>
                )}
              </div>

              {/* Add Comment */}
              <div className="flex gap-3">
                <img
                  src="/placeholder.svg?height=32&width=32"
                  alt="You"
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
                <div className="flex-1 flex gap-2">
                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                    className="flex-1 px-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#EA580C] bg-background"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-[#EA580C] text-white rounded-lg text-sm font-medium hover:bg-[#EA580C]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Post Comment
                  </button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 ml-11">Be constructive and respectful</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
