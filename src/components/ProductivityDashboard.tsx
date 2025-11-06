/**
 * Productivity Dashboard - Centralized productivity hub
 * Features:
 * - Real-time productivity metrics
 * - Quick actions and shortcuts
 * - Task prioritization AI
 * - Focus recommendations
 * - Performance trends
 * - Goal tracking
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  TrendingUp, 
  TrendingDown,
  Target,
  Zap,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Flame,
  Award,
  BarChart3,
  Activity,
  Brain,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface ProductivityDashboardProps {
  projects: any[];
  tasks: any[];
  userId: string;
  onQuickAction?: (action: string, data?: any) => void;
}

export function ProductivityDashboard({
  projects,
  tasks,
  userId,
  onQuickAction
}: ProductivityDashboardProps) {
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('week');

  // Calculate productivity metrics
  const metrics = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const startDate = timeframe === 'today' ? today : timeframe === 'week' ? weekAgo : monthAgo;

    const filteredTasks = tasks.filter(t => new Date(t.created_at) >= startDate);
    const completedTasks = filteredTasks.filter(t => t.status === 'completed');
    const inProgressTasks = filteredTasks.filter(t => t.status === 'in_progress');
    const overdueTasks = tasks.filter(t => 
      t.dueDate && 
      new Date(t.dueDate) < now && 
      t.status !== 'completed'
    );

    // Completion rate
    const completionRate = filteredTasks.length > 0 
      ? (completedTasks.length / filteredTasks.length) * 100 
      : 0;

    // Average completion time
    const completedWithTime = completedTasks.filter(t => t.timeSpentMinutes);
    const avgCompletionTime = completedWithTime.length > 0
      ? completedWithTime.reduce((sum, t) => sum + (t.timeSpentMinutes || 0), 0) / completedWithTime.length
      : 0;

    // Productivity score (0-100)
    const productivityScore = Math.round(
      (completionRate * 0.4) +
      (Math.min(completedTasks.length / 10, 1) * 30) +
      (Math.max(0, 1 - (overdueTasks.length / 10)) * 30)
    );

    // Streak
    let streak = 0;
    let checkDate = new Date(today);
    for (let i = 0; i < 30; i++) {
      const dayTasks = tasks.filter(t => {
        const taskDate = new Date(t.updated_at);
        return t.status === 'completed' &&
          taskDate.getDate() === checkDate.getDate() &&
          taskDate.getMonth() === checkDate.getMonth() &&
          taskDate.getFullYear() === checkDate.getFullYear();
      });

      if (dayTasks.length > 0) {
        streak++;
      } else if (i > 0) {
        break;
      }

      checkDate.setDate(checkDate.getDate() - 1);
    }

    // Trending
    const lastPeriodStart = new Date(startDate);
    if (timeframe === 'today') {
      lastPeriodStart.setDate(lastPeriodStart.getDate() - 1);
    } else if (timeframe === 'week') {
      lastPeriodStart.setDate(lastPeriodStart.getDate() - 7);
    } else {
      lastPeriodStart.setMonth(lastPeriodStart.getMonth() - 1);
    }

    const lastPeriodTasks = tasks.filter(t => {
      const date = new Date(t.created_at);
      return date >= lastPeriodStart && date < startDate;
    });
    const lastPeriodCompleted = lastPeriodTasks.filter(t => t.status === 'completed').length;
    
    const trend = completedTasks.length > lastPeriodCompleted ? 'up' : 
                  completedTasks.length < lastPeriodCompleted ? 'down' : 'stable';
    const trendPercentage = lastPeriodCompleted > 0
      ? Math.abs(((completedTasks.length - lastPeriodCompleted) / lastPeriodCompleted) * 100)
      : 0;

    return {
      totalTasks: filteredTasks.length,
      completedTasks: completedTasks.length,
      inProgressTasks: inProgressTasks.length,
      overdueTasks: overdueTasks.length,
      completionRate,
      avgCompletionTime,
      productivityScore,
      streak,
      trend,
      trendPercentage
    };
  }, [tasks, timeframe]);

  // Smart recommendations
  const recommendations = useMemo(() => {
    const recs: Array<{ type: string; title: string; description: string; action: string; priority: 'high' | 'medium' | 'low' }> = [];

    if (metrics.overdueTasks > 0) {
      recs.push({
        type: 'urgent',
        title: `${metrics.overdueTasks} Overdue Tasks`,
        description: 'Review and reschedule overdue tasks',
        action: 'show-overdue',
        priority: 'high'
      });
    }

    if (metrics.inProgressTasks > 5) {
      recs.push({
        type: 'focus',
        title: 'Too Many Active Tasks',
        description: `You have ${metrics.inProgressTasks} tasks in progress. Focus on completing a few first.`,
        action: 'enable-focus',
        priority: 'high'
      });
    }

    if (metrics.completionRate < 50 && metrics.totalTasks > 5) {
      recs.push({
        type: 'completion',
        title: 'Low Completion Rate',
        description: 'Try breaking down large tasks into smaller, manageable pieces.',
        action: 'break-down-tasks',
        priority: 'medium'
      });
    }

    if (metrics.streak >= 7) {
      recs.push({
        type: 'achievement',
        title: `${metrics.streak}-Day Streak! 🔥`,
        description: 'Amazing consistency! Keep up the great work.',
        action: 'celebrate',
        priority: 'low'
      });
    }

    const todayTasks = tasks.filter(t => {
      const today = new Date().toDateString();
      const taskDate = new Date(t.created_at).toDateString();
      return today === taskDate && t.status !== 'completed';
    });

    if (todayTasks.length === 0 && new Date().getHours() < 18) {
      recs.push({
        type: 'start',
        title: 'Start Your Day',
        description: 'Create some tasks for today to get started.',
        action: 'create-task',
        priority: 'medium'
      });
    }

    const highPriorityPending = tasks.filter(t => 
      (t.priority === 'high' || t.priority === 'urgent') && 
      t.status !== 'completed'
    );

    if (highPriorityPending.length > 0) {
      recs.push({
        type: 'priority',
        title: `${highPriorityPending.length} High-Priority Tasks`,
        description: 'Focus on high-priority tasks first.',
        action: 'show-priority',
        priority: 'high'
      });
    }

    return recs.sort((a, b) => {
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });
  }, [tasks, metrics]);

  // Priority tasks
  const priorityTasks = useMemo(() => {
    return tasks
      .filter(t => t.status !== 'completed')
      .sort((a, b) => {
        // Score based on multiple factors
        const getScore = (task: any) => {
          let score = 0;
          
          // Priority
          if (task.priority === 'urgent') score += 40;
          else if (task.priority === 'high') score += 30;
          else if (task.priority === 'medium') score += 20;
          else score += 10;
          
          // Due date
          if (task.dueDate) {
            const daysUntilDue = Math.floor((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntilDue < 0) score += 50; // Overdue
            else if (daysUntilDue === 0) score += 45; // Due today
            else if (daysUntilDue === 1) score += 40; // Due tomorrow
            else if (daysUntilDue <= 3) score += 35; // Due soon
            else if (daysUntilDue <= 7) score += 25;
          }
          
          // Status
          if (task.status === 'in_progress') score += 15;
          
          return score;
        };

        return getScore(b) - getScore(a);
      })
      .slice(0, 5);
  }, [tasks]);

  const getProductivityLevel = (score: number) => {
    if (score >= 80) return { label: 'Excellent', color: 'text-green-500', icon: Award };
    if (score >= 60) return { label: 'Good', color: 'text-blue-500', icon: TrendingUp };
    if (score >= 40) return { label: 'Fair', color: 'text-yellow-500', icon: Activity };
    return { label: 'Needs Focus', color: 'text-red-500', icon: AlertCircle };
  };

  const level = getProductivityLevel(metrics.productivityScore);

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Productivity Score
              <level.icon className={`w-4 h-4 ${level.color}`} />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl ${level.color}`}>
              {metrics.productivityScore}
            </div>
            <p className="text-xs text-muted-foreground">{level.label}</p>
            {metrics.trend !== 'stable' && (
              <div className="flex items-center gap-1 mt-2 text-xs">
                {metrics.trend === 'up' ? (
                  <TrendingUp className="w-3 h-3 text-green-500" />
                ) : (
                  <TrendingDown className="w-3 h-3 text-red-500" />
                )}
                <span className={metrics.trend === 'up' ? 'text-green-500' : 'text-red-500'}>
                  {metrics.trendPercentage.toFixed(0)}%
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Completed
              <CheckCircle className="w-4 h-4 text-green-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{metrics.completedTasks}</div>
            <Progress value={metrics.completionRate} className="mt-2 h-1" />
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.completionRate.toFixed(0)}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Streak
              <Flame className="w-4 h-4 text-orange-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">{metrics.streak}</div>
            <p className="text-xs text-muted-foreground">days active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              Avg. Time
              <Clock className="w-4 h-4 text-blue-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl">
              {Math.round(metrics.avgCompletionTime)}m
            </div>
            <p className="text-xs text-muted-foreground">per task</p>
          </CardContent>
        </Card>
      </div>

      {/* Timeframe Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Viewing:</span>
        <Button
          variant={timeframe === 'today' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTimeframe('today')}
        >
          Today
        </Button>
        <Button
          variant={timeframe === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTimeframe('week')}
        >
          This Week
        </Button>
        <Button
          variant={timeframe === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setTimeframe('month')}
        >
          This Month
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Smart Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="w-5 h-5" />
              Smart Recommendations
            </CardTitle>
            <CardDescription>
              AI-powered suggestions to boost productivity
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recommendations right now.</p>
                <p className="text-xs">You're doing great! Keep it up.</p>
              </div>
            ) : (
              recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    rec.priority === 'high' ? 'bg-red-50 border-red-200' :
                    rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-green-50 border-green-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="text-sm font-semibold mb-1">{rec.title}</h4>
                      <p className="text-xs text-muted-foreground">{rec.description}</p>
                    </div>
                    {onQuickAction && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onQuickAction(rec.action)}
                        className="h-auto p-1"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Priority Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Top Priority Tasks
            </CardTitle>
            <CardDescription>
              Focus on these tasks first
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {priorityTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No pending tasks!</p>
                <p className="text-xs">Time to create new ones.</p>
              </div>
            ) : (
              priorityTasks.map((task) => (
                <div
                  key={task.id}
                  className="p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                  onClick={() => onQuickAction?.('open-task', task)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">
                        {task.title || task.name}
                      </h4>
                      {task.projectId && (
                        <p className="text-xs text-muted-foreground">
                          {projects.find(p => p.id === task.projectId)?.name || 'Unknown Project'}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {task.priority && (
                        <Badge variant={
                          task.priority === 'urgent' ? 'destructive' :
                          task.priority === 'high' ? 'default' :
                          'secondary'
                        } className="text-xs">
                          {task.priority}
                        </Badge>
                      )}
                      {task.dueDate && new Date(task.dueDate) < new Date() && (
                        <AlertCircle className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      {metrics.overdueTasks > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <div>
                  <p className="font-semibold text-red-900">
                    {metrics.overdueTasks} Overdue {metrics.overdueTasks === 1 ? 'Task' : 'Tasks'}
                  </p>
                  <p className="text-sm text-red-700">
                    Review and reschedule to stay on track
                  </p>
                </div>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onQuickAction?.('show-overdue')}
              >
                Review Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default ProductivityDashboard;
