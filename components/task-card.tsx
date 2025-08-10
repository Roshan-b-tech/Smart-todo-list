'use client';

import { useState } from 'react';
import { Task, useTaskContext } from '@/contexts/task-context';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Calendar,
  Tag,
  MoreHorizontal,
  Edit,
  Trash2,
  CheckCircle2,
  Circle,
  Play
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { EditTaskDialog } from '@/components/edit-task-dialog';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const { dispatch } = useTaskContext();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-blue-500 text-white';
      case 'low': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusIcon = () => {
    switch (task.status) {
      case 'completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'in-progress':
        return <Play className="h-5 w-5 text-blue-600" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const handleStatusChange = async () => {
    setIsUpdating(true);

    let newStatus: Task['status'];
    switch (task.status) {
      case 'todo':
        newStatus = 'in-progress';
        break;
      case 'in-progress':
        newStatus = 'completed';
        break;
      case 'completed':
        newStatus = 'todo';
        break;
      default:
        newStatus = 'in-progress';
    }

    const updatedTask = {
      ...task,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    try {
      await dispatch({ type: 'UPDATE_TASK', payload: updatedTask });

      toast({
        title: "Task Updated",
        description: `Task marked as ${newStatus.replace('-', ' ')}`,
      });
    } catch (error) {
      toast({
        title: "Update Failed",
        description: "Failed to update task status",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    try {
      await dispatch({ type: 'DELETE_TASK', payload: task.id });
      toast({
        title: "Task Deleted",
        description: "Task has been removed from your list",
        variant: "destructive",
      });
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: "Failed to delete task",
        variant: "destructive",
      });
    }
  };

  const handleEdit = () => {
    setShowEditDialog(true);
  };

  const handleTaskUpdated = (updatedTask: Task) => {
    dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
  };

  const isOverdue = task.deadline ? new Date(task.deadline) < new Date() && task.status !== 'completed' : false;
  const daysUntilDeadline = task.deadline ? Math.ceil((new Date(task.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 0;

  return (
    <>
      <Card className={cn(
        "transition-all duration-200 hover:shadow-md",
        task.status === 'completed' && "opacity-75",
        isOverdue && task.status !== 'completed' && "border-red-200 bg-red-50 dark:bg-red-950/20"
      )}>
        <CardContent className="p-3 md:p-4">
          <div className="flex items-start justify-between gap-3 md:gap-4">
            <div className="flex items-start gap-2 md:gap-3 flex-1">
              <Button
                variant="ghost"
                size="sm"
                className="p-0 h-auto"
                onClick={handleStatusChange}
                disabled={isUpdating}
              >
                {getStatusIcon()}
              </Button>

              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className={cn(
                    "font-semibold text-sm flex-1 min-w-0",
                    task.status === 'completed' && "line-through text-muted-foreground"
                  )}>
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                    <Badge className={cn("text-xs", getPriorityColor(task.priority))}>
                      {task.priority}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={handleEdit}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={handleDelete}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {task.description && (
                  <p className={cn(
                    "text-sm text-muted-foreground line-clamp-2",
                    task.status === 'completed' && "line-through"
                  )}>
                    {task.description}
                  </p>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />
                    <span className="truncate">{task.category?.name || 'Uncategorized'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span className={cn(
                      "truncate",
                      isOverdue && task.status !== 'completed' && "text-red-600 font-medium"
                    )}>
                      {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'No deadline'}
                      {task.deadline && daysUntilDeadline === 0 && task.status !== 'completed' && " (Today)"}
                      {task.deadline && daysUntilDeadline === 1 && task.status !== 'completed' && " (Tomorrow)"}
                      {isOverdue && task.status !== 'completed' && " (Overdue)"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <EditTaskDialog
        task={task}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onTaskUpdated={handleTaskUpdated}
      />
    </>
  );
}