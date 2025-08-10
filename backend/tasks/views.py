from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count
from django.utils import timezone
from datetime import timedelta

from .models import Task, Category, ContextEntry, TaskAnalytics
from .serializers import (
    TaskSerializer, TaskListSerializer, CategorySerializer, ContextEntrySerializer,
    TaskAnalyticsSerializer, TaskCreateSerializer, ContextCreateSerializer,
    AISuggestionsSerializer, TaskStatsSerializer
)
from ai_service.services import AIService


class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for managing task categories"""
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'usage_frequency', 'created_at']
    ordering = ['-usage_frequency', 'name']

    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get most frequently used categories"""
        categories = self.queryset.order_by('-usage_frequency')[:5]
        serializer = self.get_serializer(categories, many=True)
        return Response(serializer.data)


class ContextEntryViewSet(viewsets.ModelViewSet):
    """ViewSet for managing context entries"""
    queryset = ContextEntry.objects.all()
    serializer_class = ContextEntrySerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['source_type']
    search_fields = ['content']
    ordering_fields = ['created_at', 'source_type']
    ordering = ['-created_at']

    def create(self, request, *args, **kwargs):
        """Create context entry with AI processing"""
        serializer = ContextCreateSerializer(data=request.data)
        if serializer.is_valid():
            # Process with AI
            ai_service = AIService()
            content = serializer.validated_data['content']
            source_type = serializer.validated_data['source_type']
            
            try:
                insights = ai_service.process_context(content, source_type)
                
                # Create context entry with AI insights
                context_entry = ContextEntry.objects.create(
                    content=content,
                    source_type=source_type,
                    processed_insights=insights
                )
                
                response_serializer = ContextEntrySerializer(context_entry)
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                return Response(
                    {'error': f'AI processing failed: {str(e)}'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def recent(self, request):
        """Get recent context entries"""
        days = int(request.query_params.get('days', 7))
        cutoff_date = timezone.now() - timedelta(days=days)
        recent_contexts = self.queryset.filter(created_at__gte=cutoff_date)
        serializer = self.get_serializer(recent_contexts, many=True)
        return Response(serializer.data)


class TaskViewSet(viewsets.ModelViewSet):
    """ViewSet for managing tasks"""
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'priority', 'category']
    search_fields = ['title', 'description']
    ordering_fields = ['priority_score', 'deadline', 'created_at', 'updated_at']
    ordering = ['-priority_score', 'deadline']

    def get_serializer_class(self):
        """Use different serializers for different actions"""
        if self.action == 'list':
            return TaskListSerializer
        elif self.action == 'create':
            return TaskCreateSerializer
        return TaskSerializer

    def create(self, request, *args, **kwargs):
        """Create task with optional AI suggestions"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            get_ai_suggestions = serializer.validated_data.pop('get_ai_suggestions', False)
            
            # Create task
            task = serializer.save()
            
            # Get AI suggestions if requested
            if get_ai_suggestions:
                try:
                    ai_service = AIService()
                    contexts = ContextEntry.objects.all()[:10]  # Recent contexts
                    
                    suggestions = ai_service.get_task_suggestions(
                        task.title,
                        task.description,
                        contexts
                    )
                    
                    # Update task with AI suggestions
                    task.ai_suggestions = suggestions
                    task.save()
                    
                except Exception as e:
                    # Continue even if AI suggestions fail
                    pass
            
            response_serializer = TaskSerializer(task)
            return Response(response_serializer.data, status=status.HTTP_201_CREATED)
        
        # Log validation errors for debugging
        print(f"Task creation validation errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def get_suggestions(self, request, pk=None):
        """Get AI suggestions for a specific task"""
        try:
            task = self.get_object()
            ai_service = AIService()
            contexts = ContextEntry.objects.all()[:10]
            
            suggestions = ai_service.get_task_suggestions(
                task.title,
                task.description,
                contexts
            )
            
            serializer = AISuggestionsSerializer(data=suggestions)
            if serializer.is_valid():
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to get suggestions: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get task statistics"""
        total_tasks = self.queryset.count()
        completed_tasks = self.queryset.filter(status='completed').count()
        in_progress_tasks = self.queryset.filter(status='in-progress').count()
        overdue_tasks = self.queryset.filter(
            deadline__lt=timezone.now(),
            status__in=['todo', 'in-progress']
        ).count()
        urgent_tasks = self.queryset.filter(priority='urgent').count()
        
        # Calculate productivity score
        productivity_score = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        # Calculate burnout risk
        burnout_risk = (urgent_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        stats = {
            'total_tasks': total_tasks,
            'completed_tasks': completed_tasks,
            'in_progress_tasks': in_progress_tasks,
            'overdue_tasks': overdue_tasks,
            'urgent_tasks': urgent_tasks,
            'productivity_score': productivity_score,
            'burnout_risk': burnout_risk,
        }
        
        serializer = TaskStatsSerializer(data=stats)
        if serializer.is_valid():
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def overdue(self, request):
        """Get overdue tasks"""
        overdue_tasks = self.queryset.filter(
            deadline__lt=timezone.now(),
            status__in=['todo', 'in-progress']
        )
        serializer = TaskListSerializer(overdue_tasks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def urgent(self, request):
        """Get urgent tasks"""
        urgent_tasks = self.queryset.filter(priority='urgent')
        serializer = TaskListSerializer(urgent_tasks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_status(self, request):
        """Get tasks grouped by status"""
        status_param = request.query_params.get('status', 'todo')
        tasks = self.queryset.filter(status=status_param)
        serializer = TaskListSerializer(tasks, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def by_category(self, request):
        """Get tasks grouped by category"""
        category_id = request.query_params.get('category_id')
        if category_id:
            tasks = self.queryset.filter(category_id=category_id)
        else:
            tasks = self.queryset.exclude(category__isnull=True)
        
        serializer = TaskListSerializer(tasks, many=True)
        return Response(serializer.data)


class TaskAnalyticsViewSet(viewsets.ModelViewSet):
    """ViewSet for task analytics"""
    queryset = TaskAnalytics.objects.all()
    serializer_class = TaskAnalyticsSerializer
    ordering = ['-generated_at']

    @action(detail=False, methods=['post'])
    def generate(self, request):
        """Generate new analytics"""
        try:
            ai_service = AIService()
            tasks = Task.objects.all()
            contexts = ContextEntry.objects.all()
            
            insights = ai_service.generate_insights(tasks, contexts)
            
            analytics = TaskAnalytics.objects.create(
                productivity_score=insights['productivity'],
                burnout_risk=insights['burnout'],
                focus_areas=insights['focus'],
                recommendations=insights['recommendations'],
                total_tasks=tasks.count(),
                completed_tasks=tasks.filter(status='completed').count(),
                urgent_tasks=tasks.filter(priority='urgent').count(),
            )
            
            serializer = self.get_serializer(analytics)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response(
                {'error': f'Failed to generate analytics: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    @action(detail=False, methods=['get'])
    def latest(self, request):
        """Get latest analytics"""
        latest_analytics = self.queryset.first()
        if latest_analytics:
            serializer = self.get_serializer(latest_analytics)
            return Response(serializer.data)
        return Response({'error': 'No analytics available'}, status=status.HTTP_404_NOT_FOUND)
