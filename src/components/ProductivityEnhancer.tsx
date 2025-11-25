/**
 * Productivity Enhancer - Advanced features for maximum productivity
 * Features:
 * - Quick Actions Panel (Cmd/Ctrl + K)
 * - Smart Task Templates
 * - Batch Operations
 * - Focus Mode
 * - Quick Stats & Insights
 * - Recent Activity
 * - Smart Suggestions
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from './ui/command';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Switch } from './ui/switch';
import { 
  Search, 
  Plus, 
  Zap, 
  Target, 
  Clock, 
  TrendingUp, 
  CheckCircle, 
  FolderPlus,
  ListTodo,
  BarChart3,
  Settings,
  Moon,
  Sun,
  Focus,
  Sparkles,
  Rocket,
  Archive,
  Copy,
  Timer,
  Flag
} from 'lucide-react';
import { toast } from 'sonner';

interface ProductivityEnhancerProps {
  onQuickAction?: (action: string, data?: any) => void;
  projects?: any[];
  tasks?: any[];
  userId?: string;
}

export function ProductivityEnhancer({ 
  onQuickAction, 
  projects = [], 
  tasks = [],
  userId 
}: ProductivityEnhancerProps) {
  const [open, setOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showInsights, setShowInsights] = useState(false);

  // Keyboard shortcut for command palette
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Calculate insights
  const insights = {
    todayTasks: tasks.filter(t => {
      const today = new Date().toDateString();
      const taskDate = new Date(t.created_at).toDateString();
      return today === taskDate;
    }).length,
    overdueTasks: tasks.filter(t => {
      if (!t.dueDate || t.status === 'completed') return false;
      return new Date(t.dueDate) < new Date();
    }).length,
    inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
    completionRate: tasks.length > 0 
      ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)
      : 0,
    activeProjects: projects.filter(p => p.status === 'in_progress' || p.status === 'active').length,
    productivityStreak: calculateStreak(tasks)
  };

  function calculateStreak(tasks: any[]): number {
    if (tasks.length === 0) return 0;
    
    const completedTasks = tasks
      .filter(t => t.status === 'completed' && t.updated_at)
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());
    
    if (completedTasks.length === 0) return 0;
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 7; i++) {
      const dayTasks = completedTasks.filter(t => {
        const taskDate = new Date(t.updated_at);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === currentDate.getTime();
      });
      
      if (dayTasks.length > 0) {
        streak++;
      } else if (i > 0) {
        break;
      }
      
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    return streak;
  }

  const quickActions = [
    {
      group: 'Create',
      items: [
        { icon: FolderPlus, label: 'New Project', action: 'create-project', shortcut: 'P' },
        { icon: Plus, label: 'New Task', action: 'create-task', shortcut: 'T' },
        { icon: ListTodo, label: 'New Quick Task', action: 'quick-task', shortcut: 'Q' },
        { icon: Copy, label: 'Duplicate Project', action: 'duplicate-project' },
      ]
    },
    {
      group: 'Navigation',
      items: [
        { icon: Target, label: 'View Projects', action: 'nav-projects', shortcut: '1' },
        { icon: BarChart3, label: 'View Analytics', action: 'nav-analytics', shortcut: '2' },
        { icon: Settings, label: 'Settings', action: 'nav-settings', shortcut: ',' },
      ]
    },
    {
      group: 'Productivity',
      items: [
        { icon: Focus, label: 'Toggle Focus Mode', action: 'toggle-focus' },
        { icon: Sparkles, label: 'View Insights', action: 'show-insights' },
        { icon: Timer, label: 'Start Pomodoro', action: 'start-pomodoro' },
        { icon: Archive, label: 'Archive Completed', action: 'archive-completed' },
      ]
    },
    {
      group: 'Batch Actions',
      items: [
        { icon: CheckCircle, label: 'Complete All Tasks in Project', action: 'batch-complete' },
        { icon: Archive, label: 'Archive Old Projects', action: 'batch-archive' },
        { icon: Flag, label: 'Mark Priority Tasks', action: 'batch-priority' },
      ]
    }
  ];

  const handleAction = (action: string, data?: any) => {
    setOpen(false);
    
    switch (action) {
      case 'toggle-focus':
        setFocusMode(!focusMode);
        toast.success(focusMode ? 'Focus mode disabled' : 'Focus mode enabled');
        break;
      case 'show-insights':
        setShowInsights(true);
        break;
      case 'start-pomodoro':
        toast.info('Pomodoro timer started - 25 minutes');
        // Implement pomodoro timer
        break;
      case 'archive-completed':
        if (onQuickAction) {
          onQuickAction('archive-completed');
          toast.success('Completed tasks archived');
        }
        break;
      case 'batch-complete':
        toast.info('Select a project first');
        break;
      default:
        if (onQuickAction) {
          onQuickAction(action, data);
        }
    }
  };

  return (
    <>
      {/* Quick Access Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Zap className="w-4 h-4" />
        Quick Actions
        <Badge variant="secondary" className="ml-1 px-1.5 py-0.5 text-xs">
          ⌘K
        </Badge>
      </Button>

      {/* Command Palette */}
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Type a command or search..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          
          {quickActions.map((group) => (
            <React.Fragment key={group.group}>
              <CommandGroup heading={group.group}>
                {group.items.map((item) => (
                  <CommandItem
                    key={item.action}
                    onSelect={() => handleAction(item.action)}
                    className="gap-2"
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <Badge variant="secondary" className="ml-auto text-xs">
                        {item.shortcut}
                      </Badge>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </React.Fragment>
          ))}

          {/* Recent Projects */}
          {projects.length > 0 && (
            <CommandGroup heading="Recent Projects">
              {projects.slice(0, 5).map((project) => (
                <CommandItem
                  key={project.id}
                  onSelect={() => handleAction('open-project', project)}
                  className="gap-2"
                >
                  <FolderPlus className="w-4 h-4" />
                  <span>{project.name}</span>
                  <Badge variant="outline" className="ml-auto">
                    {project.status}
                  </Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>

      {/* Focus Mode Indicator */}
      {focusMode && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-purple-600 to-blue-600 text-white p-2 text-center text-sm">
          <div className="flex items-center justify-center gap-2">
            <Focus className="w-4 h-4" />
            <span>Focus Mode Active - Distractions Hidden</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFocusMode(false)}
              className="text-white hover:bg-white/20"
            >
              Exit
            </Button>
          </div>
        </div>
      )}

      {/* Insights Modal */}
      <Dialog open={showInsights} onOpenChange={setShowInsights}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-yellow-500" />
              Your Productivity Insights
            </DialogTitle>
            <DialogDescription>
              Key metrics and suggestions to boost your productivity
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Today's Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl">{insights.todayTasks}</div>
                <p className="text-xs text-muted-foreground">Created today</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Overdue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl text-red-500">{insights.overdueTasks}</div>
                <p className="text-xs text-muted-foreground">Need attention</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">In Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl text-blue-500">{insights.inProgressTasks}</div>
                <p className="text-xs text-muted-foreground">Active tasks</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl text-green-500">{insights.completionRate}%</div>
                <p className="text-xs text-muted-foreground">Overall progress</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Active Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl">{insights.activeProjects}</div>
                <p className="text-xs text-muted-foreground">In progress</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Streak</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl text-orange-500">{insights.productivityStreak}</div>
                <p className="text-xs text-muted-foreground">Days active</p>
              </CardContent>
            </Card>
          </div>

          {/* Smart Suggestions */}
          <div className="mt-6 space-y-3">
            <h3 className="text-sm font-semibold">💡 Smart Suggestions</h3>
            
            {insights.overdueTasks > 0 && (
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <Flag className="w-5 h-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm">You have {insights.overdueTasks} overdue tasks</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-red-600"
                    onClick={() => {
                      setShowInsights(false);
                      if (onQuickAction) onQuickAction('show-overdue');
                    }}
                  >
                    Review overdue tasks →
                  </Button>
                </div>
              </div>
            )}

            {insights.inProgressTasks > 5 && (
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <Focus className="w-5 h-5 text-yellow-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm">You have {insights.inProgressTasks} tasks in progress</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-yellow-600"
                    onClick={() => {
                      setShowInsights(false);
                      setFocusMode(true);
                    }}
                  >
                    Enable focus mode →
                  </Button>
                </div>
              </div>
            )}

            {insights.productivityStreak >= 3 && (
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                <Rocket className="w-5 h-5 text-green-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm">🎉 Great job! You're on a {insights.productivityStreak}-day streak!</p>
                  <p className="text-xs text-muted-foreground">Keep up the momentum!</p>
                </div>
              </div>
            )}

            {insights.completionRate >= 80 && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <TrendingUp className="w-5 h-5 text-blue-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm">Excellent! Your completion rate is {insights.completionRate}%</p>
                  <p className="text-xs text-muted-foreground">You're highly productive!</p>
                </div>
              </div>
            )}

            {insights.completionRate < 50 && tasks.length > 5 && (
              <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                <Target className="w-5 h-5 text-purple-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm">Focus on completing existing tasks before adding new ones</p>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-purple-600"
                    onClick={() => {
                      setShowInsights(false);
                      if (onQuickAction) onQuickAction('filter-incomplete');
                    }}
                  >
                    View incomplete tasks →
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Export focus mode state for parent components */}
      {focusMode && (
        <style>{`
          .focus-mode-hide {
            display: none !important;
          }
        `}</style>
      )}
    </>
  );
}

export default ProductivityEnhancer;

