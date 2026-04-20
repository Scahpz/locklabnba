import React from 'react';
import { TrendingUp, TrendingDown, BarChart2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VerdictBadge({ verdict, ai_confidence, dataQuality, loading, isPickOfDay }) {
  if (loading) {
    return (
      <div className="flex items-center gap-1.5 bg-secondary/60 rounded-lg px-3 py-1.5">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Analyzing…</span>
      </div>
    );
  }

  if (!verdict) return null;

  const isMarket = dataQuality === 'market';

  const configs = {
    OVER: {
      icon: TrendingUp,
      label: isMarket ? 'Market: OVER' : 'Take the OVER',
      className: isMarket
        ? 'bg-primary/10 border border-primary/20 text-primary/70'
        : 'bg-primary/15 border border-primary/40 text-primary',
    },
    UNDER: {
      icon: TrendingDown,
      label: isMarket ? 'Market: UNDER' : 'Take the UNDER',
      className: isMarket
        ? 'bg-destructive/10 border border-destructive/20 text-destructive/70'
        : 'bg-destructive/15 border border-destructive/40 text-destructive',
    },
    UNSAFE: {
      icon: BarChart2,
      label: 'No Clear Edge',
      className: 'bg-chart-4/15 border border-chart-4/40 text-chart-4',
    },
  };

  const cfg = configs[verdict] || configs.UNSAFE;
  const Icon = cfg.icon;
  const conf = isPickOfDay ? 100 : ai_confidence;

  return (
    <div className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 w-fit', cfg.className)}>
      <Icon className="w-3.5 h-3.5" />
      <span className="text-xs font-bold">{cfg.label}</span>
      {conf != null && (
        <span className="text-[10px] ml-0.5 opacity-80">
          {conf}%{isMarket && <i> est.</i>}
        </span>
      )}
    </div>
  );
}
