import os
import json
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from django.conf import settings
from langchain_openai import ChatOpenAI
from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.schema import HumanMessage
from langchain.callbacks.manager import CallbackManager
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler


class AIService:
    """
    AI Service for Smart Todo List application.
    Handles context processing, task prioritization, deadline suggestions,
    smart categorization, and task enhancement.
    """
    
    def __init__(self):
        self.config = settings.AI_SERVICE_CONFIG
        self.default_provider = self.config.get('DEFAULT_AI_PROVIDER', 'openai')
        
        # Initialize AI clients
        self._setup_ai_clients()
    
    def _setup_ai_clients(self):
        """Setup AI service clients based on configuration"""
        # Initialize LangChain clients
        self.openai_client = None
        self.claude_client = None
        self.gemini_client = None
        
        # OpenAI
        if (self.config.get('OPENAI_API_KEY') and 
            self.config.get('OPENAI_API_KEY') != 'your-openai-api-key-here'):
            try:
                self.openai_client = ChatOpenAI(
                    api_key=self.config['OPENAI_API_KEY'],
                    model="gpt-3.5-turbo",
                    temperature=0.7,
                    max_tokens=500
                )
            except Exception as e:
                print(f"Failed to initialize OpenAI client: {e}")
                self.openai_client = None
        
        # Anthropic Claude
        if (self.config.get('ANTHROPIC_API_KEY') and 
            self.config.get('ANTHROPIC_API_KEY') != 'your-anthropic-api-key-here'):
            try:
                self.claude_client = ChatAnthropic(
                    api_key=self.config['ANTHROPIC_API_KEY'],
                    model="claude-3-sonnet-20240229",
                    temperature=0.7,
                    max_tokens=500
                )
            except Exception as e:
                print(f"Failed to initialize Anthropic client: {e}")
                self.claude_client = None
        
        # Google Gemini
        if (self.config.get('GOOGLE_API_KEY') and 
            self.config.get('GOOGLE_API_KEY') != 'your-google-api-key-here'):
            try:
                self.gemini_client = ChatGoogleGenerativeAI(
                    google_api_key=self.config['GOOGLE_API_KEY'],
                    model="gemini-1.5-flash",
                    temperature=0.7,
                    max_tokens=500
                )
            except Exception as e:
                print(f"Failed to initialize Gemini client: {e}")
                self.gemini_client = None
    
    def _call_ai_provider(self, prompt: str, provider: str = None) -> str:
        """Call the specified AI provider with a prompt"""
        provider = provider or self.default_provider
        
        try:
            # Priority order: OpenAI → Google Gemini → Simulated Response
            
            # 1. Try OpenAI first (most reliable)
            if self.openai_client:
                try:
                    return self._call_openai(prompt)
                except Exception as e:
                    print(f"OpenAI failed: {e}, trying Google Gemini...")
            
            # 2. Try Google Gemini as fallback
            if self.gemini_client:
                try:
                    return self._call_gemini(prompt)
                except Exception as e:
                    print(f"Google Gemini failed: {e}, using simulated response...")
            
            # 3. Fallback to simulated AI response
            return self._simulate_ai_response(prompt)
            
        except Exception as e:
            print(f"AI provider {provider} failed: {str(e)}")
            return self._simulate_ai_response(prompt)
    
    def _call_openai(self, prompt: str) -> str:
        """Call OpenAI API using LangChain"""
        if not self.openai_client:
            raise Exception("OpenAI client not initialized")
        
        response = self.openai_client.invoke([HumanMessage(content=prompt)])
        return response.content
    
    def _call_claude(self, prompt: str) -> str:
        """Call Anthropic Claude API using LangChain"""
        if not self.claude_client:
            return self._simulate_ai_response(prompt)
        
        try:
            response = self.claude_client.invoke([HumanMessage(content=prompt)])
            return response.content
        except Exception as e:
            print(f"Claude API call failed: {e}")
            return self._simulate_ai_response(prompt)
    
    def _call_gemini(self, prompt: str) -> str:
        """Call Google Gemini API using LangChain"""
        if not self.gemini_client:
            raise Exception("Gemini client not initialized")
        
        try:
            response = self.gemini_client.invoke([HumanMessage(content=prompt)])
            return response.content
        except Exception as e:
            print(f"Gemini API call failed: {e}")
            raise e
    
    def _call_lm_studio(self, prompt: str) -> str:
        """Call local LM Studio API"""
        url = self.config.get('LM_STUDIO_URL', 'http://localhost:1234/v1')
        response = requests.post(
            f"{url}/chat/completions",
            json={
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
                "max_tokens": 500
            },
            timeout=30
        )
        return response.json()['choices'][0]['message']['content']
    
    def _simulate_ai_response(self, prompt: str) -> str:
        """Simulate AI response for testing/fallback"""
        # Simple keyword-based responses for demonstration
        if 'priority' in prompt.lower():
            return "Based on the content analysis, this appears to be a high priority task due to urgent keywords detected."
        elif 'deadline' in prompt.lower():
            return "Suggested deadline: 3 days from now based on task complexity and current workload."
        elif 'category' in prompt.lower():
            return "This task appears to belong to the 'Work' category based on the content analysis."
        else:
            return "AI analysis completed. Task processed successfully with intelligent insights."
    
    def process_context(self, content: str, source_type: str) -> Dict[str, Any]:
        """
        Process daily context (messages, emails, notes) with AI analysis.
        
        Args:
            content: The context content to analyze
            source_type: Type of context (email, message, note, other)
        
        Returns:
            Dictionary with processed insights
        """
        prompt = f"""
        Analyze the following {source_type} content and extract insights:
        
        Content: {content}
        
        Please provide a JSON response with the following structure:
        {{
            "keywords": ["keyword1", "keyword2", "keyword3"],
            "sentiment": "positive|neutral|negative",
            "urgency": 0.0-1.0,
            "extracted_tasks": ["task1", "task2"],
            "insights": "Brief analysis of the content"
        }}
        
        Focus on:
        1. Extracting relevant keywords
        2. Determining sentiment
        3. Assessing urgency level
        4. Identifying potential tasks
        5. Providing actionable insights
        """
        
        try:
            ai_response = self._call_ai_provider(prompt)
            
            # Try to parse JSON response
            try:
                insights = json.loads(ai_response)
            except json.JSONDecodeError:
                # Fallback to basic analysis
                insights = self._basic_context_analysis(content, source_type)
            
            return insights
            
        except Exception as e:
            print(f"Context processing failed: {str(e)}")
            return self._basic_context_analysis(content, source_type)
    
    def _basic_context_analysis(self, content: str, source_type: str) -> Dict[str, Any]:
        """Basic context analysis as fallback"""
        # Extract keywords
        words = content.lower().split()
        keywords = [word for word in words if len(word) > 3][:5]
        
        # Simple sentiment analysis
        positive_words = ['good', 'great', 'excellent', 'amazing', 'wonderful']
        negative_words = ['bad', 'terrible', 'urgent', 'critical', 'emergency']
        
        positive_count = sum(1 for word in words if word in positive_words)
        negative_count = sum(1 for word in words if word in negative_words)
        
        if negative_count > positive_count:
            sentiment = 'negative'
        elif positive_count > negative_count:
            sentiment = 'positive'
        else:
            sentiment = 'neutral'
        
        # Urgency calculation
        urgent_words = ['urgent', 'asap', 'immediately', 'critical', 'emergency']
        urgency = min(sum(1 for word in words if word in urgent_words) / len(words) * 2, 1.0)
        
        # Extract potential tasks
        task_patterns = ['need to', 'should', 'must', 'have to', 'remember to']
        extracted_tasks = []
        for pattern in task_patterns:
            if pattern in content.lower():
                # Simple task extraction
                start = content.lower().find(pattern)
                end = content.find('.', start)
                if end == -1:
                    end = len(content)
                task = content[start:end].strip()
                if len(task) < 100:
                    extracted_tasks.append(task)
        
        return {
            'keywords': keywords,
            'sentiment': sentiment,
            'urgency': urgency,
            'extracted_tasks': extracted_tasks[:3],
            'insights': f"Processed {source_type} content with {len(keywords)} keywords and {sentiment} sentiment."
        }
    
    def get_task_suggestions(self, title: str, description: str, contexts: List) -> Dict[str, Any]:
        """
        Get AI-powered task suggestions including priority, deadline, and category.
        
        Args:
            title: Task title
            description: Task description
            contexts: List of context entries for analysis
        
        Returns:
            Dictionary with AI suggestions
        """
        # Prepare context summary
        context_summary = ""
        if contexts:
            recent_contexts = contexts[:5]  # Use recent contexts
            context_summary = "\n".join([
                f"{ctx.source_type}: {ctx.content[:100]}..." 
                for ctx in recent_contexts
            ])
        
        prompt = f"""
        Analyze the following task and provide intelligent suggestions:
        
        Task Title: {title}
        Task Description: {description}
        
        Recent Context:
        {context_summary}
        
        Please provide a JSON response with the following structure:
        {{
            "suggested_deadline": "YYYY-MM-DD",
            "suggested_category": "category_name",
            "enhanced_description": "enhanced description with context",
            "reasoning": "explanation of suggestions",
            "priority_score": 0.0-1.0,
            "suggested_priority": "urgent|high|medium|low",
            "extracted_tasks": ["subtask1", "subtask2"]
        }}
        
        Consider:
        1. Task complexity and estimated time
        2. Current workload and context
        3. Urgency indicators from context
        4. Optimal deadline based on priority
        5. Most appropriate category
        6. Enhanced description with relevant context
        """
        
        try:
            ai_response = self._call_ai_provider(prompt)
            
            try:
                suggestions = json.loads(ai_response)
            except json.JSONDecodeError:
                suggestions = self._basic_task_suggestions(title, description, contexts)
            
            return suggestions
            
        except Exception as e:
            print(f"Task suggestions failed: {str(e)}")
            return self._basic_task_suggestions(title, description, contexts)
    
    def _basic_task_suggestions(self, title: str, description: str, contexts: List) -> Dict[str, Any]:
        """Basic task suggestions as fallback"""
        # Calculate priority score
        urgency_keywords = ['urgent', 'asap', 'critical', 'important', 'deadline']
        text = (title + ' ' + description).lower()
        urgency_count = sum(1 for keyword in urgency_keywords if keyword in text)
        priority_score = min(0.5 + (urgency_count * 0.1), 1.0)
        
        # Map score to priority
        if priority_score >= 0.8:
            suggested_priority = 'urgent'
        elif priority_score >= 0.6:
            suggested_priority = 'high'
        elif priority_score >= 0.4:
            suggested_priority = 'medium'
        else:
            suggested_priority = 'low'
        
        # Suggest deadline
        days_to_add = {
            'urgent': 1,
            'high': 3,
            'medium': 7,
            'low': 14
        }
        suggested_deadline = (datetime.now() + timedelta(days=days_to_add[suggested_priority])).strftime('%Y-%m-%d')
        
        # Suggest category
        category_keywords = {
            'Work': ['meeting', 'project', 'client', 'work', 'office'],
            'Personal': ['home', 'family', 'personal', 'shopping'],
            'Health': ['health', 'doctor', 'exercise', 'gym'],
            'Learning': ['learn', 'study', 'course', 'book'],
            'Social': ['friend', 'social', 'party', 'event']
        }
        
        suggested_category = 'Personal'  # Default
        for category, keywords in category_keywords.items():
            if any(keyword in text for keyword in keywords):
                suggested_category = category
                break
        
        return {
            'suggested_deadline': suggested_deadline,
            'suggested_category': suggested_category,
            'enhanced_description': description,
            'reasoning': f"Priority {suggested_priority} based on urgency keywords. Category {suggested_category} based on content analysis.",
            'priority_score': priority_score,
            'suggested_priority': suggested_priority,
            'extracted_tasks': []
        }
    
    def generate_insights(self, tasks: List, contexts: List) -> Dict[str, Any]:
        """
        Generate productivity insights and recommendations.
        
        Args:
            tasks: List of task objects
            contexts: List of context entries
        
        Returns:
            Dictionary with insights and recommendations
        """
        # Calculate basic metrics
        total_tasks = len(tasks)
        completed_tasks = len([t for t in tasks if t.status == 'completed'])
        urgent_tasks = len([t for t in tasks if t.priority == 'urgent'])
        
        productivity = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 0
        burnout_risk = (urgent_tasks / total_tasks * 100) if total_tasks > 0 else 0
        
        # Analyze focus areas
        category_counts = {}
        for task in tasks:
            if task.category:
                category_name = task.category.name if hasattr(task.category, 'name') else str(task.category)
                category_counts[category_name] = category_counts.get(category_name, 0) + 1
        
        focus_areas = sorted(category_counts.items(), key=lambda x: x[1], reverse=True)[:3]
        focus_areas = [area[0] for area in focus_areas]
        
        # Generate recommendations
        recommendations = []
        if productivity < 50:
            recommendations.append("Consider breaking down large tasks into smaller, manageable chunks")
        if burnout_risk > 70:
            recommendations.append("You have many urgent tasks. Try to prioritize and delegate when possible")
        if len(contexts) < 3:
            recommendations.append("Adding more daily context will improve AI suggestions")
        else:
            recommendations.append("Your context input is helping improve task intelligence")
        
        return {
            'productivity': productivity,
            'burnout': burnout_risk,
            'focus': focus_areas,
            'recommendations': recommendations
        }
    
    def calculate_priority_score(self, task_data: Dict, contexts: List) -> float:
        """
        Calculate priority score based on task data and context using AI analysis.
        
        Args:
            task_data: Task information
            contexts: List of context entries
        
        Returns:
            Priority score between 0 and 1
        """
        try:
            # Create AI prompt for priority calculation
            title = task_data.get('title', '')
            description = task_data.get('description', '')
            deadline = task_data.get('deadline', '')
            
            # Get context insights
            context_insights = []
            if contexts:
                # Convert to list and get last 3 contexts (Django QuerySet doesn't support negative indexing)
                contexts_list = list(contexts)
                recent_contexts = contexts_list[-3:] if len(contexts_list) >= 3 else contexts_list
                for ctx in recent_contexts:
                    insights = ctx.processed_insights
                    if insights:
                        context_insights.append({
                            'content': ctx.content[:100],
                            'urgency': insights.get('urgency', 0),
                            'sentiment': insights.get('sentiment', 'neutral')
                        })
            
            prompt = f"""
            Analyze the following task and calculate a priority score (0.0 to 1.0) based on:
            1. Task title and description
            2. Deadline proximity
            3. Context urgency and sentiment
            4. Overall importance indicators
            
            Task Title: {title}
            Task Description: {description}
            Deadline: {deadline}
            
            Recent Context Insights:
            {json.dumps(context_insights, indent=2)}
            
            Consider:
            - Urgency keywords (urgent, asap, critical, important, deadline)
            - Deadline proximity (days until deadline)
            - Context urgency levels
            - Sentiment analysis from context
            - Task complexity and scope
            
            Return only a JSON response with this structure:
            {{
                "priority_score": 0.85,
                "reasoning": "High priority due to urgent deadline and critical keywords in description"
            }}
            """
            
            # Get AI response
            ai_response = self._call_ai_provider(prompt)
            
            try:
                result = json.loads(ai_response)
                priority_score = result.get('priority_score', 0.5)
                return min(max(float(priority_score), 0.0), 1.0)
            except (json.JSONDecodeError, ValueError, TypeError):
                # Fallback to rule-based calculation
                return self._rule_based_priority_calculation(task_data, contexts)
                
        except Exception as e:
            print(f"AI priority calculation failed: {str(e)}")
            # Fallback to rule-based calculation
            return self._rule_based_priority_calculation(task_data, contexts)
    
    def _rule_based_priority_calculation(self, task_data: Dict, contexts: List) -> float:
        """Rule-based priority calculation as fallback"""
        score = 0.5  # Base score
        
        # Deadline factor
        if task_data.get('deadline'):
            try:
                deadline = datetime.fromisoformat(task_data['deadline'].replace('Z', '+00:00'))
                days_until_deadline = (deadline - datetime.now()).days
                
                if days_until_deadline <= 1:
                    score += 0.4
                elif days_until_deadline <= 3:
                    score += 0.3
                elif days_until_deadline <= 7:
                    score += 0.2
                else:
                    score += 0.1
            except:
                pass
        
        # Context-based urgency
        if contexts:
            # Convert to list and get last 5 contexts (Django QuerySet doesn't support negative indexing)
            contexts_list = list(contexts)
            recent_contexts = contexts_list[-5:] if len(contexts_list) >= 5 else contexts_list
            avg_urgency = sum(ctx.processed_insights.get('urgency', 0) for ctx in recent_contexts) / len(recent_contexts)
            score += avg_urgency * 0.3
        
        # Description keywords
        description = task_data.get('description', '')
        title = task_data.get('title', '')
        text = f"{title} {description}".lower()
        
        urgent_keywords = ['urgent', 'asap', 'critical', 'important', 'priority', 'deadline', 'emergency']
        has_urgent_keywords = any(keyword in text for keyword in urgent_keywords)
        if has_urgent_keywords:
            score += 0.2
        
        return min(max(score, 0), 1)  # Ensure score is between 0 and 1
