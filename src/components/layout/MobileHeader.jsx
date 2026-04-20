import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, User, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MobileHeader() {
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-card/98 backdrop-blur-xl border-b border-border md:hidden">
      <div className="flex items-center justify-between px-4 h-14">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-primary" />
          <span className="text-base font-bold text-foreground tracking-tight">LockLab<span className="text-primary">NBA</span></span>
        </Link>

        {/* Right icons */}
        <div className="flex items-center gap-1">
          <Link
            to="/alerts"
            className={cn(
              'p-2 rounded-full transition-all',
              location.pathname === '/alerts' ? 'bg-primary/15 text-primary' : 'text-muted-foreground'
            )}
          >
            <Bell className="w-5 h-5" />
          </Link>
          <Link
            to="/profile"
            className={cn(
              'p-2 rounded-full transition-all',
              location.pathname === '/profile' ? 'bg-primary/15 text-primary' : 'text-muted-foreground'
            )}
          >
            <User className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
