from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet, CategoryViewSet, ContextEntryViewSet, TaskAnalyticsViewSet

# Create router and register viewsets
router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'contexts', ContextEntryViewSet, basename='context')
router.register(r'analytics', TaskAnalyticsViewSet, basename='analytics')

urlpatterns = [
    path('', include(router.urls)),
]
