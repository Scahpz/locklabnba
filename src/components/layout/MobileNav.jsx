import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, Zap, Activity, Layers, GitCompare } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Props', icon: Zap },
  { path: '/trends', label: 'Trends', icon: TrendingUp },
  { path: '/odds', label: 'Odds', icon: Activity },
  { path: '/compare', label: 'Compare', icon: GitCompare },
  { path: '/parlay', label: 'Parlay', icon: Layers },
];

export default function MobileNav() {
  const location = useLocation();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-xl border-t border-border md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch">
        {navItems.map(({ path, label, icon: Icon }) => {
          const active = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-2.5 transition-colors',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <Icon className={cn('w-5 h-5', active && 'drop-shadow-[0_0_6px_hsl(142,71%,45%,0.6)]')} />
              <span className={cn('text-[10px] font-medium leading-none', active ? 'text-primary' : 'text-muted-foreground')}>
                {label}
              </span>
              {active && (
                <span className="absolute bottom-0 w-8 h-0.5 bg-primary rounded-full" style={{ marginBottom: 'env(safe-area-inset-bottom)' }} />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
