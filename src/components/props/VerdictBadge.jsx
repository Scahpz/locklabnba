import React from 'react';
import { TrendingUp, TrendingDown, BarChart2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function VerdictBadge({ verdict, ai_confidence, dataQuality, loading, isPickOfDay }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 bg-white/5 rounded-xl px-3 py-2 w-fit">
        <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium">Analyzing…</span>
      </div>
    );
  }

  if (!verdict) return null;

  const isMarket = dataQuality === 'market';
  const conf = isPickOfDay ? 100 : ai_confidence;

  const configs = {
    OVER: {
      icon: TrendingUp,
      label: isMarket ? 'Market: OVER' : 'Take the OVER',
      className: isMarket
        ? 'bg-primary/8 border border-primary/15 text-primary/60'
        : 'bg-primary/12 border border-primary/30 text-primary',
      barColor: 'bg-primary',
    },
    UNDER: {
      icon: TrendingDown,
      label: isMarket ? 'Market: UNDER' : 'Take the UNDER',
      className: isMarket
        ? 'bg-destructive/8 border border-destructive/15 text-destructive/60'
        : 'bg-destructive/12 border border-destructive/30 text-destructive',
      barColor: 'bg-destructive',
    },
    UNSAFE: {
      icon: BarChart2,
      label: 'No Clear Edge',
      className: 'bg-chart-4/10 border border-chart-4/25 text-chart-4',
      barColor: 'bg-chart-4',
    },
  };

  const cfg = configs[verdict] || configs.UNSAFE;
  const Icon = cfg.icon;

  return (
    <div className={cn('flex items-center gap-2 rounded-xl px-3 py-2 w-fit', cfg.className)}>
      <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      <span className="text-xs font-bold tracking-wide">{cfg.label}</span>
      {conf != null && (
        <span className="text-[11px] font-semibold opacity-75 ml-0.5">
          {conf}%{isMarket && <i className="font-normal not-italic opacity-70"> est.</i>}
        </span>
      )}
    </div>
  );
}
