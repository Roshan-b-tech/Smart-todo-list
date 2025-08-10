'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/sidebar';
import { MobileNav } from '@/components/mobile-nav';
import { Dashboard } from '@/components/dashboard';
import { TaskManager } from '@/components/task-manager';
import { ContextInput } from '@/components/context-input';
import { Analytics } from '@/components/analytics';
import { TaskProvider } from '@/contexts/task-context';
import { useToast } from '@/hooks/use-toast';

export type ViewType = 'dashboard' | 'tasks' | 'context' | 'analytics';

export default function Home() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const { toast } = useToast();

  useEffect(() => {
    // Welcome message
    toast({
      title: "Welcome to Smart Todo! 🚀",
      description: "AI-powered task management at your fingertips",
    });
  }, [toast]);

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <Dashboard />;
      case 'tasks':
        return <TaskManager />;
      case 'context':
        return <ContextInput />;
      case 'analytics':
        return <Analytics />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <TaskProvider>
      <div className="flex h-screen bg-background">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        <div className="flex-1 flex flex-col">
          <MobileNav currentView={currentView} onViewChange={setCurrentView} />
          <main className="flex-1 overflow-auto pb-16 md:pb-0">
            {renderView()}
          </main>
        </div>
      </div>
    </TaskProvider>
  );
}