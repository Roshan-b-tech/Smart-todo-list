'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTaskContext } from '@/contexts/task-context';
import { apiService } from '@/lib/api-service';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  Target,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  Lightbulb,
  BarChart3
} from 'lucide-react';
import Image from 'next/image';

interface AnalyticsData {
  productivity: number;
  burnout: number;
  focus: string[];
  recommendations: string[];
}

export function Analytics() {
  const { state } = useTaskContext();
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateAnalytics = async () => {
      setIsLoading(true);
      try {
        const data = await apiService.generateInsights();
        setAnalyticsData(data);
      } catch (error) {
        console.error('Failed to generate analytics:', error);
      }
      setIsLoading(false);
    };

    generateAnalytics();
  }, [state.tasks, state.contexts]);

  const taskStats = useMemo(() => {
    const total = state.tasks.length;
    const completed = state.tasks.filter(t => t.status === 'completed').length;
    const inProgress = state.tasks.filter(t => t.status === 'in-progress').length;
    const overdue = state.tasks.filter(t => {
      if (!t.deadline) return false;
      const deadline = new Date(t.deadline);
      const now = new Date();
      return deadline < now && t.status !== 'completed';
    }).length;

    const priorityBreakdown = {
      urgent: state.tasks.filter(t => t.priority === 'urgent').length,
      high: state.tasks.filter(t => t.priority === 'high').length,
      medium: state.tasks.filter(t => t.priority === 'medium').length,
      low: state.tasks.filter(t => t.priority === 'low').length,
    };

    return { total, completed, inProgress, overdue, priorityBreakdown };
  }, [state.tasks]);

  const categoryStats = useMemo(() => {
    const categoryCount: { [key: string]: number } = {};
    state.tasks.forEach(task => {
      const categoryName = task.category?.name || 'Uncategorized';
      categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1;
    });

    return Object.entries(categoryCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [state.tasks]);

  const getProductivityColor = (productivity: number) => {
    if (productivity >= 80) return 'text-green-600';
    if (productivity >= 60) return 'text-blue-600';
    if (productivity >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getBurnoutColor = (burnout: number) => {
    if (burnout >= 70) return 'text-red-600';
    if (burnout >= 40) return 'text-orange-600';
    return 'text-green-600';
  };

  if (isLoading) {
    return (
      <div className="flex-1 overflow-auto p-6 space-y-6">
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <Image
              src="/logo_gecekoc2qz8-18978.png.webp"
              alt="Smart Todo Logo"
              width={48}
              height={48}
              className="mx-auto mb-4 animate-pulse"
            />
            <p className="text-lg font-medium">Generating AI Insights...</p>
            <p className="text-sm text-muted-foreground">Analyzing your task patterns and productivity</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Analytics & Insights</h1>
          <p className="text-muted-foreground text-sm md:text-base">
            AI-powered analysis of your productivity and task patterns
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Productivity Score</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getProductivityColor(analyticsData?.productivity || 0)}`}>
              {Math.round(analyticsData?.productivity || 0)}%
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${analyticsData?.productivity || 0}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Based on completion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Burnout Risk</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getBurnoutColor(analyticsData?.burnout || 0)}`}>
              {Math.round(analyticsData?.burnout || 0)}%
            </div>
            <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-red-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${analyticsData?.burnout || 0}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Based on urgent tasks ratio
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{taskStats.inProgress}</div>
            <p className="text-xs text-muted-foreground">
              Currently in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{taskStats.overdue}</div>
            <p className="text-xs text-muted-foreground">
              Need immediate attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Priority Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Priority Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(taskStats.priorityBreakdown).map(([priority, count]) => (
              <div key={priority} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${priority === 'urgent' ? 'bg-red-500' :
                    priority === 'high' ? 'bg-orange-500' :
                      priority === 'medium' ? 'bg-blue-500' : 'bg-gray-500'
                    }`} />
                  <span className="text-sm capitalize">{priority}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{count}</span>
                  <div className="w-16 md:w-20 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${taskStats.total > 0 ? (count / taskStats.total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Top Categories
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {categoryStats.length > 0 ? (
              categoryStats.map(([category, count]) => (
                <div key={category} className="flex items-center justify-between">
                  <span className="text-sm">{category}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{count}</span>
                    <div className="w-16 md:w-20 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${taskStats.total > 0 ? (count / taskStats.total) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No categories to display
              </p>
            )}
          </CardContent>
        </Card>

        {/* Focus Areas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image
                src="/logo_gecekoc2qz8-18978.png.webp"
                alt="Smart Todo Logo"
                width={20}
                height={20}
              />
              AI Focus Areas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsData?.focus && analyticsData.focus.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Based on your task patterns, you're focusing on:
                </p>
                <div className="flex flex-wrap gap-2">
                  {analyticsData.focus.map((area, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Add more tasks to see focus area analysis
              </p>
            )}
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analyticsData?.recommendations && analyticsData.recommendations.length > 0 ? (
              analyticsData.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
                  <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{recommendation}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Complete more tasks to get AI recommendations
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Context Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image
              src="/logo_gecekoc2qz8-18978.png.webp"
              alt="Smart Todo Logo"
              width={20}
              height={20}
            />
            Context Intelligence Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{state.contexts.length}</div>
              <p className="text-sm text-muted-foreground">Context Entries</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {state.contexts.reduce((sum, ctx) => sum + (ctx.processed_insights?.keywords?.length || 0), 0)}
              </div>
              <p className="text-sm text-muted-foreground">Keywords Extracted</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {state.contexts.reduce((sum, ctx) => sum + (ctx.processed_insights?.extracted_tasks?.length || 0), 0)}
              </div>
              <p className="text-sm text-muted-foreground">Tasks Suggested</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}