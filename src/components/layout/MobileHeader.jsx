import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, User, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MobileHeader() {
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-xl border-b border-border md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-primary" />
          </div>
          <span className="text-base font-bold text-foreground tracking-tight">LockLabNBA</span>
        </div>

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
  );
}