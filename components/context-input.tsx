'use client';

import { useState } from 'react';
import { useTaskContext, Context } from '@/contexts/task-context';
import { apiService, ContextEntry } from '@/lib/api-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  MessageSquare,
  Mail,
  FileText,
  Settings,
  Loader2,
  Sparkles,
  TrendingUp,
  AlertCircle,
  Lightbulb
} from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';

export function ContextInput() {
  const { state, dispatch } = useTaskContext();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    content: '',
    sourceType: 'note' as ContextEntry['source_type']
  });

  const handleSubmit = async () => {
    if (!formData.content.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter some context content",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Create context using API
      const newContext = await apiService.createContext({
        content: formData.content.trim(),
        source_type: formData.sourceType
      });

      dispatch({ type: 'ADD_CONTEXT', payload: newContext });

      // Reset form
      setFormData({ content: '', sourceType: 'note' });

      toast({
        title: "Context Added Successfully! 🧠",
        description: `AI has processed your ${formData.sourceType} and extracted insights`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process context",
        variant: "destructive"
      });
    }
    setIsProcessing(false);
  };

  const getSourceIcon = (sourceType: ContextEntry['source_type']) => {
    switch (sourceType) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'message': return <MessageSquare className="h-4 w-4" />;
      case 'note': return <FileText className="h-4 w-4" />;
      default: return <Settings className="h-4 w-4" />;
    }
  };

  const getSentimentColor = (sentiment: Context['processed_insights']['sentiment']) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-500 text-white';
      case 'negative': return 'bg-red-500 text-white';
      case 'neutral': return 'bg-gray-500 text-white';
    }
  };

  const getUrgencyLevel = (urgency: number) => {
    if (urgency >= 0.7) return { label: 'High', color: 'bg-red-500 text-white' };
    if (urgency >= 0.4) return { label: 'Medium', color: 'bg-orange-500 text-white' };
    return { label: 'Low', color: 'bg-green-500 text-white' };
  };

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Context Intelligence</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            Add daily context to enhance AI-powered task suggestions
          </p>
        </div>
      </div>

      {/* Add Context Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image
              src="/logo_gecekoc2qz8-18978.png.webp"
              alt="Smart Todo Logo"
              width={20}
              height={20}
            />
            Add New Context
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Source Type</label>
            <Select
              value={formData.sourceType}
              onValueChange={(value: ContextEntry['source_type']) =>
                setFormData(prev => ({ ...prev, sourceType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">📧 Email</SelectItem>
                <SelectItem value="message">💬 Message</SelectItem>
                <SelectItem value="note">📝 Note</SelectItem>
                <SelectItem value="other">⚙️ Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Context Content *</label>
            <Textarea
              placeholder="Paste your emails, messages, meeting notes, or any text that might contain task-relevant information..."
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              rows={6}
              className="resize-none"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={isProcessing || !formData.content.trim()}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing with AI...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add Context
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Context History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Context History ({state.contexts.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {state.contexts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Image
                src="/logo_gecekoc2qz8-18978.png.webp"
                alt="Smart Todo Logo"
                width={48}
                height={48}
                className="mx-auto mb-4 opacity-20"
              />
              <p className="text-lg mb-2">No context data yet</p>
              <p className="text-sm">Add your first context entry to start building intelligent task suggestions.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {state.contexts
                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                .map(context => (
                  <div key={context.id} className="p-4 border border-border rounded-lg space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {getSourceIcon(context.source_type)}
                        <span className="text-sm font-medium capitalize">{context.source_type}</span>
                        <Badge variant="outline">
                          {new Date(context.created_at).toLocaleDateString()}
                        </Badge>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getSentimentColor(context.processed_insights.sentiment)}>
                          {context.processed_insights.sentiment}
                        </Badge>
                        <Badge className={getUrgencyLevel(context.processed_insights.urgency).color}>
                          {getUrgencyLevel(context.processed_insights.urgency).label} Urgency
                        </Badge>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {context.content}
                    </p>

                    <div className="space-y-2">
                      {context.processed_insights.keywords.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground">Keywords:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {context.processed_insights.keywords.map((keyword, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {context.processed_insights.extracted_tasks && context.processed_insights.extracted_tasks.length > 0 && (
                        <div>
                          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <Lightbulb className="h-3 w-3" />
                            Potential Tasks:
                          </span>
                          <div className="mt-1 space-y-1">
                            {context.processed_insights.extracted_tasks.map((task, index) => (
                              <div key={index} className="text-xs bg-muted/50 p-2 rounded flex items-start gap-2">
                                <AlertCircle className="h-3 w-3 mt-0.5 text-orange-500 flex-shrink-0" />
                                {task}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}