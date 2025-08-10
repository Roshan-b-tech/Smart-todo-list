from django.db import models
from django.utils import timezone
import uuid


class Category(models.Model):
    """Model for task categories with usage tracking"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, unique=True)
    color = models.CharField(max_length=7, default='#3b82f6')  # Hex color code
    usage_frequency = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Categories"
        ordering = ['-usage_frequency', 'name']

    def __str__(self):
        return self.name


class ContextEntry(models.Model):
    """Model for daily context entries (messages, emails, notes)"""
    SOURCE_TYPES = [
        ('email', 'Email'),
        ('message', 'Message'),
        ('note', 'Note'),
        ('other', 'Other'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    content = models.TextField()
    source_type = models.CharField(max_length=20, choices=SOURCE_TYPES, default='note')
    
    # AI-processed insights stored as JSON
    processed_insights = models.JSONField(default=dict, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name_plural = "Context Entries"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.source_type}: {self.content[:50]}..."


class Task(models.Model):
    """Model for tasks with AI-powered features"""
    PRIORITY_CHOICES = [
        ('urgent', 'Urgent'),
        ('high', 'High'),
        ('medium', 'Medium'),
        ('low', 'Low'),
    ]

    STATUS_CHOICES = [
        ('todo', 'To Do'),
        ('in-progress', 'In Progress'),
        ('completed', 'Completed'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    
    # Task categorization and priority
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    priority_score = models.FloatField(default=0.5)  # AI-calculated priority score (0-1)
    
    # Timing
    deadline = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Status tracking
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='todo')
    
    # AI suggestions stored as JSON
    ai_suggestions = models.JSONField(default=dict, blank=True)
    
    # Tags for additional categorization
    tags = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ['-priority_score', 'deadline', '-created_at']

    def __str__(self):
        return self.title

    def save(self, *args, **kwargs):
        # Update category usage frequency when task is saved
        if self.category:
            self.category.usage_frequency += 1
            self.category.save()
        super().save(*args, **kwargs)

    @property
    def is_overdue(self):
        """Check if task is overdue"""
        if self.deadline and self.status != 'completed':
            return timezone.now() > self.deadline
        return False

    @property
    def days_until_deadline(self):
        """Calculate days until deadline"""
        if self.deadline:
            delta = self.deadline - timezone.now()
            return delta.days
        return None


class TaskAnalytics(models.Model):
    """Model for storing task analytics and insights"""
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # Analytics data
    productivity_score = models.FloatField(default=0.0)
    burnout_risk = models.FloatField(default=0.0)
    focus_areas = models.JSONField(default=list, blank=True)
    recommendations = models.JSONField(default=list, blank=True)
    
    # Context for analytics
    total_tasks = models.IntegerField(default=0)
    completed_tasks = models.IntegerField(default=0)
    urgent_tasks = models.IntegerField(default=0)
    
    # Timestamp
    generated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = "Task Analytics"
        ordering = ['-generated_at']

    def __str__(self):
        return f"Analytics - {self.generated_at.strftime('%Y-%m-%d %H:%M')}"
