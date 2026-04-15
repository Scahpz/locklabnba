import React from 'react';
import { TrendingUp, Target, Flame, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAllProps } from '@/lib/mockData';

export default function StatsOverview() {
  const props = getAllProps();

  const topPicks = props.filter(p => p.is_top_pick).length;
  const avgHitRate = props.length > 0
    ? Math.round(props.reduce((acc, p) => acc + (p.hit_rate_last_10 || 0), 0) / props.length)
    : 0;
  const locks = props.filter(p => p.is_lock).length;
  const traps = props.filter(p => p.trap_warning).length;

  const stats = [
    { label: 'Top Picks Today', value: String(topPicks), icon: Flame, color: 'text-primary', bg: 'bg-primary/10', glow: 'shadow-[0_0_20px_hsl(142,71%,45%,0.15)]' },
    { label: 'Avg Hit Rate', value: `${avgHitRate}%`, icon: Target, color: 'text-chart-3', bg: 'bg-chart-3/10', glow: 'shadow-[0_0_20px_hsl(199,89%,48%,0.15)]' },
    { label: 'Locks of Day', value: String(locks), icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/10', glow: 'shadow-[0_0_20px_hsl(263,70%,58%,0.15)]' },
    { label: 'Trap Warnings', value: String(traps), icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', glow: 'shadow-[0_0_20px_hsl(0,84%,60%,0.15)]' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className={cn(
            "rounded-xl border border-border bg-card p-4 transition-all duration-300 hover:scale-[1.02]",
            stat.glow
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={cn("p-2 rounded-lg", stat.bg)}>
              <stat.icon className={cn("w-4 h-4", stat.color)} />
            </div>
          </div>
          <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}