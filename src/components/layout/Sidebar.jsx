import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, TrendingUp, Zap, Shield, Layers, 
  Bell, User, ChevronLeft, ChevronRight, Trophy, Flame, GitCompare, Activity
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Props', icon: Zap },
  { path: '/trends', label: 'Streaks & Trends', icon: TrendingUp },
  { path: '/matchups', label: 'Matchups', icon: Shield },
  { path: '/compare', label: 'Compare', icon: GitCompare },
  { path: '/odds', label: 'Live Odds', icon: Activity },
  { path: '/parlay', label: 'Parlay Builder', icon: Layers },
  { path: '/alerts', label: 'Alerts', icon: Bell },
  { path: '/profile', label: 'Profile', icon: User },
];

export default function Sidebar({ collapsed, setCollapsed }) {
  const location = useLocation();

  return (
    <aside className={cn(
      "fixed left-0 top-0 h-full z-40 bg-card border-r border-border transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-60"
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Trophy className="w-5 h-5 text-primary" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="text-lg font-bold text-foreground tracking-tight">LockLabNBA</h1>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">Analytics</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "drop-shadow-[0_0_6px_hsl(142,71%,45%)]")} />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-3 border-t border-border text-muted-foreground hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-5 h-5 mx-auto" /> : (
          <div className="flex items-center gap-2">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-xs">Collapse</span>
          </div>
        )}
      </button>
    </aside>
  );
}