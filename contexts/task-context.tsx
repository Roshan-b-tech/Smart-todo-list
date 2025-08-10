'use client';

import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import { apiService, Task, Category, ContextEntry } from '@/lib/api-service';

// Re-export the types from API service for consistency
export type { Task, Category, ContextEntry as Context };

interface TaskState {
  tasks: Task[];
  contexts: ContextEntry[];
  categories: Category[];
  loading: boolean;
  error: string | null;
}

type TaskAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TASKS'; payload: Task[] }
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'DELETE_TASK'; payload: string }
  | { type: 'SET_CONTEXTS'; payload: ContextEntry[] }
  | { type: 'ADD_CONTEXT'; payload: ContextEntry }
  | { type: 'SET_CATEGORIES'; payload: Category[] };

const initialState: TaskState = {
  tasks: [],
  contexts: [],
  categories: [],
  loading: false,
  error: null,
};

function taskReducer(state: TaskState, action: TaskAction): TaskState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    case 'SET_TASKS':
      return {
        ...state,
        tasks: action.payload,
      };
    case 'ADD_TASK':
      return {
        ...state,
        tasks: [...state.tasks, action.payload],
      };
    case 'UPDATE_TASK':
      return {
        ...state,
        tasks: state.tasks.map(task =>
          task.id === action.payload.id ? action.payload : task
        ),
      };
    case 'DELETE_TASK':
      return {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
      };
    case 'SET_CONTEXTS':
      return {
        ...state,
        contexts: action.payload,
      };
    case 'ADD_CONTEXT':
      return {
        ...state,
        contexts: [...state.contexts, action.payload],
      };
    case 'SET_CATEGORIES':
      return {
        ...state,
        categories: action.payload,
      };
    default:
      return state;
  }
}

const TaskContext = createContext<{
  state: TaskState;
  dispatch: React.Dispatch<TaskAction>;
} | null>(null);

export function TaskProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(taskReducer, initialState);

  // Load data from API on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        // Load tasks, categories, and contexts in parallel
        const [tasks, categories, contexts] = await Promise.all([
          apiService.getTasks(),
          apiService.getCategories(),
          apiService.getContexts(),
        ]);

        dispatch({ type: 'SET_TASKS', payload: tasks });
        dispatch({ type: 'SET_CATEGORIES', payload: categories });
        dispatch({ type: 'SET_CONTEXTS', payload: contexts });
      } catch (error) {
        console.error('Failed to load data:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Failed to load data from server' });
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadData();
  }, []);

  // Enhanced dispatch that handles API calls
  const enhancedDispatch = async (action: TaskAction) => {
    // Handle API calls for certain actions
    if (action.type === 'UPDATE_TASK') {
      try {
        // Call API to update task
        const updatedTask = await apiService.updateTask(action.payload.id, action.payload);
        // Update local state with the response from server
        dispatch({ type: 'UPDATE_TASK', payload: updatedTask });
      } catch (error) {
        console.error('Failed to update task:', error);
        // You might want to show an error toast here
      }
    } else if (action.type === 'DELETE_TASK') {
      try {
        // Call API to delete task
        await apiService.deleteTask(action.payload);
        // Update local state
        dispatch(action);
      } catch (error) {
        console.error('Failed to delete task:', error);
        // You might want to show an error toast here
      }
    } else {
      // For other actions, just dispatch normally
      dispatch(action);
    }
  };

  return (
    <TaskContext.Provider value={{ state, dispatch: enhancedDispatch }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTaskContext() {
  const context = useContext(TaskContext);
  if (!context) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  return context;
}