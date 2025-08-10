'use client';

import { useState, useEffect } from 'react';
import { Task, Category } from '@/contexts/task-context';
import { apiService } from '@/lib/api-service';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Loader2, Sparkles } from 'lucide-react';

interface EditTaskDialogProps {
    task: Task | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTaskUpdated: (updatedTask: Task) => void;
}

export function EditTaskDialog({ task, open, onOpenChange, onTaskUpdated }: EditTaskDialogProps) {
    const { toast } = useToast();
    const [isUpdating, setIsUpdating] = useState(false);
    const [isGettingSuggestions, setIsGettingSuggestions] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        category_id: '',
        deadline: '',
        priority: 'medium'
    });
    const [aiSuggestions, setAiSuggestions] = useState<Task['ai_suggestions'] | null>(null);
    const [categories, setCategories] = useState<Category[]>([]);

    // Load categories when dialog opens
    useEffect(() => {
        if (open) {
            const loadCategories = async () => {
                try {
                    const cats = await apiService.getCategories();
                    setCategories(cats);
                } catch (error) {
                    console.error('Failed to load categories:', error);
                }
            };
            loadCategories();
        }
    }, [open]);

    // Reset form when task changes
    useEffect(() => {
        if (task) {
            setFormData({
                title: task.title,
                description: task.description || '',
                category_id: task.category?.id || '',
                deadline: task.deadline ? new Date(task.deadline).toISOString().split('T')[0] : '',
                priority: task.priority
            });
            setAiSuggestions(task.ai_suggestions);
        }
    }, [task]);

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
                title: "AI Suggestions Updated! ✨",
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

    const applySuggestion = (field: 'category' | 'deadline' | 'description', value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        toast({
            title: "Suggestion Applied! ✨",
            description: `${field.charAt(0).toUpperCase() + field.slice(1)} updated with AI recommendation`
        });
    };

    const handleSubmit = async () => {
        if (!task || !formData.title.trim()) {
            toast({
                title: "Title Required",
                description: "Please enter a task title",
                variant: "destructive"
            });
            return;
        }

        setIsUpdating(true);
        try {
            const updatedTask = await apiService.updateTask(task.id, {
                title: formData.title.trim(),
                description: formData.description.trim(),
                category_id: formData.category_id,
                deadline: formData.deadline,
                priority: formData.priority as 'low' | 'medium' | 'high' | 'urgent',
                ai_suggestions: aiSuggestions
            });

            onTaskUpdated(updatedTask);
            onOpenChange(false);

            toast({
                title: "Task Updated Successfully! ✨",
                description: "Your task has been updated with the new information"
            });
        } catch (error) {
            console.error('Update task error:', error);
            toast({
                title: "Update Failed",
                description: "Failed to update task",
                variant: "destructive"
            });
        }
        setIsUpdating(false);
    };

    if (!task) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Task</DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Title */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Title *</label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Enter task title"
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Description</label>
                        <Textarea
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Enter task description"
                            rows={3}
                        />
                    </div>

                    {/* Category and Priority */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Category</label>
                            <Select value={formData.category_id} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">No Category</SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem key={category.id} value={category.id}>
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Priority</label>
                            <Select value={formData.priority} onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}>
                                <SelectTrigger>
                                    <SelectValue />
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

                    {/* Deadline */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Deadline</label>
                        <Input
                            type="date"
                            value={formData.deadline}
                            onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                        />
                    </div>

                    {/* AI Suggestions */}
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium">AI Suggestions</label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleGetSuggestions}
                                disabled={isGettingSuggestions}
                            >
                                {isGettingSuggestions ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Sparkles className="h-4 w-4" />
                                )}
                                {isGettingSuggestions ? 'Getting Suggestions...' : 'Get Suggestions'}
                            </Button>
                        </div>

                        {aiSuggestions && (
                            <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                                {aiSuggestions.category && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Suggested Category:</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => applySuggestion('category', aiSuggestions.category!)}
                                        >
                                            {aiSuggestions.category}
                                        </Button>
                                    </div>
                                )}
                                {aiSuggestions.deadline && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Suggested Deadline:</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => applySuggestion('deadline', aiSuggestions.deadline!)}
                                        >
                                            {aiSuggestions.deadline}
                                        </Button>
                                    </div>
                                )}
                                {aiSuggestions.description && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Suggested Description:</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => applySuggestion('description', aiSuggestions.description!)}
                                        >
                                            Apply
                                        </Button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleSubmit} disabled={isUpdating}>
                        {isUpdating ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Updating...
                            </>
                        ) : (
                            'Update Task'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
