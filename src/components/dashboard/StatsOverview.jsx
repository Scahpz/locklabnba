import React from 'react';
import { TrendingUp, Target, Flame, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

const stats = [
  { label: 'Top Picks Today', value: '8', icon: Flame, color: 'text-primary', bg: 'bg-primary/10', glow: 'shadow-[0_0_20px_hsl(142,71%,45%,0.15)]' },
  { label: 'Avg Hit Rate', value: '72%', icon: Target, color: 'text-chart-3', bg: 'bg-chart-3/10', glow: 'shadow-[0_0_20px_hsl(199,89%,48%,0.15)]' },
  { label: 'Locks of Day', value: '3', icon: TrendingUp, color: 'text-accent', bg: 'bg-accent/10', glow: 'shadow-[0_0_20px_hsl(263,70%,58%,0.15)]' },
  { label: 'Trap Warnings', value: '2', icon: AlertTriangle, color: 'text-destructive', bg: 'bg-destructive/10', glow: 'shadow-[0_0_20px_hsl(0,84%,60%,0.15)]' },
];

export default function StatsOverview() {
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