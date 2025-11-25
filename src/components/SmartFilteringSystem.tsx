/**
 * Smart Filtering System - Advanced filtering for tasks and projects
 * Features:
 * - Multiple filter criteria
 * - Saved filter presets
 * - Quick filters
 * - Smart suggestions
 * - Export filtered results
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Separator } from './ui/separator';
import { Switch } from './ui/switch';
import { 
  Filter, 
  X, 
  Save, 
  Star, 
  Calendar,
  Tag,
  Flag,
  FolderOpen,
  Search,
  SortAsc,
  SortDesc,
  Download,
  Sparkles,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';

interface FilterCriteria {
  search?: string;
  status?: string[];
  priority?: string[];
  projectId?: string[];
  tags?: string[];
  dateRange?: { start?: string; end?: string };
  hasDeadline?: boolean;
  isOverdue?: boolean;
  assignedToMe?: boolean;
}

interface FilterPreset {
  id: string;
  name: string;
  criteria: FilterCriteria;
  icon?: string;
}

interface SmartFilteringSystemProps {
  items: any[];
  itemType: 'task' | 'project';
  projects?: any[];
  onFilterChange: (filtered: any[]) => void;
  onExport?: (items: any[]) => void;
}

export function SmartFilteringSystem({
  items,
  itemType,
  projects = [],
  onFilterChange,
  onExport
}: SmartFilteringSystemProps) {
  const [filters, setFilters] = useState<FilterCriteria>({});
  const [savedPresets, setSavedPresets] = useState<FilterPreset[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [sortBy, setSortBy] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Default quick filter presets
  const quickFilters: FilterPreset[] = [
    {
      id: 'all',
      name: 'All',
      criteria: {},
      icon: '📋'
    },
    {
      id: 'today',
      name: 'Today',
      criteria: {
        dateRange: {
          start: new Date().toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0]
        }
      },
      icon: '📅'
    },
    {
      id: 'in-progress',
      name: 'In Progress',
      criteria: { status: ['in_progress'] },
      icon: '🔄'
    },
    {
      id: 'completed',
      name: 'Completed',
      criteria: { status: ['completed'] },
      icon: '✅'
    },
    {
      id: 'high-priority',
      name: 'High Priority',
      criteria: { priority: ['high', 'urgent'] },
      icon: '🔥'
    },
    {
      id: 'overdue',
      name: 'Overdue',
      criteria: { isOverdue: true },
      icon: '⚠️'
    }
  ];

  // Load saved presets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`${itemType}-filter-presets`);
    if (saved) {
      try {
        setSavedPresets(JSON.parse(saved));
      } catch (error) {
        console.error('Error loading filter presets:', error);
      }
    }
  }, [itemType]);

  // Apply filters
  const filteredItems = useMemo(() => {
    let filtered = [...items];

    // Text search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(searchLower) ||
        item.title?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(item => 
        filters.status!.includes(item.status)
      );
    }

    // Priority filter
    if (filters.priority && filters.priority.length > 0) {
      filtered = filtered.filter(item => 
        item.priority && filters.priority!.includes(item.priority)
      );
    }

    // Project filter
    if (filters.projectId && filters.projectId.length > 0) {
      filtered = filtered.filter(item => 
        item.projectId && filters.projectId!.includes(item.projectId)
      );
    }

    // Date range filter
    if (filters.dateRange) {
      const { start, end } = filters.dateRange;
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.created_at || item.startDate);
        if (start && new Date(start) > itemDate) return false;
        if (end && new Date(end) < itemDate) return false;
        return true;
      });
    }

    // Deadline filter
    if (filters.hasDeadline !== undefined) {
      filtered = filtered.filter(item => 
        filters.hasDeadline ? !!item.dueDate : !item.dueDate
      );
    }

    // Overdue filter
    if (filters.isOverdue) {
      const now = new Date();
      filtered = filtered.filter(item => 
        item.dueDate && 
        new Date(item.dueDate) < now && 
        item.status !== 'completed'
      );
    }

    // Sort
    filtered.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      // Handle dates
      if (sortBy.includes('date') || sortBy.includes('Date') || sortBy.includes('_at')) {
        aVal = aVal ? new Date(aVal).getTime() : 0;
        bVal = bVal ? new Date(bVal).getTime() : 0;
      }

      // Handle strings
      if (typeof aVal === 'string') {
        aVal = aVal.toLowerCase();
        bVal = (bVal || '').toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    return filtered;
  }, [items, filters, sortBy, sortOrder]);

  // Notify parent of filter changes
  useEffect(() => {
    onFilterChange(filteredItems);
  }, [filteredItems, onFilterChange]);

  const handleQuickFilter = (preset: FilterPreset) => {
    setFilters(preset.criteria);
    toast.success(`Filter applied: ${preset.name}`);
  };

  const handleSavePreset = () => {
    const name = prompt('Enter a name for this filter preset:');
    if (!name) return;

    const newPreset: FilterPreset = {
      id: Date.now().toString(),
      name,
      criteria: filters
    };

    const updated = [...savedPresets, newPreset];
    setSavedPresets(updated);
    localStorage.setItem(`${itemType}-filter-presets`, JSON.stringify(updated));
    toast.success('Filter preset saved!');
  };

  const handleDeletePreset = (presetId: string) => {
    const updated = savedPresets.filter(p => p.id !== presetId);
    setSavedPresets(updated);
    localStorage.setItem(`${itemType}-filter-presets`, JSON.stringify(updated));
    toast.success('Filter preset deleted');
  };

  const handleClearFilters = () => {
    setFilters({});
    toast.info('Filters cleared');
  };

  const handleExport = () => {
    if (onExport) {
      onExport(filteredItems);
      toast.success(`Exported ${filteredItems.length} items`);
    }
  };

  const activeFilterCount = Object.values(filters).filter(v => {
    if (Array.isArray(v)) return v.length > 0;
    if (typeof v === 'object') return Object.keys(v).length > 0;
    return v !== undefined && v !== '';
  }).length;

  return (
    <div className="space-y-4">
      {/* Search and Quick Actions */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={`Search ${itemType}s...`}
            value={filters.search || ''}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="w-4 h-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold">Advanced Filters</h4>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearFilters}
                    className="h-auto p-1 text-xs"
                  >
                    Clear all
                  </Button>
                )}
              </div>

              <Separator />

              {/* Status Filter */}
              <div className="space-y-2">
                <Label className="text-sm">Status</Label>
                <div className="flex flex-wrap gap-2">
                  {['todo', 'in_progress', 'completed', 'archived'].map((status) => (
                    <Badge
                      key={status}
                      variant={filters.status?.includes(status) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => {
                        const current = filters.status || [];
                        const updated = current.includes(status)
                          ? current.filter(s => s !== status)
                          : [...current, status];
                        setFilters({ ...filters, status: updated });
                      }}
                    >
                      {status.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Priority Filter */}
              {itemType === 'task' && (
                <div className="space-y-2">
                  <Label className="text-sm">Priority</Label>
                  <div className="flex flex-wrap gap-2">
                    {['low', 'medium', 'high', 'urgent'].map((priority) => (
                      <Badge
                        key={priority}
                        variant={filters.priority?.includes(priority) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          const current = filters.priority || [];
                          const updated = current.includes(priority)
                            ? current.filter(p => p !== priority)
                            : [...current, priority];
                          setFilters({ ...filters, priority: updated });
                        }}
                      >
                        {priority}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Project Filter */}
              {itemType === 'task' && projects.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-sm">Project</Label>
                  <Select
                    value={filters.projectId?.[0] || ''}
                    onValueChange={(value) => 
                      setFilters({ ...filters, projectId: value ? [value] : [] })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All projects" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All projects</SelectItem>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Special Filters */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Has deadline</Label>
                  <Switch
                    checked={filters.hasDeadline || false}
                    onCheckedChange={(checked) =>
                      setFilters({ ...filters, hasDeadline: checked || undefined })
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Overdue only</Label>
                  <Switch
                    checked={filters.isOverdue || false}
                    onCheckedChange={(checked) =>
                      setFilters({ ...filters, isOverdue: checked || undefined })
                    }
                  />
                </div>
              </div>

              <Separator />

              <Button
                variant="outline"
                size="sm"
                onClick={handleSavePreset}
                disabled={activeFilterCount === 0}
                className="w-full gap-2"
              >
                <Save className="w-4 h-4" />
                Save as Preset
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        {/* Sort */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon">
              {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-4">
              <h4 className="font-semibold">Sort By</h4>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">Date Created</SelectItem>
                  <SelectItem value="updated_at">Last Updated</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                  <SelectItem value="title">Title</SelectItem>
                  {itemType === 'task' && <SelectItem value="dueDate">Due Date</SelectItem>}
                  {itemType === 'task' && <SelectItem value="priority">Priority</SelectItem>}
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-2">
                <Button
                  variant={sortOrder === 'asc' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortOrder('asc')}
                  className="flex-1"
                >
                  <SortAsc className="w-4 h-4 mr-2" />
                  Ascending
                </Button>
                <Button
                  variant={sortOrder === 'desc' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSortOrder('desc')}
                  className="flex-1"
                >
                  <SortDesc className="w-4 h-4 mr-2" />
                  Descending
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {onExport && (
          <Button
            variant="outline"
            size="icon"
            onClick={handleExport}
            title="Export filtered results"
          >
            <Download className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Quick Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm text-muted-foreground">Quick:</span>
        {quickFilters.map((preset) => (
          <Badge
            key={preset.id}
            variant="outline"
            className="cursor-pointer hover:bg-accent"
            onClick={() => handleQuickFilter(preset)}
          >
            {preset.icon} {preset.name}
          </Badge>
        ))}
      </div>

      {/* Saved Presets */}
      {savedPresets.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">
            <Star className="w-4 h-4 inline mr-1" />
            Saved:
          </span>
          {savedPresets.map((preset) => (
            <Badge
              key={preset.id}
              variant="secondary"
              className="cursor-pointer hover:bg-secondary/80 gap-1"
            >
              <span onClick={() => handleQuickFilter(preset)}>{preset.name}</span>
              <X
                className="w-3 h-3 ml-1 hover:text-destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePreset(preset.id);
                }}
              />
            </Badge>
          ))}
        </div>
      )}

      {/* Results Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing <strong>{filteredItems.length}</strong> of <strong>{items.length}</strong> {itemType}(s)
        </span>
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-auto p-1 text-xs"
          >
            <X className="w-3 h-3 mr-1" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}

export default SmartFilteringSystem;

