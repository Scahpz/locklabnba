import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bell, User, Trophy } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function MobileHeader() {
  const location = useLocation();

  return (
    <header className="fixed top-0 left-0 right-0 z-40 md:hidden">
      <div className="bg-[hsl(222,47%,7%)/95] backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between px-4 h-14">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center ring-1 ring-primary/30">
              <Trophy className="w-3.5 h-3.5 text-primary" />
            </div>
            <span className="text-[15px] font-bold text-foreground tracking-tight">
              LockLab<span className="text-primary">NBA</span>
            </span>
          </Link>

          <div className="flex items-center gap-0.5">
            <Link
              to="/alerts"
              className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                location.pathname === '/alerts'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              )}
            >
              <Bell className="w-4.5 h-4.5" />
            </Link>
            <Link
              to="/profile"
              className={cn(
                'w-9 h-9 rounded-xl flex items-center justify-center transition-all',
                location.pathname === '/profile'
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              )}
            >
              <User className="w-4.5 h-4.5" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}
