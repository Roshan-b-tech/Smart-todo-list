'use client';

import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  LayoutDashboard,
  CheckSquare,
  MessageSquare,
  BarChart3,
  Sparkles,
  Menu
} from 'lucide-react';
import Image from 'next/image';
import { ViewType } from '@/app/page';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface MobileNavProps {
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
}

const menuItems = [
  { id: 'dashboard' as ViewType, label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tasks' as ViewType, label: 'Tasks', icon: CheckSquare },
  { id: 'context' as ViewType, label: 'Context', icon: MessageSquare },
  { id: 'analytics' as ViewType, label: 'Analytics', icon: BarChart3 },
];

export function MobileNav({ currentView, onViewChange }: MobileNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Mobile Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary rounded-lg">
            <Image
              src="/logo_gecekoc2qz8-18978.png.webp"
              alt="Smart Todo Logo"
              width={20}
              height={20}
              className="text-primary-foreground"
            />
          </div>
          <div>
            <h1 className="text-lg font-bold">Smart Todo</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Sparkles className="h-3 w-3" />
              AI-Powered
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm">
          <div className="fixed inset-y-0 left-0 w-64 bg-card border-r border-border p-4">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
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
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(false)}
              >
                ✕
              </Button>
            </div>

            <nav className="space-y-2">
              {menuItems.map((item) => (
                <Button
                  key={item.id}
                  variant={currentView === item.id ? 'default' : 'ghost'}
                  className={cn(
                    'w-full justify-start gap-2',
                    currentView === item.id && 'bg-primary text-primary-foreground'
                  )}
                  onClick={() => {
                    onViewChange(item.id);
                    setIsMenuOpen(false);
                  }}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Button>
              ))}
            </nav>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-2 md:hidden">
        <div className="flex justify-around">
          {menuItems.map((item) => (
            <Button
              key={item.id}
              variant="ghost"
              size="sm"
              className={cn(
                'flex flex-col items-center gap-1 p-2 h-auto',
                currentView === item.id && 'text-primary'
              )}
              onClick={() => onViewChange(item.id)}
            >
              <item.icon className="h-4 w-4" />
              <span className="text-xs">{item.label}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
