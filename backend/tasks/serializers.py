from rest_framework import serializers
from .models import Task, Category, ContextEntry, TaskAnalytics


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model"""
    class Meta:
        model = Category
        fields = ['id', 'name', 'color', 'usage_frequency', 'created_at', 'updated_at']
        read_only_fields = ['id', 'usage_frequency', 'created_at', 'updated_at']


class ContextEntrySerializer(serializers.ModelSerializer):
    """Serializer for ContextEntry model"""
    class Meta:
        model = ContextEntry
        fields = [
            'id', 'content', 'source_type', 'processed_insights', 
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'processed_insights', 'created_at', 'updated_at']


class TaskSerializer(serializers.ModelSerializer):
    """Serializer for Task model"""
    category = CategorySerializer(read_only=True)
    category_id = serializers.CharField(write_only=True, required=False, allow_null=True, allow_blank=True)
    is_overdue = serializers.ReadOnlyField()
    days_until_deadline = serializers.ReadOnlyField()

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'category', 'category_id',
            'priority', 'priority_score', 'deadline', 'status',
            'ai_suggestions', 'tags', 'created_at', 'updated_at',
            'is_overdue', 'days_until_deadline'
        ]
        read_only_fields = [
            'id', 'priority_score', 'ai_suggestions', 
            'created_at', 'updated_at', 'is_overdue', 'days_until_deadline'
        ]

    def create(self, validated_data):
        category_id = validated_data.pop('category_id', None)
        if category_id:
            try:
                # First try to find by UUID
                category = Category.objects.get(id=category_id)
                validated_data['category'] = category
            except (Category.DoesNotExist, ValueError):
                # If not found by UUID, try to find by name
                try:
                    category = Category.objects.get(name=category_id)
                    validated_data['category'] = category
                except Category.DoesNotExist:
                    # If category doesn't exist, create it
                    category = Category.objects.create(name=category_id)
                    validated_data['category'] = category
        return super().create(validated_data)

    def update(self, instance, validated_data):
        category_id = validated_data.pop('category_id', None)
        if category_id:
            try:
                # First try to find by UUID
                category = Category.objects.get(id=category_id)
                validated_data['category'] = category
            except (Category.DoesNotExist, ValueError):
                # If not found by UUID, try to find by name
                try:
                    category = Category.objects.get(name=category_id)
                    validated_data['category'] = category
                except Category.DoesNotExist:
                    # If category doesn't exist, create it
                    category = Category.objects.create(name=category_id)
                    validated_data['category'] = category
        return super().update(instance, validated_data)


class TaskListSerializer(serializers.ModelSerializer):
    """Simplified serializer for task lists"""
    category_name = serializers.CharField(source='category.name', read_only=True)
    category_color = serializers.CharField(source='category.color', read_only=True)
    is_overdue = serializers.ReadOnlyField()

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'category_name', 'category_color',
            'priority', 'priority_score', 'deadline', 'status',
            'is_overdue', 'created_at'
        ]


class TaskAnalyticsSerializer(serializers.ModelSerializer):
    """Serializer for TaskAnalytics model"""
    class Meta:
        model = TaskAnalytics
        fields = [
            'id', 'productivity_score', 'burnout_risk', 'focus_areas',
            'recommendations', 'total_tasks', 'completed_tasks', 'urgent_tasks',
            'generated_at'
        ]
        read_only_fields = ['id', 'generated_at']


class TaskCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating tasks with AI suggestions"""
    category_id = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    get_ai_suggestions = serializers.BooleanField(write_only=True, default=False)
    deadline = serializers.DateField(required=False, allow_null=True)
    ai_suggestions = serializers.JSONField(required=False, allow_null=True)

    class Meta:
        model = Task
        fields = [
            'title', 'description', 'category_id', 'priority', 'priority_score',
            'deadline', 'status', 'tags', 'ai_suggestions', 'get_ai_suggestions'
        ]

    def create(self, validated_data):
        # Convert date to datetime if provided
        deadline = validated_data.get('deadline')
        if deadline:
            from datetime import datetime, date
            if isinstance(deadline, str):
                try:
                    from django.utils import timezone
                    validated_data['deadline'] = timezone.make_aware(
                        datetime.strptime(deadline, '%Y-%m-%d')
                    )
                except ValueError:
                    pass
            elif isinstance(deadline, date):
                # Convert date object to datetime object with timezone awareness
                from django.utils import timezone
                validated_data['deadline'] = timezone.make_aware(
                    datetime.combine(deadline, datetime.min.time())
                )
        
        # Handle category_id - can be UUID or category name string
        category_id = validated_data.pop('category_id', None)
        if category_id:
            # Check if it looks like a UUID first
            import uuid
            try:
                uuid.UUID(category_id)
                # It's a UUID, try to find by ID
                try:
                    category = Category.objects.get(id=category_id)
                    validated_data['category'] = category
                except Category.DoesNotExist:
                    pass
            except ValueError:
                # Not a UUID, treat as name
                pass
            
            # If we haven't found a category yet, try by name
            if 'category' not in validated_data:
                try:
                    category = Category.objects.get(name=category_id)
                    validated_data['category'] = category
                except Category.DoesNotExist:
                    # If category doesn't exist, create it
                    category = Category.objects.create(name=category_id)
                    validated_data['category'] = category
        
        # Ensure ai_suggestions has a default value
        if 'ai_suggestions' not in validated_data or validated_data['ai_suggestions'] is None:
            validated_data['ai_suggestions'] = {}
        
        # Ensure tags has a default value
        if 'tags' not in validated_data or validated_data['tags'] is None:
            validated_data['tags'] = []
        
        return super().create(validated_data)


class ContextCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating context entries with AI processing"""
    class Meta:
        model = ContextEntry
        fields = ['content', 'source_type']


class AISuggestionsSerializer(serializers.Serializer):
    """Serializer for AI suggestions response"""
    suggested_deadline = serializers.DateTimeField(required=False)
    suggested_category = serializers.CharField(required=False)
    enhanced_description = serializers.CharField(required=False)
    reasoning = serializers.CharField(required=False)
    priority_score = serializers.FloatField(required=False)
    suggested_priority = serializers.CharField(required=False)
    extracted_tasks = serializers.ListField(child=serializers.CharField(), required=False)


class TaskStatsSerializer(serializers.Serializer):
    """Serializer for task statistics"""
    total_tasks = serializers.IntegerField()
    completed_tasks = serializers.IntegerField()
    in_progress_tasks = serializers.IntegerField()
    overdue_tasks = serializers.IntegerField()
    urgent_tasks = serializers.IntegerField()
    productivity_score = serializers.FloatField()
    burnout_risk = serializers.FloatField()
