from django.contrib import admin
from .models import Task, Category, ContextEntry, TaskAnalytics


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'color', 'usage_frequency', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name']
    ordering = ['-usage_frequency', 'name']


@admin.register(ContextEntry)
class ContextEntryAdmin(admin.ModelAdmin):
    list_display = ['source_type', 'content_preview', 'created_at']
    list_filter = ['source_type', 'created_at']
    search_fields = ['content']
    ordering = ['-created_at']
    readonly_fields = ['processed_insights']

    def content_preview(self, obj):
        return obj.content[:100] + '...' if len(obj.content) > 100 else obj.content
    content_preview.short_description = 'Content Preview'


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'priority', 'status', 'deadline', 'is_overdue', 'created_at']
    list_filter = ['status', 'priority', 'category', 'created_at']
    search_fields = ['title', 'description']
    ordering = ['-priority_score', 'deadline']
    readonly_fields = ['priority_score', 'ai_suggestions', 'is_overdue', 'days_until_deadline']
    
    fieldsets = (
        ('Basic Information', {
            'fields': ('title', 'description', 'category', 'tags')
        }),
        ('Priority & Status', {
            'fields': ('priority', 'priority_score', 'status')
        }),
        ('Timing', {
            'fields': ('deadline', 'is_overdue', 'days_until_deadline')
        }),
        ('AI Features', {
            'fields': ('ai_suggestions',),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(TaskAnalytics)
class TaskAnalyticsAdmin(admin.ModelAdmin):
    list_display = ['productivity_score', 'burnout_risk', 'total_tasks', 'completed_tasks', 'generated_at']
    list_filter = ['generated_at']
    ordering = ['-generated_at']
    readonly_fields = ['focus_areas', 'recommendations']
    
    fieldsets = (
        ('Scores', {
            'fields': ('productivity_score', 'burnout_risk')
        }),
        ('Task Counts', {
            'fields': ('total_tasks', 'completed_tasks', 'urgent_tasks')
        }),
        ('AI Insights', {
            'fields': ('focus_areas', 'recommendations'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('generated_at',),
            'classes': ('collapse',)
        }),
    )
