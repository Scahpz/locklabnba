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
      <header className="fixed top-0 left-0 right-0 z-40 bg-card/98 backdrop-blur-xl border-b border-border md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Menu Button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-all"
          >
            <Trophy className="w-5 h-5" />
          </button>

          {/* Logo */}
          <span className="text-sm font-bold text-foreground tracking-tight">LockLabNBA</span>

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
          "fixed top-16 left-0 h-screen z-50 transition-all duration-300 md:hidden",
          "flex flex-col items-center pt-4 gap-3 w-24",
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
                "flex items-center justify-center w-14 h-14 rounded-full transition-all shadow-lg",
                isActive
                  ? "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(142,71%,45%,0.4)]"
                  : "bg-secondary text-muted-foreground hover:text-foreground hover:shadow-[0_0_15px_hsl(142,71%,45%,0.2)]"
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
          className="fixed top-16 left-24 right-0 bottom-0 z-30 md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  );
}