# 🚀 Quick Integration Guide - Productivity Features

## Overview
This guide shows you exactly how to integrate the new productivity features into your existing `StreamlinedDashboard.tsx`.

## 🎯 Integration Steps

### Step 1: Update StreamlinedDashboard.tsx Header

Add these imports at the top of `/components/StreamlinedDashboard.tsx`:

```tsx
// Add to existing imports
import { ProductivityEnhancer } from './ProductivityEnhancer';
import { AdvancedBatchOperations } from './AdvancedBatchOperations';
import { SmartFilteringSystem } from './SmartFilteringSystem';
import { ProductivityDashboard } from './ProductivityDashboard';
import { DataPortabilityManager } from './DataPortabilityManager';
```

### Step 2: Add State Management

Add these state variables inside the `StreamlinedDashboard` component:

```tsx
// Add after existing state declarations
const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
const [filteredTasks, setFilteredTasks] = useState<LocalTask[]>([]);
const [showProductivityTab, setShowProductivityTab] = useState(false);
```

### Step 3: Add Handler Functions

Add these handler functions before the return statement:

```tsx
// Batch action handler
const handleBatchAction = async (action: string, itemIds: string[], options?: any) => {
  try {
    switch (action) {
      case 'complete':
        await Promise.all(itemIds.map(id => handleTaskUpdate(id, { status: 'completed' })));
        toast.success(`${itemIds.length} tasks completed`);
        break;
      
      case 'delete':
        await Promise.all(itemIds.map(id => handleTaskDelete(id)));
        toast.success(`${itemIds.length} tasks deleted`);
        break;
      
      case 'archive':
        await Promise.all(itemIds.map(id => handleTaskUpdate(id, { status: 'archived' })));
        toast.success(`${itemIds.length} tasks archived`);
        break;
      
      case 'update-status':
        if (options?.status) {
          await Promise.all(itemIds.map(id => 
            handleTaskUpdate(id, { status: options.status })
          ));
          toast.success(`Status updated for ${itemIds.length} tasks`);
        }
        break;
      
      case 'update-priority':
        if (options?.priority) {
          await Promise.all(itemIds.map(id => 
            handleTaskUpdate(id, { priority: options.priority })
          ));
          toast.success(`Priority updated for ${itemIds.length} tasks`);
        }
        break;
      
      case 'move':
        if (options?.projectId) {
          await Promise.all(itemIds.map(id => 
            handleTaskUpdate(id, { projectId: options.projectId })
          ));
          toast.success(`${itemIds.length} tasks moved`);
        }
        break;
      
      case 'set-due-date':
        if (options?.dueDate) {
          await Promise.all(itemIds.map(id => 
            handleTaskUpdate(id, { dueDate: options.dueDate })
          ));
          toast.success(`Due date set for ${itemIds.length} tasks`);
        }
        break;
      
      default:
        toast.error('Unknown action');
    }
    
    setSelectedTasks([]);
    await loadData();
  } catch (error) {
    console.error('Batch action error:', error);
    toast.error('Batch operation failed');
  }
};

// Quick action handler
const handleQuickAction = (action: string, data?: any) => {
  switch (action) {
    case 'create-project':
      setCurrentTab('projects');
      // Trigger project creation modal
      break;
    
    case 'create-task':
      // Trigger task creation modal
      break;
    
    case 'nav-projects':
      setCurrentTab('projects');
      break;
    
    case 'nav-analytics':
      setCurrentTab('analytics');
      break;
    
    case 'show-overdue':
      // Filter overdue tasks
      const overdue = tasks.filter(t => 
        t.dueDate && 
        new Date(t.dueDate) < new Date() && 
        t.status !== 'completed'
      );
      setFilteredTasks(overdue);
      setCurrentTab('projects');
      toast.info(`Showing ${overdue.length} overdue tasks`);
      break;
    
    case 'filter-incomplete':
      const incomplete = tasks.filter(t => t.status !== 'completed');
      setFilteredTasks(incomplete);
      toast.info(`Showing ${incomplete.length} incomplete tasks`);
      break;
    
    case 'archive-completed':
      const completed = tasks.filter(t => t.status === 'completed').map(t => t.id);
      if (completed.length > 0) {
        handleBatchAction('archive', completed);
      }
      break;
    
    case 'open-task':
      if (data) {
        // Open task detail modal with data
        setSelectedProject(projects.find(p => p.id === data.projectId) || null);
      }
      break;
    
    case 'show-priority':
      const highPriority = tasks.filter(t => 
        (t.priority === 'high' || t.priority === 'urgent') && 
        t.status !== 'completed'
      );
      setFilteredTasks(highPriority);
      toast.info(`Showing ${highPriority.length} high-priority tasks`);
      break;
    
    default:
      console.log('Quick action:', action, data);
  }
};

// Data import handler
const handleDataImport = async (data: any) => {
  try {
    // Import projects
    if (data.projects && Array.isArray(data.projects)) {
      for (const project of data.projects) {
        await localDatabase.createProject(user!.id, project);
      }
    }
    
    // Import tasks
    if (data.tasks && Array.isArray(data.tasks)) {
      for (const task of data.tasks) {
        await localDatabase.createTask({ ...task, userId: user!.id });
      }
    }
    
    await loadData();
    toast.success('Data imported successfully!');
  } catch (error) {
    console.error('Import error:', error);
    throw error;
  }
};
```

### Step 4: Update the Tabs Structure

Find the `<Tabs>` component in your return statement and add the Productivity tab:

```tsx
<TabsList className="grid w-full grid-cols-3">
  <TabsTrigger value="overview">
    <Target className="w-4 h-4 mr-2" />
    Overview
  </TabsTrigger>
  <TabsTrigger value="projects">
    <FolderOpen className="w-4 h-4 mr-2" />
    Projects
  </TabsTrigger>
  <TabsTrigger value="analytics">
    <BarChart3 className="w-4 h-4 mr-2" />
    Analytics
  </TabsTrigger>
  {/* ADD THIS NEW TAB */}
  <TabsTrigger value="productivity">
    <Zap className="w-4 h-4 mr-2" />
    Productivity
  </TabsTrigger>
  <TabsTrigger value="data">
    <Database className="w-4 h-4 mr-2" />
    Data
  </TabsTrigger>
</TabsList>
```

### Step 5: Add Tab Content

Add these new tab contents inside your `<Tabs>` component:

```tsx
{/* ADD PRODUCTIVITY TAB */}
<TabsContent value="productivity" className="space-y-6">
  <ProductivityDashboard
    projects={projects}
    tasks={tasks}
    userId={user!.id}
    onQuickAction={handleQuickAction}
  />
</TabsContent>

{/* ADD DATA MANAGEMENT TAB */}
<TabsContent value="data" className="space-y-6">
  <DataPortabilityManager
    projects={projects}
    tasks={tasks}
    profile={profile}
    onImport={handleDataImport}
  />
</TabsContent>
```

### Step 6: Add Floating Components

Add these components at the end of your return statement, just before the closing `</div>`:

```tsx
{/* Productivity Enhancer - Always visible */}
<div className="fixed bottom-6 right-6 z-40">
  <ProductivityEnhancer
    onQuickAction={handleQuickAction}
    projects={projects}
    tasks={tasks}
    userId={user!.id}
  />
</div>

{/* Batch Operations - Shows when items selected */}
<AdvancedBatchOperations
  selectedItems={selectedTasks}
  items={tasks}
  itemType="task"
  projects={projects}
  onBatchAction={handleBatchAction}
  onSelectionClear={() => setSelectedTasks([])}
/>
```

### Step 7: Add Smart Filtering to Projects Tab

Inside your "projects" TabsContent, add the SmartFilteringSystem:

```tsx
<TabsContent value="projects" className="space-y-6">
  {/* ADD THIS SMART FILTERING SYSTEM */}
  <SmartFilteringSystem
    items={tasks}
    itemType="task"
    projects={projects}
    onFilterChange={setFilteredTasks}
    onExport={(items) => {
      // Export logic
      const dataStr = JSON.stringify(items, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tasks-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }}
  />

  {/* Your existing projects content */}
  <EnhancedMinimalProjectManager
    projects={projects}
    tasks={filteredTasks.length > 0 ? filteredTasks : tasks}
    onProjectSelect={setSelectedProject}
    onProjectCreate={handleCreateProject}
    onTaskCreate={handleTaskCreate}
    onTaskUpdate={handleTaskUpdate}
    onTaskDelete={handleTaskDelete}
  />
</TabsContent>
```

### Step 8: Add Task Selection to Task Cards

Update your task rendering to support selection for batch operations:

```tsx
// In your task card component (TaskCard.tsx or similar)
<div 
  className={`task-card ${selectedTasks.includes(task.id) ? 'selected' : ''}`}
  onClick={(e) => {
    if (e.ctrlKey || e.metaKey) {
      // Cmd/Ctrl + Click for multi-select
      setSelectedTasks(prev => 
        prev.includes(task.id) 
          ? prev.filter(id => id !== task.id)
          : [...prev, task.id]
      );
    } else {
      // Regular click
      onTaskClick(task);
    }
  }}
>
  <Checkbox
    checked={selectedTasks.includes(task.id)}
    onCheckedChange={(checked) => {
      if (checked) {
        setSelectedTasks(prev => [...prev, task.id]);
      } else {
        setSelectedTasks(prev => prev.filter(id => id !== task.id));
      }
    }}
    onClick={(e) => e.stopPropagation()}
  />
  {/* Rest of task card content */}
</div>
```

## 🎨 CSS Additions

Add these styles to your `styles/globals.css`:

```css
/* Task selection styling */
.task-card.selected {
  @apply border-blue-500 bg-blue-50;
}

/* Command palette animation */
@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.command-palette {
  animation: slideIn 0.2s ease-out;
}

/* Focus mode styling */
.focus-mode-hide {
  display: none !important;
}

/* Batch actions floating bar animation */
@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(100%);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.batch-actions-bar {
  animation: slideUp 0.3s ease-out;
}
```

## ✅ Testing Checklist

After integration, test these features:

### Command Palette
- [ ] Press `Cmd/Ctrl + K` to open
- [ ] Search works
- [ ] Actions execute correctly
- [ ] ESC closes palette

### Batch Operations
- [ ] Select multiple tasks (Cmd/Ctrl + Click)
- [ ] Floating bar appears
- [ ] Batch complete works
- [ ] Batch delete works
- [ ] Batch move works
- [ ] Progress shown for large batches

### Smart Filtering
- [ ] Search filters tasks
- [ ] Status filters apply
- [ ] Priority filters work
- [ ] Save preset works
- [ ] Load preset works
- [ ] Export downloads file

### Productivity Dashboard
- [ ] Score calculates correctly
- [ ] Recommendations appear
- [ ] Priority tasks listed
- [ ] Streak displays
- [ ] Quick actions work

### Data Portability
- [ ] JSON export downloads
- [ ] CSV export works
- [ ] Markdown readable
- [ ] Import validates data
- [ ] Backup creates file

## 🐛 Common Issues & Solutions

### Issue: Command Palette Not Opening
**Solution**: Check if another app is using Cmd/Ctrl+K. Use the button instead.

### Issue: Batch Operations Slow
**Solution**: Reduce batch size in code from 10 to 5 items at a time.

### Issue: Filters Not Applying
**Solution**: Ensure `filteredTasks` state is properly passed to project manager.

### Issue: Import Fails
**Solution**: Validate JSON structure matches export format.

## 📚 Additional Resources

- **Full Documentation**: See `/PRODUCTIVITY_ENHANCEMENTS_COMPLETE.md`
- **Component API**: Check individual component files for prop types
- **Type Definitions**: Located in `/types` directory

## 🎉 You're Done!

Your DevTrack Africa platform now has enterprise-grade productivity features! 

**Next Steps:**
1. Test all features thoroughly
2. Customize styling to match your brand
3. Add more quick actions as needed
4. Gather user feedback
5. Iterate and improve

---

**Need Help?**
- Review component source code for detailed implementation
- Check console for error messages
- Verify all imports are correct
- Ensure TypeScript types match

**Happy Coding! 🚀**
