'use client';

import { useState } from 'react';
import { useTaskContext, Task } from '@/contexts/task-context';
import { apiService } from '@/lib/api-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Sparkles, Calendar, Tag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuickAddTaskProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QuickAddTask({ open, onOpenChange }: QuickAddTaskProps) {
  const { state, dispatch } = useTaskContext();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingSuggestions, setIsGettingSuggestions] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    deadline: ''
  });
  const [aiSuggestions, setAiSuggestions] = useState<Task['ai_suggestions'] | null>(null);

  const handleGetSuggestions = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a task title to get AI suggestions",
        variant: "destructive"
      });
      return;
    }

    setIsGettingSuggestions(true);
    try {
      const suggestions = await apiService.getAISuggestions(
        formData.title,
        formData.description
      );
      setAiSuggestions(suggestions);

      // Auto-apply suggestions if fields are empty
      if (!formData.category && suggestions.suggested_category) {
        setFormData(prev => ({ ...prev, category: suggestions.suggested_category! }));
      }
      if (!formData.deadline && suggestions.suggested_deadline) {
        setFormData(prev => ({ ...prev, deadline: suggestions.suggested_deadline! }));
      }

      toast({
        title: "AI Suggestions Ready! ✨",
        description: "Smart recommendations have been generated for your task"
      });
    } catch (error) {
      console.error('AI suggestions error:', error);
      toast({
        title: "Error",
        description: "Failed to get AI suggestions",
        variant: "destructive"
      });
    }
    setIsGettingSuggestions(false);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a task title",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Prepare task data for AI priority calculation
      const taskDataForPriority = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category_id: formData.category || 'Personal',
        deadline: formData.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      };

      // Get AI-based priority calculation
      const priorityResult = await apiService.calculatePriority(taskDataForPriority);

      // Prepare task data for API with AI-calculated priority
      const taskData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        category_id: formData.category || 'Personal',
        priority: priorityResult.priority as 'urgent' | 'high' | 'medium' | 'low',
        priority_score: priorityResult.priority_score,
        deadline: formData.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'todo' as const,
        ai_suggestions: aiSuggestions
      };

      // Create task via API
      const createdTask = await apiService.createTask(taskData);

      // Update local state with the created task
      dispatch({ type: 'ADD_TASK', payload: createdTask });

      // Reset form
      setFormData({ title: '', description: '', category: '', deadline: '' });
      setAiSuggestions(null);
      onOpenChange(false);

      toast({
        title: "Task Created! 🎉",
        description: `Your new task has been added with AI priority: ${priorityResult.priority}`
      });
    } catch (error) {
      console.error('Task creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive"
      });
    }
    setIsLoading(false);
  };

  const applySuggestion = (field: 'category' | 'deadline' | 'description', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    toast({
      title: "Suggestion Applied",
      description: `AI suggestion has been applied to ${field}`
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Quick Add Task
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Task Title *</label>
            <Input
              placeholder="What needs to be done?"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea
              placeholder="Add more details..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Tag className="h-3 w-3" />
                Category
              </label>
              <Select value={formData.category} onValueChange={(value) =>
                setFormData(prev => ({ ...prev, category: value }))
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {state.categories.map(category => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Deadline
              </label>
              <Input
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
              />
            </div>
          </div>

          <Button
            onClick={handleGetSuggestions}
            disabled={isGettingSuggestions || !formData.title.trim()}
            variant="outline"
            className="w-full"
          >
            {isGettingSuggestions ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-2" />
            )}
            Get AI Suggestions
          </Button>

          {aiSuggestions && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                AI Suggestions
              </h4>

              {aiSuggestions.suggestedCategory && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Category:</span>
                  <Badge
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => applySuggestion('category', aiSuggestions.suggestedCategory!)}
                  >
                    {aiSuggestions.suggestedCategory}
                  </Badge>
                </div>
              )}

              {aiSuggestions.suggestedDeadline && (
                <div className="flex items-center justify-between">
                  <span className="text-sm">Deadline:</span>
                  <Badge
                    variant="outline"
                    className="cursor-pointer"
                    onClick={() => applySuggestion('deadline', aiSuggestions.suggestedDeadline!)}
                  >
                    {new Date(aiSuggestions.suggestedDeadline).toLocaleDateString()}
                  </Badge>
                </div>
              )}

              {aiSuggestions.reasoning && (
                <p className="text-xs text-muted-foreground">
                  {aiSuggestions.reasoning}
                </p>
              )}
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !formData.title.trim()}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Create Task
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}