#!/usr/bin/env python
"""
Sample data script for Smart Todo List application.
Run this script to populate the database with sample tasks, categories, and context entries.
"""

import os
import sys
import django
from datetime import datetime, timedelta
import uuid

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'smart_todo.settings')
django.setup()

from tasks.models import Category, Task, ContextEntry, TaskAnalytics


def create_sample_categories():
    """Create sample categories"""
    categories_data = [
        {'name': 'Work', 'color': '#3b82f6'},
        {'name': 'Personal', 'color': '#10b981'},
        {'name': 'Health', 'color': '#f59e0b'},
        {'name': 'Learning', 'color': '#8b5cf6'},
        {'name': 'Social', 'color': '#ef4444'},
        {'name': 'Finance', 'color': '#06b6d4'},
        {'name': 'Home', 'color': '#84cc16'},
    ]
    
    categories = []
    for data in categories_data:
        category, created = Category.objects.get_or_create(
            name=data['name'],
            defaults={'color': data['color']}
        )
        categories.append(category)
        if created:
            print(f"Created category: {category.name}")
    
    return categories


def create_sample_contexts():
    """Create sample context entries"""
    contexts_data = [
        {
            'content': 'Urgent client meeting tomorrow at 2 PM. Need to prepare quarterly report and presentation slides. The client mentioned they want to discuss budget changes.',
            'source_type': 'email',
            'processed_insights': {
                'keywords': ['urgent', 'client', 'meeting', 'quarterly', 'report', 'budget'],
                'sentiment': 'negative',
                'urgency': 0.8,
                'extracted_tasks': ['Prepare quarterly report', 'Create presentation slides', 'Review budget changes'],
                'insights': 'High urgency email with multiple actionable tasks'
            }
        },
        {
            'content': 'Great news! The team completed the project ahead of schedule. Everyone did an excellent job. We should plan a team celebration.',
            'source_type': 'message',
            'processed_insights': {
                'keywords': ['team', 'project', 'completed', 'celebration', 'excellent'],
                'sentiment': 'positive',
                'urgency': 0.2,
                'extracted_tasks': ['Plan team celebration', 'Send congratulatory message'],
                'insights': 'Positive team update with celebration opportunity'
            }
        },
        {
            'content': 'Remember to schedule annual health checkup. Doctor appointment system is now open for next month. Also need to renew gym membership.',
            'source_type': 'note',
            'processed_insights': {
                'keywords': ['health', 'checkup', 'doctor', 'appointment', 'gym', 'membership'],
                'sentiment': 'neutral',
                'urgency': 0.4,
                'extracted_tasks': ['Schedule health checkup', 'Renew gym membership'],
                'insights': 'Health-related tasks with moderate urgency'
            }
        },
        {
            'content': 'Learning new React hooks and TypeScript patterns. The course is really helpful. Should practice with a small project to reinforce concepts.',
            'source_type': 'note',
            'processed_insights': {
                'keywords': ['learning', 'react', 'typescript', 'course', 'project', 'practice'],
                'sentiment': 'positive',
                'urgency': 0.3,
                'extracted_tasks': ['Complete React course', 'Build practice project'],
                'insights': 'Learning progress with practical application needed'
            }
        },
        {
            'content': 'Friend birthday party this weekend. Need to buy gift and RSVP. Also have dinner plans with family on Sunday.',
            'source_type': 'message',
            'processed_insights': {
                'keywords': ['friend', 'birthday', 'party', 'gift', 'family', 'dinner'],
                'sentiment': 'positive',
                'urgency': 0.6,
                'extracted_tasks': ['Buy birthday gift', 'RSVP to party', 'Plan family dinner'],
                'insights': 'Social commitments with weekend timeline'
            }
        }
    ]
    
    contexts = []
    for data in contexts_data:
        context = ContextEntry.objects.create(
            content=data['content'],
            source_type=data['source_type'],
            processed_insights=data['processed_insights']
        )
        contexts.append(context)
        print(f"Created context: {context.source_type} - {context.content[:50]}...")
    
    return contexts


def create_sample_tasks(categories):
    """Create sample tasks"""
    tasks_data = [
        {
            'title': 'Prepare Quarterly Client Presentation',
            'description': 'Create comprehensive presentation for quarterly review meeting with key stakeholders',
            'category': categories[0],  # Work
            'priority': 'high',
            'priority_score': 0.85,
            'deadline': datetime.now() + timedelta(days=3),
            'status': 'in-progress',
            'ai_suggestions': {
                'suggested_deadline': (datetime.now() + timedelta(days=3)).strftime('%Y-%m-%d'),
                'suggested_category': 'Work',
                'enhanced_description': 'Create comprehensive presentation for quarterly review meeting with key stakeholders including financial metrics, project updates, and strategic initiatives',
                'reasoning': 'High priority due to stakeholder importance and quarterly reporting cycle',
                'priority_score': 0.85,
                'suggested_priority': 'high'
            },
            'tags': ['presentation', 'quarterly', 'stakeholders']
        },
        {
            'title': 'Complete React TypeScript Course',
            'description': 'Finish the advanced React patterns and TypeScript integration course',
            'category': categories[3],  # Learning
            'priority': 'medium',
            'priority_score': 0.65,
            'deadline': datetime.now() + timedelta(days=7),
            'status': 'todo',
            'ai_suggestions': {
                'suggested_deadline': (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d'),
                'suggested_category': 'Learning',
                'enhanced_description': 'Finish the advanced React patterns and TypeScript integration course to improve development skills',
                'reasoning': 'Medium priority for skill development with reasonable timeframe',
                'priority_score': 0.65,
                'suggested_priority': 'medium'
            },
            'tags': ['react', 'typescript', 'learning']
        },
        {
            'title': 'Schedule Annual Health Checkup',
            'description': 'Book appointment with primary care physician for annual physical examination',
            'category': categories[2],  # Health
            'priority': 'medium',
            'priority_score': 0.55,
            'deadline': datetime.now() + timedelta(days=5),
            'status': 'todo',
            'ai_suggestions': {
                'suggested_deadline': (datetime.now() + timedelta(days=5)).strftime('%Y-%m-%d'),
                'suggested_category': 'Health',
                'enhanced_description': 'Book appointment with primary care physician for annual physical examination and health assessment',
                'reasoning': 'Medium priority for health maintenance',
                'priority_score': 0.55,
                'suggested_priority': 'medium'
            },
            'tags': ['health', 'checkup', 'appointment']
        },
        {
            'title': 'Buy Birthday Gift for Friend',
            'description': 'Purchase thoughtful gift for friend\'s birthday party this weekend',
            'category': categories[4],  # Social
            'priority': 'high',
            'priority_score': 0.75,
            'deadline': datetime.now() + timedelta(days=2),
            'status': 'todo',
            'ai_suggestions': {
                'suggested_deadline': (datetime.now() + timedelta(days=2)).strftime('%Y-%m-%d'),
                'suggested_category': 'Social',
                'enhanced_description': 'Purchase thoughtful gift for friend\'s birthday party this weekend',
                'reasoning': 'High priority due to upcoming social event',
                'priority_score': 0.75,
                'suggested_priority': 'high'
            },
            'tags': ['birthday', 'gift', 'social']
        },
        {
            'title': 'Review Monthly Budget',
            'description': 'Analyze spending patterns and adjust budget for next month',
            'category': categories[5],  # Finance
            'priority': 'low',
            'priority_score': 0.35,
            'deadline': datetime.now() + timedelta(days=10),
            'status': 'todo',
            'ai_suggestions': {
                'suggested_deadline': (datetime.now() + timedelta(days=10)).strftime('%Y-%m-%d'),
                'suggested_category': 'Finance',
                'enhanced_description': 'Analyze spending patterns and adjust budget for next month based on current financial goals',
                'reasoning': 'Low priority for financial planning with flexible deadline',
                'priority_score': 0.35,
                'suggested_priority': 'low'
            },
            'tags': ['budget', 'finance', 'planning']
        },
        {
            'title': 'Clean Kitchen and Organize Pantry',
            'description': 'Deep clean kitchen appliances and reorganize pantry items',
            'category': categories[6],  # Home
            'priority': 'low',
            'priority_score': 0.25,
            'deadline': datetime.now() + timedelta(days=14),
            'status': 'todo',
            'ai_suggestions': {
                'suggested_deadline': (datetime.now() + timedelta(days=14)).strftime('%Y-%m-%d'),
                'suggested_category': 'Home',
                'enhanced_description': 'Deep clean kitchen appliances and reorganize pantry items for better home organization',
                'reasoning': 'Low priority home maintenance task',
                'priority_score': 0.25,
                'suggested_priority': 'low'
            },
            'tags': ['cleaning', 'home', 'organization']
        },
        {
            'title': 'Submit Project Documentation',
            'description': 'Finalize and submit project documentation for client approval',
            'category': categories[0],  # Work
            'priority': 'urgent',
            'priority_score': 0.95,
            'deadline': datetime.now() + timedelta(days=1),
            'status': 'in-progress',
            'ai_suggestions': {
                'suggested_deadline': (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d'),
                'suggested_category': 'Work',
                'enhanced_description': 'Finalize and submit project documentation for client approval with all required sections',
                'reasoning': 'Urgent priority due to client deadline',
                'priority_score': 0.95,
                'suggested_priority': 'urgent'
            },
            'tags': ['documentation', 'client', 'urgent']
        },
        {
            'title': 'Plan Team Celebration',
            'description': 'Organize team celebration for successful project completion',
            'category': categories[4],  # Social
            'priority': 'medium',
            'priority_score': 0.45,
            'deadline': datetime.now() + timedelta(days=7),
            'status': 'completed',
            'ai_suggestions': {
                'suggested_deadline': (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d'),
                'suggested_category': 'Social',
                'enhanced_description': 'Organize team celebration for successful project completion',
                'reasoning': 'Medium priority for team morale',
                'priority_score': 0.45,
                'suggested_priority': 'medium'
            },
            'tags': ['celebration', 'team', 'social']
        }
    ]
    
    tasks = []
    for data in tasks_data:
        task = Task.objects.create(**data)
        tasks.append(task)
        print(f"Created task: {task.title} ({task.priority} priority)")
    
    return tasks


def create_sample_analytics(tasks, contexts):
    """Create sample analytics"""
    total_tasks = len(tasks)
    completed_tasks = len([t for t in tasks if t.status == 'completed'])
    urgent_tasks = len([t for t in tasks if t.priority == 'urgent'])
    
    productivity = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
    burnout_risk = (urgent_tasks / total_tasks * 100) if total_tasks > 0 else 0
    
    analytics = TaskAnalytics.objects.create(
        productivity_score=productivity,
        burnout_risk=burnout_risk,
        focus_areas=['Work', 'Learning', 'Social'],
        recommendations=[
            'Great job maintaining good productivity!',
            'Your task urgency levels look healthy',
            'Your context input is helping improve task intelligence'
        ],
        total_tasks=total_tasks,
        completed_tasks=completed_tasks,
        urgent_tasks=urgent_tasks
    )
    
    print(f"Created analytics: Productivity {productivity:.1f}%, Burnout Risk {burnout_risk:.1f}%")
    return analytics


def main():
    """Main function to create all sample data"""
    print("Creating sample data for Smart Todo List...")
    
    # Create categories
    print("\n1. Creating categories...")
    categories = create_sample_categories()
    
    # Create context entries
    print("\n2. Creating context entries...")
    contexts = create_sample_contexts()
    
    # Create tasks
    print("\n3. Creating tasks...")
    tasks = create_sample_tasks(categories)
    
    # Create analytics
    print("\n4. Creating analytics...")
    analytics = create_sample_analytics(tasks, contexts)
    
    print(f"\n✅ Sample data created successfully!")
    print(f"   - {len(categories)} categories")
    print(f"   - {len(contexts)} context entries")
    print(f"   - {len(tasks)} tasks")
    print(f"   - 1 analytics record")
    
    print("\n🎯 Sample data includes:")
    print("   - Various task priorities (urgent, high, medium, low)")
    print("   - Different task statuses (todo, in-progress, completed)")
    print("   - Multiple categories (Work, Personal, Health, etc.)")
    print("   - Context entries with AI-processed insights")
    print("   - AI suggestions for tasks")
    print("   - Sample analytics with productivity metrics")


if __name__ == '__main__':
    main()
