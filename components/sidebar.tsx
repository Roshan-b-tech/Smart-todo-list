'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  LayoutDashboard,
  CheckSquare,
  MessageSquare,
  BarChart3,
  Sparkles
} from 'lucide-react';
import Image from 'next/image';
import { ViewType } from '@/app/page';

interface SidebarProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const menuItems = [
  { id: 'dashboard' as ViewType, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tasks' as ViewType, label: 'Tasks', icon: CheckSquare },
  { id: 'context' as ViewType, label: 'Context', icon: MessageSquare },
  { id: 'analytics' as ViewType, label: 'Analytics', icon: BarChart3 },
];

export function Sidebar({ currentView, onViewChange }: SidebarProps) {
  return (
    <div className="w-64 bg-card border-r border-border flex flex-col hidden md:flex">
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <div className="p-2 bg-primary rounded-lg">
            <Image
              src="/logo_gecekoc2qz8-18978.png.webp"
              alt="Smart Todo Logo"
              width={24}
              height={24}
              className="text-primary-foreground"
            />
          </div>
          <div>
            <h1 className="text-xl font-bold">Smart Todo</h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI-Powered
            </p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <Button
            key={item.id}
            variant={currentView === item.id ? 'default' : 'ghost'}
            className={cn(
              'w-full justify-start gap-2',
              currentView === item.id && 'bg-primary text-primary-foreground'
            )}
            onClick={() => onViewChange(item.id)}
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </Button>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Theme</span>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}