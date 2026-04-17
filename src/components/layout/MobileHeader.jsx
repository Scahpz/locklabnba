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
    <>
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
      </header>

      {/* Side Menu Sidebar */}
      <div
        className={cn(
          "fixed top-0 left-0 h-screen z-40 bg-card/98 backdrop-blur-xl border-r border-border transition-all duration-300 md:hidden",
          "flex flex-col items-center pt-20 gap-2 w-20",
          menuOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setMenuOpen(false)}
              className={cn(
                "flex items-center justify-center w-12 h-12 rounded-lg transition-all",
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

      {/* Overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}