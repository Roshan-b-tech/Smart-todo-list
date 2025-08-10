from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from .services import AIService
from tasks.models import ContextEntry


@api_view(['POST'])
def get_ai_suggestions(request):
    """Get AI suggestions for task creation"""
    try:
        title = request.data.get('title', '')
        description = request.data.get('description', '')
        
        if not title:
            return Response(
                {'error': 'Title is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get recent contexts
        contexts = ContextEntry.objects.all()[:10]
        
        ai_service = AIService()
        suggestions = ai_service.get_task_suggestions(title, description, contexts)
        
        return Response(suggestions)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to get suggestions: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def process_context(request):
    """Process context with AI analysis"""
    try:
        content = request.data.get('content', '')
        source_type = request.data.get('source_type', 'note')
        
        if not content:
            return Response(
                {'error': 'Content is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        ai_service = AIService()
        insights = ai_service.process_context(content, source_type)
        
        return Response(insights)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to process context: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def generate_insights(request):
    """Generate productivity insights"""
    try:
        from tasks.models import Task
        
        tasks = Task.objects.all()
        contexts = ContextEntry.objects.all()
        
        ai_service = AIService()
        insights = ai_service.generate_insights(tasks, contexts)
        
        return Response(insights)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to generate insights: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['POST'])
def calculate_priority(request):
    """Calculate AI-based priority score for a task"""
    try:
        task_data = request.data.get('task_data', {})
        
        if not task_data:
            return Response(
                {'error': 'Task data is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get recent contexts for context-aware priority calculation
        contexts = ContextEntry.objects.all()[:10]
        
        ai_service = AIService()
        priority_score = ai_service.calculate_priority_score(task_data, contexts)
        
        # Map score to priority level
        if priority_score >= 0.8:
            priority = 'urgent'
        elif priority_score >= 0.6:
            priority = 'high'
        elif priority_score >= 0.4:
            priority = 'medium'
        else:
            priority = 'low'
        
        return Response({
            'priority_score': priority_score,
            'priority': priority,
            'reasoning': f'Priority calculated based on deadline, context urgency, and task content analysis'
        })
        
    except Exception as e:
        return Response(
            {'error': f'Failed to calculate priority: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
