'use client';

import { useState, useMemo } from 'react';
import { useTaskContext } from '@/contexts/task-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CheckSquare,
  Clock,
  AlertTriangle,
  TrendingUp,
  Plus,
  Filter,
  Search,
  Calendar
} from 'lucide-react';
import { TaskCard } from '@/components/task-card';
import { QuickAddTask } from '@/components/quick-add-task';

export function Dashboard() {
  const { state } = useTaskContext();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showQuickAdd, setShowQuickAdd] = useState(false);



  // Calculate stats
  const stats = useMemo(() => {
    const tasks = Array.isArray(state.tasks) ? state.tasks : [];
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'completed').length;
    const inProgress = tasks.filter(t => t.status === 'in-progress').length;
    const overdue = tasks.filter(t => t.is_overdue).length;

    return { total, completed, inProgress, overdue };
  }, [state.tasks]);

  // Filter tasks
  const filteredTasks = useMemo(() => {
    const tasks = Array.isArray(state.tasks) ? state.tasks : [];
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || task.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
      const matchesCategory = categoryFilter === 'all' ||
        (task.category && task.category.name === categoryFilter);

      return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
    }).sort((a, b) => {
      // Sort by priority score (highest first), then by deadline
      if (a.priority_score !== b.priority_score) {
        return b.priority_score - a.priority_score;
      }
      if (a.deadline && b.deadline) {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      return 0;
    });
  }, [state.tasks, searchQuery, statusFilter, priorityFilter, categoryFilter]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  // Show loading state
  if (state.loading) {
    return (
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading tasks...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (state.error) {
    return (
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Error Loading Data</h3>
            <p className="text-muted-foreground mb-4">{state.error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Welcome back! Here's what you need to focus on today.
          </p>
        </div>
        <Button onClick={() => setShowQuickAdd(true)} className="gap-2 w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Quick Add Task
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              Active tasks in your system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}% completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              Currently active tasks
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">
              Need immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full lg:w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {Array.isArray(state.categories) ? state.categories.map(category => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                )) : null}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Your Tasks ({filteredTasks.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-96 overflow-y-auto">
          <div className="space-y-4">
            {filteredTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {state.tasks.length === 0 ? (
                  <div>
                    <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-lg mb-2">No tasks yet!</p>
                    <p className="text-sm">Create your first task to get started with Smart Todo.</p>
                  </div>
                ) : (
                  <div>
                    <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-lg mb-2">No tasks match your filters</p>
                    <p className="text-sm">Try adjusting your search or filter criteria.</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTasks.map(task => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Add Task Modal */}
      <QuickAddTask
        open={showQuickAdd}
        onOpenChange={setShowQuickAdd}
      />
    </div>
  );
}