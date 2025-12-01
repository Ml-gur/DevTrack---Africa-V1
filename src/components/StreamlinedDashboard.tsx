/**
 * Streamlined Dashboard - Focused on Project Management and Analytics
 * Removed: Community, Messaging, Collaboration, Templates
 * Kept: Projects (with full CRUD), Analytics (global dashboard)
 */

import React, { useState, useEffect, Suspense, lazy } from 'react';
import { useAuth } from '../contexts/SupabaseAuthContext';
import { localDatabase, Project as LocalProject, Task as LocalTask } from '../utils/supabase-database';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { DashboardLoader } from './OptimizedLoader';
import {
  FolderOpen,
  Plus,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  Settings as SettingsIcon,
  LogOut,
  Eye,
  BarChart3,
  Rocket,
  Globe,
  User,
  LayoutDashboard,
  Users,
  ChevronRight,
  Calendar,
  MessageSquare,
  FolderSearch,
  ChevronDown
} from 'lucide-react';
import {
  Dashboard,
  Task,
  Folder,
  Analytics,
  UserMultiple,
  ChevronDown as ChevronDownIcon,
  Search as SearchIcon,
} from '@carbon/icons-react';
import { Task as UITask } from '../types/task';

// Import keyboard shortcuts manager (not lazy - needs to be active always)
import KeyboardShortcutsManager from './KeyboardShortcutsManager';

// Lazy load components
const EnhancedMinimalProjectManager = lazy(() => import('./EnhancedMinimalProjectManager'));
const SettingsPanel = lazy(() => import('./SettingsPanel'));
const ProjectCreationHub = lazy(() => import('./ProjectCreationHub'));
const EnhancedAnalyticsDashboard = lazy(() => import('./EnhancedAnalyticsDashboard'));
const ProfileViewer = lazy(() => import('./ProfileViewer'));

export default function StreamlinedDashboard() {
  const { user, profile, signOut } = useAuth();
  const [projects, setProjects] = useState<LocalProject[]>([]);
  const [tasks, setTasks] = useState<LocalTask[]>([]);
  const [selectedProject, setSelectedProject] = useState<LocalProject | null>(null);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    archivedProjects: 0,
    totalTasks: 0,
    completedTasks: 0
  });
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [activeNav, setActiveNav] = useState<string>('overview'); // Changed from currentTab
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load data
  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Auto-update all project statuses when tasks change
  useEffect(() => {
    if (tasks.length > 0 && projects.length > 0) {
      const projectsToUpdate = new Set(tasks.map(t => t.projectId).filter(Boolean));
      projectsToUpdate.forEach(projectId => {
        updateProjectStatus(projectId);
      });
    }
  }, [tasks.length, tasks.filter(t => t.status === 'completed').length]);

  const loadData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const userProjects = await localDatabase.getProjects(user.id);
      const userTasks = await localDatabase.getUserTasks(user.id);

      setProjects(userProjects);
      setTasks(userTasks);

      setStats({
        totalProjects: userProjects.length,
        activeProjects: userProjects.filter(p => p.status === 'active' || p.status === 'in_progress').length,
        completedProjects: userProjects.filter(p => p.status === 'completed').length,
        archivedProjects: userProjects.filter(p => p.status === 'archived').length,
        totalTasks: userTasks.length,
        completedTasks: userTasks.filter(t => t.status === 'completed').length
      });
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Project creation handler
  const handleCreateProject = async (projectData: any): Promise<{ success: boolean; error?: string }> => {
    try {
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      await localDatabase.createProject(user.id, {
        ...projectData,
        status: projectData.status || 'in_progress'
      });

      await loadData();
      toast.success('Project created successfully!');
      return { success: true };
    } catch (error) {
      console.error('Error creating project:', error);
      toast.error('Failed to create project');
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  // Task handlers
  const handleTaskUpdate = async (taskId: string, updates: Partial<LocalTask>) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      // Handle time tracking
      let timeUpdates = {};

      // If moving to in_progress, start timer
      if (updates.status === 'in_progress' && task.status !== 'in_progress') {
        timeUpdates = { timerStartTime: new Date().toISOString() };
      }

      // If moving from in_progress to completed, calculate time spent
      if (updates.status === 'completed' && task.status === 'in_progress' && task.timerStartTime) {
        const startTime = new Date(task.timerStartTime).getTime();
        const endTime = new Date().getTime();
        const minutesSpent = Math.round((endTime - startTime) / (1000 * 60));
        timeUpdates = {
          timeSpentMinutes: (task.timeSpentMinutes || 0) + minutesSpent,
          timerStartTime: undefined
        };
      }

      const updated = {
        ...task,
        ...updates,
        ...timeUpdates,
        updated_at: new Date().toISOString()
      };

      await localDatabase.updateTask(taskId, updated);
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));

      // Auto-update project status based on tasks
      if (task.projectId) {
        await updateProjectStatus(task.projectId);
      }

      toast.success('Task updated successfully');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const handleTaskCreate = async (newTask: Omit<UITask, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!user) return;

    try {
      const taskToCreate = {
        ...newTask,
        userId: newTask.userId || user.id,
        description: newTask.description || '',
        tags: newTask.tags || [],
        timeSpentMinutes: newTask.timeSpentMinutes || 0,
        dependencies: newTask.dependencies || []
      };

      const createdTask = await localDatabase.createTask(taskToCreate);
      if (createdTask) {
        setTasks(prev => [createdTask, ...prev]);
        toast.success('Task created successfully');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };

  const handleTaskDelete = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      await localDatabase.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));

      // Auto-update project status after task deletion
      if (task?.projectId) {
        // Need to wait a bit for state to update
        setTimeout(() => updateProjectStatus(task.projectId), 100);
      }

      toast.success('Task deleted successfully');
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    }
  };

  const handleTaskTimeUpdate = async (taskId: string, minutes: number) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const updated = {
        ...task,
        timeSpentMinutes: (task.timeSpentMinutes || 0) + minutes,
        updated_at: new Date().toISOString()
      };

      await localDatabase.updateTask(taskId, updated);
      setTasks(prev => prev.map(t => t.id === taskId ? updated : t));
    } catch (error) {
      console.error('Error updating task time:', error);
      toast.error('Failed to update time');
    }
  };

  // Auto-update project status based on tasks
  const updateProjectStatus = async (projectId: string) => {
    // Get fresh tasks for this project
    const projectTasks = tasks.filter(t => t.projectId === projectId);
    const project = projects.find(p => p.id === projectId);

    if (!project) return;

    // Calculate progress percentage
    const totalTasks = projectTasks.length;
    const completedTasks = projectTasks.filter(t => t.status === 'completed').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const allCompleted = totalTasks > 0 && projectTasks.every(t => t.status === 'completed');
    const hasInProgress = projectTasks.some(t => t.status === 'in_progress');
    const hasTodo = projectTasks.some(t => t.status === 'todo');

    const updates: Partial<LocalProject> = {
      // progress is calculated but not stored in DB
    };

    // Auto-update status based on task completion
    if (allCompleted && totalTasks > 0 && project.status !== 'completed') {
      updates.status = 'completed';
      toast.success('🎉 Project completed! All tasks are done.', {
        duration: 4000
      });
    } else if ((hasInProgress || hasTodo) && project.status === 'completed') {
      // If project was completed but has active/pending tasks, move back to in_progress
      updates.status = 'in_progress';
    } else if (hasInProgress && project.status !== 'in_progress' && project.status !== 'completed') {
      // Auto-start project when first task is in progress
      updates.status = 'in_progress';
    }

    // Only update if there are changes
    if (updates.status && updates.status !== project.status) {
      const updated = await localDatabase.updateProject(projectId, updates);
      if (updated) {
        setProjects(prev => prev.map(p => p.id === projectId ? updated : p));
        if (selectedProject?.id === projectId) {
          setSelectedProject(updated);
        }
      }
    }
  };

  const handleProjectUpdate = async (projectId: string, updates: any) => {
    try {
      const project = projects.find(p => p.id === projectId);
      if (!project) return;

      // Prevent manual completion if there are incomplete tasks
      if (updates.status === 'completed') {
        const projectTasks = tasks.filter(t => t.projectId === projectId);
        const hasIncompleteTasks = projectTasks.some(t => t.status !== 'completed');

        if (hasIncompleteTasks) {
          toast.error('Cannot mark project as completed. Complete all tasks first.');
          return;
        }
      }

      const safeUpdates = {
        ...updates,
        description: updates.description || undefined
      };

      const updated = await localDatabase.updateProject(projectId, safeUpdates);
      if (updated) {
        setProjects(prev => prev.map(p => p.id === projectId ? updated : p));
        if (selectedProject?.id === projectId) {
          setSelectedProject(updated);
        }
        toast.success('Project updated successfully');
        await loadData(); // Reload to update stats
      }
    } catch (error) {
      console.error('Error updating project:', error);
      toast.error('Failed to update project');
    }
  };

  const handleProjectDelete = async (projectId: string) => {
    try {
      // Delete all tasks associated with the project
      const projectTasks = tasks.filter(t => t.projectId === projectId);
      await Promise.all(projectTasks.map(t => localDatabase.deleteTask(t.id)));

      // Delete the project
      await localDatabase.deleteProject(projectId);

      setProjects(prev => prev.filter(p => p.id !== projectId));
      setTasks(prev => prev.filter(t => t.projectId !== projectId));
      setSelectedProject(null);
      toast.success('Project deleted successfully');
      await loadData(); // Reload stats
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: 'bg-blue-100 text-blue-700 border border-blue-200',
      active: 'bg-blue-100 text-blue-700 border border-blue-200',
      in_progress: 'bg-blue-100 text-blue-700 border border-blue-200',
      completed: 'bg-green-100 text-green-700 border border-green-200',
      archived: 'bg-gray-100 text-gray-700 border border-gray-200'
    };
    return colors[status] || 'bg-gray-100 text-gray-700 border border-gray-200';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-gray-100 text-gray-700 border border-gray-200',
      medium: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
      high: 'bg-red-100 text-red-700 border border-red-200'
    };
    return colors[priority] || 'bg-gray-100 text-gray-700 border border-gray-200';
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Please log in to continue</p>
      </div>
    );
  }

  if (loading) {
    return <DashboardLoader />;
  }

  // If a project is selected, show the enhanced project manager
  if (selectedProject) {
    const projectTasks = tasks.filter(t => t.projectId === selectedProject.id);

    return (
      <Suspense fallback={<DashboardLoader />}>
        <EnhancedMinimalProjectManager
          project={selectedProject}
          tasks={projectTasks}
          milestones={[]}
          currentUserId={user.id}
          onBack={() => setSelectedProject(null)}
          onTaskUpdate={handleTaskUpdate}
          onTaskCreate={handleTaskCreate}
          onTaskDelete={handleTaskDelete}
          onTaskTimeUpdate={handleTaskTimeUpdate}
          onProjectUpdate={(updates) => handleProjectUpdate(selectedProject.id, updates)}
          onProjectDelete={() => handleProjectDelete(selectedProject.id)}
        />
      </Suspense>
    );
  }

  const softSpringEasing = "cubic-bezier(0.25, 1.1, 0.4, 1)";

  // Main dashboard view
  return (
    <div className="flex h-screen bg-gradient-to-b from-blue-50 to-white overflow-hidden">
      {/* Left Icon Rail */}


      {/* Right Detail Sidebar */}
      <aside
        className={`bg-white border-r border-gray-200 flex flex-col shadow-lg transition-all duration-500 ${sidebarCollapsed ? 'w-16 px-0' : 'w-72'
          }`}
        style={{ transitionTimingFunction: softSpringEasing }}
      >
        {/* User Profile Section - At Top */}
        <div className={`p-4 border-b border-gray-200 transition-all duration-500 ${sidebarCollapsed ? 'hidden' : 'block'}`}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-green-600 rounded-full flex items-center justify-center shadow-md flex-shrink-0">
              <span className="text-white text-base font-bold">
                {profile?.fullName ? profile.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {profile?.fullName || user.email?.split('@')[0]}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>

        {/* Section Title & Collapse Button */}
        <div className="px-4 py-3 border-b border-gray-200">
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                {activeNav === 'overview' && 'Dashboard'}
                {activeNav === 'projects' && 'Projects'}
                {activeNav === 'analytics' && 'Analytics'}
              </h2>
              <button
                onClick={() => setSidebarCollapsed(true)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Collapse sidebar"
              >
                <ChevronDownIcon size={16} className="-rotate-90 text-gray-600" />
              </button>
            </div>
          ) : (
            <div className="flex justify-center">
              <button
                onClick={() => setSidebarCollapsed(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Expand sidebar"
              >
                <ChevronDownIcon size={16} className="rotate-90 text-gray-600" />
              </button>
            </div>
          )}
        </div>

        {/* Main Menu Navigation */}
        <nav className={`flex-1 overflow-y-auto p-3 transition-all duration-500 ${sidebarCollapsed ? 'hidden' : 'block'}`}>
          <div className="space-y-1">
            <p className="px-3 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Main menu
            </p>

            <button
              onClick={() => setActiveNav('overview')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out group ${activeNav === 'overview'
                ? 'bg-gradient-to-r from-blue-50 to-green-50 text-blue-700 font-semibold shadow-sm'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <LayoutDashboard className={`w-5 h-5 transition-transform duration-200 ${activeNav === 'overview' ? 'scale-110' : 'group-hover:scale-105'}`} />
              <span className="flex-1 text-left text-sm">Overview</span>
              {activeNav === 'overview' && (
                <div className="w-1.5 h-5 bg-blue-600 rounded-full animate-pulse" />
              )}
            </button>

            <button
              onClick={() => setActiveNav('projects')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out group ${activeNav === 'projects'
                ? 'bg-gradient-to-r from-blue-50 to-green-50 text-blue-700 font-semibold shadow-sm'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <FolderOpen className={`w-5 h-5 transition-transform duration-200 ${activeNav === 'projects' ? 'scale-110' : 'group-hover:scale-105'}`} />
              <span className="flex-1 text-left text-sm">Projects</span>
              {activeNav === 'projects' && (
                <div className="w-1.5 h-5 bg-blue-600 rounded-full animate-pulse" />
              )}
            </button>



            <button
              onClick={() => setActiveNav('analytics')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ease-in-out group ${activeNav === 'analytics'
                ? 'bg-gradient-to-r from-blue-50 to-green-50 text-blue-700 font-semibold shadow-sm'
                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
            >
              <BarChart3 className={`w-5 h-5 transition-transform duration-200 ${activeNav === 'analytics' ? 'scale-110' : 'group-hover:scale-105'}`} />
              <span className="flex-1 text-left text-sm">Analytics</span>
              {activeNav === 'analytics' && (
                <div className="w-1.5 h-5 bg-blue-600 rounded-full animate-pulse" />
              )}
            </button>
          </div>

          {/* Quick Stats in Sidebar */}
          <div className="mt-6 px-3">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Stats</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between px-3 py-2 bg-blue-50 rounded-lg">
                <span className="text-xs text-gray-600">Active Projects</span>
                <span className="text-sm font-semibold text-blue-700">{stats.activeProjects}</span>
              </div>
              <div className="flex items-center justify-between px-3 py-2 bg-green-50 rounded-lg">
                <span className="text-xs text-gray-600">Tasks Done</span>
                <span className="text-sm font-semibold text-green-700">{stats.completedTasks}</span>
              </div>
            </div>
          </div>
        </nav>

        {/* Fixed Bottom Section */}
        <div className={`border-t border-gray-200 bg-white transition-all duration-500 ${sidebarCollapsed ? 'hidden' : 'block'}`}>
          {/* Profile & Logout */}
          <div className="p-3">
            <button
              onClick={() => setShowProfile(true)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-blue-50 transition-all duration-200 mb-2 group"
            >
              <User className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
              <span className="flex-1 text-left text-sm font-medium">My Profile</span>
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-600 hover:bg-red-50 transition-all duration-200 group"
            >
              <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              <span className="flex-1 text-left text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {/* Stats Overview - Always at top */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 border-b border-blue-100 sticky top-0 z-30">
          <div className="px-6 py-6">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <StatCard
                icon={<FolderOpen className="w-5 h-5 text-blue-600" />}
                label="Total Projects"
                value={stats.totalProjects}
                color="blue"
              />
              <StatCard
                icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
                label="Active"
                value={stats.activeProjects}
                color="blue"
              />
              <StatCard
                icon={<CheckCircle className="w-5 h-5 text-green-600" />}
                label="Completed"
                value={stats.completedProjects}
                color="green"
              />
              <StatCard
                icon={<Target className="w-5 h-5 text-blue-600" />}
                label="Total Tasks"
                value={stats.totalTasks}
                color="blue"
              />
              <StatCard
                icon={<CheckCircle className="w-5 h-5 text-green-600" />}
                label="Tasks Done"
                value={stats.completedTasks}
                color="green"
              />
              <StatCard
                icon={<FolderOpen className="w-5 h-5 text-gray-600" />}
                label="Archived"
                value={stats.archivedProjects}
                color="gray"
              />
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div className="px-6 py-8">
          {/* Overview Page */}
          {activeNav === 'overview' && (
            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-extrabold text-gray-900 mb-3 tracking-tight">
                  Welcome back, {profile?.fullName || user.email?.split('@')[0]}!
                </h2>
                <p className="text-gray-600 text-lg font-medium leading-relaxed">
                  Here's what's happening with your projects today.
                </p>
              </div>

              {/* Today's Focus */}
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-gray-900 mb-6 tracking-tight">Today's Focus</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Priority Tasks Card */}
                  <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h4 className="font-bold text-lg text-gray-900">Priority Tasks</h4>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-semibold">
                          {tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length} Due
                        </Badge>
                      </div>
                      {tasks.filter(t => t.priority === 'high' && t.status !== 'completed').length > 0 ? (
                        <div className="space-y-3">
                          {tasks.filter(t => t.priority === 'high' && t.status !== 'completed').slice(0, 3).map(task => (
                            <div key={task.id} className="flex items-center gap-3 text-sm p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-100 transition-all">
                              <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${task.priority === 'high' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                              <span className="flex-1 truncate font-medium text-gray-700">{task.title}</span>
                              <span className="text-xs font-medium text-gray-500">
                                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic font-medium">No high priority tasks. Great job!</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Upcoming Deadlines / Quick Stats */}
                  <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <h4 className="font-bold text-lg text-gray-900 mb-4">Quick Stats</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-xl text-center border border-gray-100">
                          <p className="text-3xl font-extrabold text-gray-900">{stats.activeProjects}</p>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Active Projects</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-xl text-center border border-gray-100">
                          <p className="text-3xl font-extrabold text-green-600">{stats.completedTasks}</p>
                          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">Tasks Done</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <Card
                  className="group hover:border-blue-400 transition-all cursor-pointer shadow-sm hover:shadow-lg border-gray-200"
                  onClick={() => setActiveNav('projects')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center group-hover:bg-blue-100 transition-colors shadow-sm">
                        <FolderOpen className="w-7 h-7 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-700 transition-colors">My Projects</h3>
                        <p className="text-sm font-medium text-gray-500">Manage your work</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 ml-auto group-hover:text-blue-500 transition-colors" />
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="group hover:border-green-400 transition-all cursor-pointer shadow-sm hover:shadow-lg border-gray-200"
                  onClick={() => setActiveNav('analytics')}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center group-hover:bg-green-100 transition-colors shadow-sm">
                        <BarChart3 className="w-7 h-7 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-gray-900 group-hover:text-green-700 transition-colors">Analytics</h3>
                        <p className="text-sm font-medium text-gray-500">View insights</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 ml-auto group-hover:text-green-500 transition-colors" />
                    </div>
                  </CardContent>
                </Card>


              </div>

              {/* Recent Projects */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 tracking-tight">Recent Projects</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setActiveNav('projects')}
                    className="font-semibold text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  >
                    View all
                  </Button>
                </div>

                {projects.length === 0 ? (
                  <Card className="border-dashed border-2 border-gray-200 shadow-none bg-gray-50/50">
                    <CardContent className="py-12 text-center">
                      <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
                        <FolderOpen className="w-8 h-8 text-blue-600" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2 text-gray-900">No projects yet</h3>
                      <p className="text-gray-600 mb-4 max-w-md mx-auto text-sm">
                        Start your development journey by creating your first project.
                      </p>
                      <Suspense fallback={<Button disabled>Loading...</Button>}>
                        <ProjectCreationHub
                          onCreateProject={handleCreateProject}
                          showTrigger={true}
                        />
                      </Suspense>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projects.slice(0, 6).map((project) => (
                      <Card
                        key={project.id}
                        className="hover:shadow-lg transition-all cursor-pointer group border-gray-200 shadow-sm overflow-hidden"
                        onClick={() => setSelectedProject(project)}
                      >
                        <div className="h-2 bg-gradient-to-r from-blue-500 to-green-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${project.status === 'completed' ? 'bg-green-100 text-green-600' :
                                project.status === 'in_progress' ? 'bg-blue-100 text-blue-600' :
                                  'bg-gray-100 text-gray-600'
                                }`}>
                                <FolderOpen className="w-5 h-5" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-base text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                  {project.title}
                                </h3>
                                <span className="text-xs text-gray-500">
                                  Updated {new Date(project.updated_at || project.created_at).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            <Badge className={getPriorityColor(project.priority)}>
                              {project.priority}
                            </Badge>
                          </div>

                          <p className="text-sm text-gray-600 mb-4 line-clamp-2 min-h-[2.5em]">
                            {project.description || "No description provided."}
                          </p>

                          <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={`text-xs ${project.status === 'completed' ? 'text-green-600 border-green-200 bg-green-50' :
                                project.status === 'in_progress' ? 'text-blue-600 border-blue-200 bg-blue-50' :
                                  'text-gray-600 border-gray-200 bg-gray-50'
                                }`}>
                                {project.status?.replace('_', ' ')}
                              </Badge>
                            </div>
                            <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" />
                              {tasks.filter(t => t.projectId === project.id && t.status === 'completed').length} / {tasks.filter(t => t.projectId === project.id).length}
                            </span>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Projects Page */}
          {activeNav === 'projects' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">My Projects</h2>
                <Suspense fallback={<Button disabled>Loading...</Button>}>
                  <ProjectCreationHub
                    onCreateProject={handleCreateProject}
                    showTrigger={true}
                  />
                </Suspense>
              </div>

              {projects.length === 0 ? (
                <Card className="border-blue-200 shadow-sm">
                  <CardContent className="py-16 text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FolderOpen className="w-8 h-8 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-gray-900">No projects yet</h3>
                    <p className="text-gray-600 mb-6 max-w-md mx-auto">
                      Start your development journey by creating your first project.
                      Track tasks, add notes, upload resources, and monitor your progress!
                    </p>
                    <Suspense fallback={<Button disabled>Loading...</Button>}>
                      <ProjectCreationHub
                        onCreateProject={handleCreateProject}
                        showTrigger={true}
                      />
                    </Suspense>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map((project) => (
                    <Card
                      key={project.id}
                      className="hover:shadow-lg transition-all cursor-pointer group border-gray-200 shadow-sm"
                      onClick={() => setSelectedProject(project)}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-lg text-gray-900 group-hover:text-green-600 transition-colors line-clamp-1">
                            {project.title}
                          </h3>
                          <Badge className={getPriorityColor(project.priority)}>
                            {project.priority}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                          {project.description}
                        </p>

                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Badge className={getStatusColor(project.status)}>
                              {project.status?.replace('_', ' ')}
                            </Badge>
                            {project.isPublic && (
                              <Badge variant="outline" className="text-xs">
                                <Globe className="w-3 h-3 mr-1" />
                                Public
                              </Badge>
                            )}
                          </div>

                          {project.tags && project.tags.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {project.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {project.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{project.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between pt-2">
                            <span className="text-xs text-muted-foreground">
                              {tasks.filter(t => t.projectId === project.id).length} tasks
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                setSelectedProject(project);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Analytics Page */}
          {activeNav === 'analytics' && (
            <Suspense fallback={<DashboardLoader />}>
              <EnhancedAnalyticsDashboard
                userId={user.id}
                projects={projects}
                tasks={tasks}
              />
            </Suspense>
          )}


        </div>
      </main>

      {/* Keyboard Shortcuts Manager */}
      <KeyboardShortcutsManager
        onNavigate={(page) => {
          if (page === 'projects') setActiveNav('projects');
          else if (page === 'analytics') setActiveNav('analytics');
        }}
        onCreateProject={() => {
          // This will be handled by ProjectCreationHub trigger
          const createButton = document.querySelector('[data-project-create-trigger]') as HTMLElement;
          createButton?.click();
        }}
        onOpenSearch={() => {
          // Implement search functionality
          toast.info('Search feature coming soon!');
        }}
        onToggleSettings={() => setShowSettings(!showSettings)}
      />

      {/* Modals */}
      {showSettings && (
        <Suspense fallback={null}>
          <SettingsPanel
            open={showSettings}
            onOpenChange={setShowSettings}
          />
        </Suspense>
      )}

      {showProfile && (
        <Suspense fallback={null}>
          <ProfileViewer
            userId={user.id}
            onBack={() => setShowProfile(false)}
            currentUserId={user.id}
          />
        </Suspense>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  label,
  value,
  color
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  const colorClasses: Record<string, { bg: string; border: string; icon: string }> = {
    blue: { bg: 'bg-white', border: 'border-blue-200', icon: 'bg-blue-100' },
    green: { bg: 'bg-white', border: 'border-green-200', icon: 'bg-green-100' },
    gray: { bg: 'bg-white', border: 'border-gray-200', icon: 'bg-gray-100' }
  };

  const colors = colorClasses[color] || colorClasses.blue;

  return (
    <div className={`p-4 rounded-lg ${colors.bg} ${colors.border} border shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 ${colors.icon} rounded-lg flex items-center justify-center flex-shrink-0`}>
          {icon}
        </div>
        <div>
          <div className="text-2xl font-bold text-gray-900">{value}</div>
          <div className="text-xs text-gray-600">{label}</div>
        </div>
      </div>
    </div>
  );
}
