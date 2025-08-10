from django.urls import path
from . import views

urlpatterns = [
    path('suggestions/', views.get_ai_suggestions, name='ai_suggestions'),
    path('process-context/', views.process_context, name='process_context'),
    path('generate-insights/', views.generate_insights, name='generate_insights'),
    path('calculate-priority/', views.calculate_priority, name='calculate_priority'),
]
