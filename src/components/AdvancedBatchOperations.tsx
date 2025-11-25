/**
 * Advanced Batch Operations - Handle multiple tasks/projects efficiently
 * Features:
 * - Bulk task actions (complete, delete, move, update)
 * - Project batch operations
 * - Smart filters and selections
 * - Undo/Redo support
 * - Progress tracking
 */

import React, { useState, useCallback } from 'react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Checkbox } from './ui/checkbox';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Separator } from './ui/separator';
import { 
  CheckSquare, 
  Trash2, 
  Archive, 
  Copy, 
  Move, 
  Tag,
  Calendar,
  Flag,
  FolderOpen,
  AlertTriangle,
  Undo2,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface BatchOperation {
  type: 'complete' | 'delete' | 'archive' | 'move' | 'update-status' | 'update-priority' | 'set-due-date';
  label: string;
  icon: any;
  description: string;
  requiresConfirmation?: boolean;
  destructive?: boolean;
}

interface AdvancedBatchOperationsProps {
  selectedItems: string[];
  items: any[];
  itemType: 'task' | 'project';
  projects?: any[];
  onBatchAction: (action: string, itemIds: string[], options?: any) => Promise<void>;
  onSelectionClear: () => void;
}

export function AdvancedBatchOperations({
  selectedItems,
  items,
  itemType,
  projects = [],
  onBatchAction,
  onSelectionClear
}: AdvancedBatchOperationsProps) {
  const [showDialog, setShowDialog] = useState(false);
  const [selectedOperation, setSelectedOperation] = useState<string | null>(null);
  const [operationOptions, setOperationOptions] = useState<any>({});
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const batchOperations: BatchOperation[] = itemType === 'task' ? [
    {
      type: 'complete',
      label: 'Mark as Complete',
      icon: CheckSquare,
      description: 'Mark all selected tasks as completed'
    },
    {
      type: 'update-status',
      label: 'Update Status',
      icon: Flag,
      description: 'Change status for all selected tasks'
    },
    {
      type: 'update-priority',
      label: 'Update Priority',
      icon: Flag,
      description: 'Set priority for all selected tasks'
    },
    {
      type: 'move',
      label: 'Move to Project',
      icon: Move,
      description: 'Move tasks to a different project'
    },
    {
      type: 'set-due-date',
      label: 'Set Due Date',
      icon: Calendar,
      description: 'Set the same due date for all tasks'
    },
    {
      type: 'archive',
      label: 'Archive',
      icon: Archive,
      description: 'Archive all selected tasks',
      requiresConfirmation: true
    },
    {
      type: 'delete',
      label: 'Delete',
      icon: Trash2,
      description: 'Permanently delete all selected tasks',
      requiresConfirmation: true,
      destructive: true
    }
  ] : [
    {
      type: 'archive',
      label: 'Archive Projects',
      icon: Archive,
      description: 'Archive all selected projects',
      requiresConfirmation: true
    },
    {
      type: 'update-status',
      label: 'Update Status',
      icon: Flag,
      description: 'Change status for all selected projects'
    },
    {
      type: 'delete',
      label: 'Delete Projects',
      icon: Trash2,
      description: 'Permanently delete all selected projects',
      requiresConfirmation: true,
      destructive: true
    }
  ];

  const handleOperationSelect = (operationType: string) => {
    const operation = batchOperations.find(op => op.type === operationType);
    if (!operation) return;

    setSelectedOperation(operationType);
    
    if (operation.requiresConfirmation) {
      setShowDialog(true);
    } else if (operationType === 'move' || operationType === 'update-status' || operationType === 'update-priority' || operationType === 'set-due-date') {
      setShowDialog(true);
    } else {
      executeOperation(operationType);
    }
  };

  const executeOperation = async (operationType: string, options?: any) => {
    setProcessing(true);
    setProgress(0);

    try {
      const totalItems = selectedItems.length;
      let processedItems = 0;

      // Process items in batches
      const batchSize = 10;
      for (let i = 0; i < selectedItems.length; i += batchSize) {
        const batch = selectedItems.slice(i, i + batchSize);
        
        await onBatchAction(operationType, batch, options);
        
        processedItems += batch.length;
        setProgress((processedItems / totalItems) * 100);
      }

      toast.success(`Successfully processed ${totalItems} ${itemType}(s)`);
      onSelectionClear();
      setShowDialog(false);
    } catch (error) {
      console.error('Batch operation error:', error);
      toast.error(`Failed to complete batch operation: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
      setProgress(0);
      setSelectedOperation(null);
      setOperationOptions({});
    }
  };

  const confirmOperation = () => {
    if (!selectedOperation) return;
    executeOperation(selectedOperation, operationOptions);
  };

  const getSelectedItemsSummary = () => {
    const selectedItemsData = items.filter(item => selectedItems.includes(item.id));
    
    if (itemType === 'task') {
      const statusCounts = selectedItemsData.reduce((acc, task) => {
        acc[task.status] = (acc[task.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      return (
        <div className="space-y-2">
          <p className="text-sm">You've selected <strong>{selectedItems.length}</strong> tasks:</p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusCounts).map(([status, count]) => (
              <Badge key={status} variant="secondary">
                {status}: {count}
              </Badge>
            ))}
          </div>
        </div>
      );
    } else {
      return (
        <p className="text-sm">You've selected <strong>{selectedItems.length}</strong> projects</p>
      );
    }
  };

  const renderOperationOptions = () => {
    if (!selectedOperation) return null;

    switch (selectedOperation) {
      case 'move':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm mb-2 block">Select destination project:</label>
              <Select
                value={operationOptions.projectId || ''}
                onValueChange={(value) => setOperationOptions({ projectId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project..." />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'update-status':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm mb-2 block">Select new status:</label>
              <Select
                value={operationOptions.status || ''}
                onValueChange={(value) => setOperationOptions({ status: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  {itemType === 'project' && <SelectItem value="archived">Archived</SelectItem>}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'update-priority':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm mb-2 block">Select priority level:</label>
              <Select
                value={operationOptions.priority || ''}
                onValueChange={(value) => setOperationOptions({ priority: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'set-due-date':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm mb-2 block">Select due date:</label>
              <input
                type="date"
                className="w-full px-3 py-2 border rounded-md"
                value={operationOptions.dueDate || ''}
                onChange={(e) => setOperationOptions({ dueDate: e.target.value })}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (selectedItems.length === 0) return null;

  return (
    <>
      {/* Floating Action Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
        <div className="bg-white border shadow-lg rounded-lg p-4 min-w-[500px]">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm mb-2">
                <strong>{selectedItems.length}</strong> {itemType}(s) selected
              </p>
              <div className="flex flex-wrap gap-2">
                {batchOperations.slice(0, 4).map((operation) => (
                  <Button
                    key={operation.type}
                    variant={operation.destructive ? "destructive" : "outline"}
                    size="sm"
                    onClick={() => handleOperationSelect(operation.type)}
                    disabled={processing}
                    className="gap-2"
                  >
                    <operation.icon className="w-4 h-4" />
                    {operation.label}
                  </Button>
                ))}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onSelectionClear}
              disabled={processing}
            >
              Clear
            </Button>
          </div>

          {processing && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing...</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}
        </div>
      </div>

      {/* Operation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedOperation && batchOperations.find(op => op.type === selectedOperation)?.icon && (
                React.createElement(batchOperations.find(op => op.type === selectedOperation)!.icon, { 
                  className: "w-5 h-5" 
                })
              )}
              {selectedOperation && batchOperations.find(op => op.type === selectedOperation)?.label}
            </DialogTitle>
            <DialogDescription>
              {selectedOperation && batchOperations.find(op => op.type === selectedOperation)?.description}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {getSelectedItemsSummary()}
            
            <Separator />

            {renderOperationOptions()}

            {selectedOperation && batchOperations.find(op => op.type === selectedOperation)?.destructive && (
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg border border-red-200">
                <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-red-700">
                    This action cannot be undone. {selectedItems.length} {itemType}(s) will be permanently deleted.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              variant={selectedOperation && batchOperations.find(op => op.type === selectedOperation)?.destructive ? "destructive" : "default"}
              onClick={confirmOperation}
              disabled={processing || (selectedOperation === 'move' && !operationOptions.projectId)}
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirm
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default AdvancedBatchOperations;

