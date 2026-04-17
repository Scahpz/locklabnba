import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, User, Trophy, Zap, TrendingUp, GitCompare, Activity, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', icon: Zap },
  { path: '/trends', icon: TrendingUp },
  { path: '/compare', icon: GitCompare },
  { path: '/odds', icon: Activity },
  { path: '/parlay', icon: Layers },
];

export default function MobileHeader() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-xl border-b border-border md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Trophy Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-all"
        >
          <Trophy className="w-5 h-5" />
        </button>

        {/* Logo */}
        <span className="text-sm font-bold text-foreground tracking-tight">LockLab</span>

        {/* Right icons */}
        <div className="flex items-center gap-1">
          <Link
            to="/alerts"
            className={cn(
              "p-2 rounded-full transition-all",
              location.pathname === '/alerts'
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Bell className="w-5 h-5" />
          </Link>
          <Link
            to="/profile"
            className={cn(
              "p-2 rounded-full transition-all",
              location.pathname === '/profile'
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <User className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Vertical Menu Dropdown */}
      {menuOpen && (
        <div className="border-t border-border bg-card/95 backdrop-blur-xl">
          <div className="flex flex-col">
            {navItems.map(item => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-center p-4 border-b border-border/50 transition-colors",
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}