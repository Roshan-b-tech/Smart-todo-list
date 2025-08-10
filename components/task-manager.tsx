'use client';

import { useState } from 'react';
import { useTaskContext, Task } from '@/contexts/task-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Settings,
  Download,
  Upload,
  CheckSquare,
  Clock,
  AlertTriangle,
  Loader2,
  Sparkles,
  Calendar,
  Tag
} from 'lucide-react';
import { TaskCard } from '@/components/task-card';
import { apiService } from '@/lib/api-service';
import { useToast } from '@/hooks/use-toast';

export function TaskManager() {
  const { state, dispatch } = useTaskContext();
  const { toast } = useToast();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isGettingSuggestions, setIsGettingSuggestions] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    deadline: ''
  });
  const [aiSuggestions, setAiSuggestions] = useState<Task['ai_suggestions'] | null>(null);

  const getTasksByStatus = (status: Task['status']) => {
    return state.tasks.filter(task => task.status === status)
      .sort((a, b) => b.priority_score - a.priority_score);
  };

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

      toast({
        title: "AI Suggestions Generated! ✨",
        description: "Smart recommendations are now available"
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

  const handleCreateTask = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Title Required",
        description: "Please enter a task title",
        variant: "destructive"
      });
      return;
    }

    setIsCreating(true);
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
      setShowCreateForm(false);

      toast({
        title: "Task Created Successfully! 🎉",
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
    setIsCreating(false);
  };

  const handleExportTasks = () => {
    const dataStr = JSON.stringify(state.tasks, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smart-todo-tasks-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Tasks Exported",
      description: "Your tasks have been exported to JSON file"
    });
  };

  const handleImportTasks = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const tasks = JSON.parse(e.target?.result as string);
        tasks.forEach((task: Task) => {
          dispatch({ type: 'ADD_TASK', payload: { ...task, id: crypto.randomUUID() } });
        });

        toast({
          title: "Tasks Imported",
          description: `Successfully imported ${tasks.length} tasks`
        });
      } catch (error) {
        toast({
          title: "Import Error",
          description: "Failed to import tasks. Please check the file format.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const applySuggestion = (field: 'category' | 'deadline' | 'description', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    toast({
      title: "Suggestion Applied",
      description: `AI suggestion has been applied to ${field}`
    });
  };

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Task Manager</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Create, edit, and manage your tasks with AI assistance
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleExportTasks}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <label>
            <input
              type="file"
              accept=".json"
              onChange={handleImportTasks}
              className="hidden"
            />
            <Button variant="outline" asChild>
              <span>
                <Upload className="h-4 w-4 mr-2" />
                Import
              </span>
            </Button>
          </label>
          <Button onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        </div>
      </div>

      {/* Create Task Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Create New Task
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Task Title *</label>
                <Input
                  placeholder="What needs to be done?"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Add more details about the task..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
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
                    <span className="text-sm">Recommended Category:</span>
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => applySuggestion('category', aiSuggestions.suggestedCategory!)}
                    >
                      {aiSuggestions.suggestedCategory}
                    </Badge>
                  </div>
                )}

                {aiSuggestions.suggestedDeadline && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Suggested Deadline:</span>
                    <Badge
                      variant="outline"
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground"
                      onClick={() => applySuggestion('deadline', aiSuggestions.suggestedDeadline!)}
                    >
                      {new Date(aiSuggestions.suggestedDeadline).toLocaleDateString()}
                    </Badge>
                  </div>
                )}

                {aiSuggestions.enhancedDescription && (
                  <div>
                    <span className="text-sm">Enhanced Description:</span>
                    <p
                      className="text-sm text-muted-foreground mt-1 cursor-pointer p-2 bg-background rounded border"
                      onClick={() => applySuggestion('description', aiSuggestions.enhancedDescription!)}
                    >
                      {aiSuggestions.enhancedDescription}
                    </p>
                  </div>
                )}

                {aiSuggestions.reasoning && (
                  <p className="text-xs text-muted-foreground">
                    💡 {aiSuggestions.reasoning}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowCreateForm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateTask}
                disabled={isCreating || !formData.title.trim()}
                className="flex-1"
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Create Task
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Tabs */}
      <Tabs defaultValue="todo" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="todo" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <CheckSquare className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">To Do</span>
            <span className="sm:hidden">Todo</span>
            ({getTasksByStatus('todo').length})
          </TabsTrigger>
          <TabsTrigger value="in-progress" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <Clock className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">In Progress</span>
            <span className="sm:hidden">Progress</span>
            ({getTasksByStatus('in-progress').length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm">
            <AlertTriangle className="h-3 w-3 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Completed</span>
            <span className="sm:hidden">Done</span>
            ({getTasksByStatus('completed').length})
          </TabsTrigger>
        </TabsList>

        {(['todo', 'in-progress', 'completed'] as const).map(status => (
          <TabsContent key={status} value={status} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="capitalize">{status.replace('-', ' ')} Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                {getTasksByStatus(status).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-lg mb-2">No {status.replace('-', ' ')} tasks</p>
                    <p className="text-sm">
                      {status === 'todo' && "Create your first task to get started!"}
                      {status === 'in-progress' && "Start working on a task to see it here."}
                      {status === 'completed' && "Complete tasks to see them here."}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {getTasksByStatus(status).map(task => (
                      <TaskCard key={task.id} task={task} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}