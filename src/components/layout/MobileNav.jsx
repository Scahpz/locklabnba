import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, Zap, Activity, Layers, GitCompare } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Props', icon: Zap },
  { path: '/trends', label: 'Trends', icon: TrendingUp },
  { path: '/compare', label: 'Compare', icon: GitCompare },
  { path: '/odds', label: 'Live Odds', icon: Activity },
  { path: '/parlay', label: 'Parlay', icon: Layers },
];

export default function MobileNav() {
  const location = useLocation();
  
  const currentLabel = navItems.find(item => item.path === location.pathname)?.label || 'Menu';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-xl border-t border-border md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-center justify-center px-4 py-3">
        <div className="flex items-center gap-2">
          {(() => {
            const current = navItems.find(item => item.path === location.pathname);
            const Icon = current?.icon;
            return (
              <>
                {Icon && <Icon className="w-4 h-4 text-primary" />}
                <p className="text-sm font-bold text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{currentLabel}</p>
              </>
            );
          })()}
        </div>
      </div>
    </nav>
  );
}