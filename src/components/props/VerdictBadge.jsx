import React from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VerdictBadge({ verdict, ai_confidence, loading, isPickOfDay }) {
  if (loading) {
    return (
      <div className="flex items-center gap-1.5 bg-secondary/60 rounded-lg px-3 py-1.5">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Analyzing…</span>
      </div>
    );
  }

  if (!verdict) return null;

  const configs = {
    OVER: {
      icon: TrendingUp,
      label: 'AI: OVER',
      className: 'bg-primary/15 border border-primary/40 text-primary',
    },
    UNDER: {
      icon: TrendingDown,
      label: 'AI: UNDER',
      className: 'bg-destructive/15 border border-destructive/40 text-destructive',
    },
    UNSAFE: {
      icon: AlertTriangle,
      label: 'AI: UNSAFE',
      className: 'bg-chart-4/15 border border-chart-4/40 text-chart-4',
    },
  };

  const cfg = configs[verdict] || configs.UNSAFE;
  const Icon = cfg.icon;

  return (
    <div className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5', cfg.className)}>
      <Icon className="w-3.5 h-3.5" />
      <span className="text-xs font-bold">{cfg.label}</span>
      {(ai_confidence != null || isPickOfDay) && (
        <span className="text-[10px] opacity-70 ml-0.5">{isPickOfDay ? 100 : ai_confidence}%</span>
      )}
    </div>
  );
}