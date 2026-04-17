import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, Zap, Activity, Layers, GitCompare, Menu, X } from 'lucide-react';
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
  const [menuOpen, setMenuOpen] = useState(false);
  
  const currentLabel = navItems.find(item => item.path === location.pathname)?.label || 'Menu';

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/98 backdrop-blur-xl border-t border-border md:hidden" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {/* Menu Panel (slides up) */}
      {menuOpen && (
        <div className="absolute bottom-full left-0 right-0 bg-card border-t border-border rounded-t-xl">
          <div className="p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <item.icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Bar */}
      <div className="flex items-center justify-between px-4 py-3 gap-3">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
        >
          {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
        
        <div className="flex-1 text-center">
          {(() => {
            const current = navItems.find(item => item.path === location.pathname);
            const Icon = current?.icon;
            return (
              <div className="flex items-center justify-center gap-2">
                {Icon && <Icon className="w-4 h-4 text-primary" />}
                <p className="text-sm font-bold text-foreground bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{currentLabel}</p>
              </div>
            );
          })()}
        </div>
        
        <div className="w-6" />
      </div>
    </nav>
  );
}