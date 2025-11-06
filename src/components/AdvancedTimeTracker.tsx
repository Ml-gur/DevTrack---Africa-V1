/**
 * Advanced Time Tracker - Enhanced time tracking with analytics
 * Features:
 * - Pomodoro timer
 * - Manual time entry
 * - Time analytics
 * - Daily/Weekly reports
 * - Time estimates vs actual
 * - Productivity insights
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { 
  Timer, 
  Play, 
  Pause, 
  Square, 
  Clock, 
  TrendingUp,
  Calendar,
  BarChart3,
  Coffee,
  Target,
  Zap,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface TimeEntry {
  id: string;
  taskId?: string;
  taskName?: string;
  projectId?: string;
  projectName?: string;
  startTime: string;
  endTime?: string;
  duration: number; // in minutes
  type: 'pomodoro' | 'manual' | 'automatic';
  notes?: string;
}

interface AdvancedTimeTrackerProps {
  taskId?: string;
  taskName?: string;
  projectId?: string;
  projectName?: string;
  initialTime?: number; // in minutes
  onTimeUpdate?: (minutes: number) => void;
  showAnalytics?: boolean;
}

const POMODORO_WORK = 25; // minutes
const POMODORO_SHORT_BREAK = 5;
const POMODORO_LONG_BREAK = 15;

export function AdvancedTimeTracker({
  taskId,
  taskName = 'Current Task',
  projectId,
  projectName,
  initialTime = 0,
  onTimeUpdate,
  showAnalytics = true
}: AdvancedTimeTrackerProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(initialTime * 60); // in seconds
  const [startTime, setStartTime] = useState<number | null>(null);
  
  // Pomodoro state
  const [pomodoroMode, setPomodoroMode] = useState<'work' | 'short-break' | 'long-break'>('work');
  const [pomodoroCount, setPomodoroCount] = useState(0);
  const [pomodoroTime, setPomodoroTime] = useState(POMODORO_WORK * 60);
  
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([]);
  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualMinutes, setManualMinutes] = useState('');
  const [manualNotes, setManualNotes] = useState('');

  // Load time entries from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('time-entries');
    if (saved) {
      try {
        setTimeEntries(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading time entries:', error);
      }
    }
  }, []);

  // Save time entries to localStorage
  useEffect(() => {
    if (timeEntries.length > 0) {
      localStorage.setItem('time-entries', JSON.stringify(timeEntries));
    }
  }, [timeEntries]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning) {
      interval = setInterval(() => {
        if (pomodoroMode === 'work') {
          setElapsedTime(prev => prev + 1);
        }
        setPomodoroTime(prev => {
          if (prev <= 1) {
            // Pomodoro completed
            handlePomodoroComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, pomodoroMode]);

  const handlePomodoroComplete = () => {
    setIsRunning(false);
    
    if (pomodoroMode === 'work') {
      const newCount = pomodoroCount + 1;
      setPomodoroCount(newCount);
      
      // Play sound (optional)
      toast.success('Pomodoro completed! Take a break.');
      
      // Determine next break type
      if (newCount % 4 === 0) {
        setPomodoroMode('long-break');
        setPomodoroTime(POMODORO_LONG_BREAK * 60);
        toast.info(`Time for a long break! (${POMODORO_LONG_BREAK} minutes)`);
      } else {
        setPomodoroMode('short-break');
        setPomodoroTime(POMODORO_SHORT_BREAK * 60);
        toast.info(`Time for a short break! (${POMODORO_SHORT_BREAK} minutes)`);
      }
    } else {
      // Break finished
      toast.success('Break finished! Ready for another pomodoro?');
      setPomodoroMode('work');
      setPomodoroTime(POMODORO_WORK * 60);
    }
  };

  const handleStart = () => {
    setIsRunning(true);
    setStartTime(Date.now());
  };

  const handlePause = () => {
    setIsRunning(false);
    
    if (startTime && pomodoroMode === 'work') {
      const duration = Math.floor((Date.now() - startTime) / (1000 * 60));
      if (duration > 0) {
        addTimeEntry({
          type: 'automatic',
          duration,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date().toISOString()
        });
      }
    }
    
    setStartTime(null);
  };

  const handleStop = () => {
    if (startTime && pomodoroMode === 'work') {
      const duration = Math.floor((Date.now() - startTime) / (1000 * 60));
      if (duration > 0) {
        addTimeEntry({
          type: 'automatic',
          duration,
          startTime: new Date(startTime).toISOString(),
          endTime: new Date().toISOString()
        });
      }
    }
    
    setIsRunning(false);
    setStartTime(null);
    
    // Notify parent
    if (onTimeUpdate) {
      onTimeUpdate(Math.floor(elapsedTime / 60));
    }
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedTime(0);
    setPomodoroTime(POMODORO_WORK * 60);
    setPomodoroMode('work');
    setStartTime(null);
  };

  const addTimeEntry = (entry: Partial<TimeEntry>) => {
    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      taskId,
      taskName,
      projectId,
      projectName,
      ...entry,
      duration: entry.duration || 0,
      startTime: entry.startTime || new Date().toISOString(),
      type: entry.type || 'manual'
    };

    setTimeEntries(prev => [newEntry, ...prev]);
    
    if (onTimeUpdate) {
      const totalMinutes = Math.floor(elapsedTime / 60) + newEntry.duration;
      onTimeUpdate(totalMinutes);
    }
  };

  const handleManualEntry = () => {
    const minutes = parseInt(manualMinutes);
    if (isNaN(minutes) || minutes <= 0) {
      toast.error('Please enter a valid number of minutes');
      return;
    }

    addTimeEntry({
      type: 'manual',
      duration: minutes,
      notes: manualNotes,
      startTime: new Date().toISOString()
    });

    setElapsedTime(prev => prev + minutes * 60);
    setManualMinutes('');
    setManualNotes('');
    setShowManualEntry(false);
    toast.success(`${minutes} minutes logged`);
  };

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTodayEntries = () => {
    const today = new Date().toDateString();
    return timeEntries.filter(entry => 
      new Date(entry.startTime).toDateString() === today
    );
  };

  const getTodayTotal = () => {
    return getTodayEntries().reduce((sum, entry) => sum + entry.duration, 0);
  };

  const getWeekTotal = () => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return timeEntries
      .filter(entry => new Date(entry.startTime) >= weekAgo)
      .reduce((sum, entry) => sum + entry.duration, 0);
  };

  const pomodoroProgress = ((POMODORO_WORK * 60 - pomodoroTime) / (POMODORO_WORK * 60)) * 100;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Timer className="w-5 h-5" />
              Time Tracker
            </CardTitle>
            <CardDescription>{taskName}</CardDescription>
          </div>
          <Badge variant={isRunning ? "default" : "secondary"}>
            {isRunning ? 'Running' : 'Stopped'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="timer" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="timer">Timer</TabsTrigger>
            <TabsTrigger value="pomodoro">Pomodoro</TabsTrigger>
            {showAnalytics && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
          </TabsList>

          {/* Regular Timer */}
          <TabsContent value="timer" className="space-y-4">
            <div className="text-center space-y-4">
              <div className="text-5xl tabular-nums">
                {formatTime(elapsedTime)}
              </div>

              <div className="flex items-center justify-center gap-2">
                {!isRunning ? (
                  <Button onClick={handleStart} className="gap-2">
                    <Play className="w-4 h-4" />
                    Start
                  </Button>
                ) : (
                  <Button onClick={handlePause} variant="secondary" className="gap-2">
                    <Pause className="w-4 h-4" />
                    Pause
                  </Button>
                )}
                <Button onClick={handleStop} variant="outline" className="gap-2">
                  <Square className="w-4 h-4" />
                  Stop
                </Button>
                <Button onClick={handleReset} variant="ghost" size="icon">
                  <Clock className="w-4 h-4" />
                </Button>
              </div>

              <Button
                variant="outline"
                onClick={() => setShowManualEntry(true)}
                className="gap-2"
              >
                <Clock className="w-4 h-4" />
                Add Manual Entry
              </Button>
            </div>
          </TabsContent>

          {/* Pomodoro Timer */}
          <TabsContent value="pomodoro" className="space-y-4">
            <div className="text-center space-y-4">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Coffee className="w-5 h-5" />
                <span className="capitalize">{pomodoroMode.replace('-', ' ')}</span>
                <Badge variant="secondary">#{pomodoroCount}</Badge>
              </div>

              <div className="text-5xl tabular-nums">
                {formatTime(pomodoroTime)}
              </div>

              <Progress value={pomodoroProgress} className="h-2" />

              <div className="flex items-center justify-center gap-2">
                {!isRunning ? (
                  <Button onClick={handleStart} className="gap-2">
                    <Play className="w-4 h-4" />
                    Start Pomodoro
                  </Button>
                ) : (
                  <Button onClick={handlePause} variant="secondary" className="gap-2">
                    <Pause className="w-4 h-4" />
                    Pause
                  </Button>
                )}
                <Button onClick={handleReset} variant="outline" className="gap-2">
                  <Square className="w-4 h-4" />
                  Reset
                </Button>
              </div>

              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Target className="w-4 h-4" />
                {4 - (pomodoroCount % 4)} pomodoros until long break
              </div>
            </div>
          </TabsContent>

          {/* Analytics */}
          {showAnalytics && (
            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Today</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl">{Math.floor(getTodayTotal() / 60)}h {getTodayTotal() % 60}m</div>
                    <p className="text-xs text-muted-foreground">{getTodayEntries().length} entries</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">This Week</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl">{Math.floor(getWeekTotal() / 60)}h {getWeekTotal() % 60}m</div>
                    <p className="text-xs text-muted-foreground">Last 7 days</p>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Recent Entries</h4>
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {getTodayEntries().slice(0, 5).map((entry) => (
                    <div key={entry.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          {entry.type}
                        </Badge>
                        <span>{entry.taskName || 'Task'}</span>
                      </div>
                      <span>{entry.duration}m</span>
                    </div>
                  ))}
                  {getTodayEntries().length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No time entries today
                    </p>
                  )}
                </div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </CardContent>

      {/* Manual Entry Dialog */}
      <Dialog open={showManualEntry} onOpenChange={setShowManualEntry}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Manual Time Entry</DialogTitle>
            <DialogDescription>
              Log time you've already spent on this task
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="minutes">Minutes</Label>
              <Input
                id="minutes"
                type="number"
                placeholder="60"
                value={manualMinutes}
                onChange={(e) => setManualMinutes(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input
                id="notes"
                placeholder="What did you work on?"
                value={manualNotes}
                onChange={(e) => setManualNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowManualEntry(false)}>
                Cancel
              </Button>
              <Button onClick={handleManualEntry}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Log Time
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export default AdvancedTimeTracker;
