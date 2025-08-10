// API service for connecting to Django backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface Task {
    id: string;
    title: string;
    description: string;
    category?: {
        id: string;
        name: string;
        color: string;
    };
    category_id?: string;
    priority: 'urgent' | 'high' | 'medium' | 'low';
    priority_score: number;
    deadline?: string;
    status: 'todo' | 'in-progress' | 'completed';
    ai_suggestions?: any;
    tags: string[];
    created_at: string;
    updated_at: string;
    is_overdue: boolean;
    days_until_deadline?: number;
}

export interface Category {
    id: string;
    name: string;
    color: string;
    usage_frequency: number;
    created_at: string;
    updated_at: string;
}

export interface ContextEntry {
    id: string;
    content: string;
    source_type: 'email' | 'message' | 'note' | 'other';
    processed_insights: {
        keywords: string[];
        sentiment: 'positive' | 'neutral' | 'negative';
        urgency: number;
        extracted_tasks?: string[];
    };
    created_at: string;
    updated_at: string;
}

export interface TaskStats {
    total_tasks: number;
    completed_tasks: number;
    in_progress_tasks: number;
    overdue_tasks: number;
    urgent_tasks: number;
}

export interface AISuggestions {
    suggested_deadline?: string;
    suggested_category?: string;
    enhanced_description?: string;
    reasoning?: string;
    priority_score?: number;
}

class ApiService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = API_BASE_URL;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const url = `${this.baseUrl}${endpoint}`;
        const config: RequestInit = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers,
            },
            ...options,
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Task APIs
    async getTasks(params?: {
        status?: string;
        priority?: string;
        category?: string;
        search?: string;
    }): Promise<Task[]> {
        const searchParams = new URLSearchParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value) searchParams.append(key, value);
            });
        }

        const query = searchParams.toString();
        const endpoint = `/tasks/${query ? `?${query}` : ''}`;
        const response = await this.request<any>(endpoint);

        // Handle pagination - Django REST Framework returns { results: [...], count: n }
        if (response && response.results) {
            return response.results;
        }

        // If not paginated, return the response directly
        return Array.isArray(response) ? response : [];
    }

    async getTask(id: string): Promise<Task> {
        return this.request<Task>(`/tasks/${id}/`);
    }

    async createTask(taskData: Partial<Task>): Promise<Task> {
        return this.request<Task>('/tasks/', {
            method: 'POST',
            body: JSON.stringify(taskData),
        });
    }

    async updateTask(id: string, taskData: Partial<Task>): Promise<Task> {
        return this.request<Task>(`/tasks/${id}/`, {
            method: 'PUT',
            body: JSON.stringify(taskData),
        });
    }

    async deleteTask(id: string): Promise<void> {
        return this.request<void>(`/tasks/${id}/`, {
            method: 'DELETE',
        });
    }

    // Category APIs
    async getCategories(): Promise<Category[]> {
        const response = await this.request<any>('/categories/');

        // Handle pagination - Django REST Framework returns { results: [...], count: n }
        if (response && response.results) {
            return response.results;
        }

        // If not paginated, return the response directly
        return Array.isArray(response) ? response : [];
    }

    async createCategory(categoryData: Partial<Category>): Promise<Category> {
        return this.request<Category>('/categories/', {
            method: 'POST',
            body: JSON.stringify(categoryData),
        });
    }

    // Context APIs
    async getContexts(): Promise<ContextEntry[]> {
        const response = await this.request<any>('/contexts/');

        // Handle pagination - Django REST Framework returns { results: [...], count: n }
        if (response && response.results) {
            return response.results;
        }

        // If not paginated, return the response directly
        return Array.isArray(response) ? response : [];
    }

    async createContext(contextData: {
        content: string;
        source_type: string;
    }): Promise<ContextEntry> {
        return this.request<ContextEntry>('/contexts/', {
            method: 'POST',
            body: JSON.stringify(contextData),
        });
    }

    // AI APIs
    async getAISuggestions(title: string, description: string): Promise<AISuggestions> {
        return this.request<AISuggestions>('/ai/suggestions/', {
            method: 'POST',
            body: JSON.stringify({ title, description }),
        });
    }

    async processContext(content: string, sourceType: string): Promise<any> {
        return this.request<any>('/ai/process-context/', {
            method: 'POST',
            body: JSON.stringify({ content, source_type: sourceType }),
        });
    }

    async generateInsights(): Promise<any> {
        return this.request<any>('/ai/generate-insights/', {
            method: 'POST',
        });
    }

    async calculatePriority(taskData: Partial<Task>): Promise<{ priority_score: number; priority: string; reasoning: string }> {
        return this.request<any>('/ai/calculate-priority/', {
            method: 'POST',
            body: JSON.stringify({ task_data: taskData }),
        });
    }

    // Analytics APIs
    async getTaskStats(): Promise<TaskStats> {
        return this.request<TaskStats>('/tasks/stats/');
    }
}

export const apiService = new ApiService();
