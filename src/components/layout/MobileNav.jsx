import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, Zap, Activity, Shield, Layers, GitCompare } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Props', icon: Zap },
  { path: '/trends', label: 'Trends', icon: TrendingUp },
  { path: '/matchups', label: 'Matchups', icon: Shield },
  { path: '/compare', label: 'Compare', icon: GitCompare },
  { path: '/odds', label: 'Live Odds', icon: Activity },
  { path: '/parlay', label: 'Parlay', icon: Layers },
];

export default function MobileNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-xl border-t border-border md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div
        className="flex items-center gap-1 px-3 py-3 overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-2 flex-shrink-0 px-4 py-3 rounded-full transition-all duration-200",
                isActive
                  ? "bg-primary/15 text-primary border border-primary/25"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", isActive && "drop-shadow-[0_0_6px_hsl(142,71%,45%)]")} />
              {isActive && (
                <span className="text-sm font-semibold whitespace-nowrap">{item.label}</span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}