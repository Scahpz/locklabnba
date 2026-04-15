import React from 'react';
import { Clock, Activity, Gauge, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

const matchupColors = {
  elite: 'text-primary bg-primary/10',
  favorable: 'text-chart-3 bg-chart-3/10',
  neutral: 'text-muted-foreground bg-secondary',
  tough: 'text-chart-5 bg-chart-5/10',
  elite_defense: 'text-destructive bg-destructive/10',
};

export default function CompareColumn({ player }) {
  const firstProp = player.props[0];

  const stats = [
    { icon: Clock, label: 'Min/G', value: firstProp?.minutes_avg ?? '—', color: 'text-chart-3' },
    { icon: Activity, label: 'Usage', value: firstProp?.usage_rate ? `${firstProp.usage_rate}%` : '—', color: 'text-accent' },
    { icon: Gauge, label: 'Pace', value: firstProp?.pace_rating ?? '—', color: 'text-chart-4' },
    { icon: Target, label: 'O/U', value: firstProp?.game_total ?? '—', color: 'text-primary' },
  ];

  const matchupKey = firstProp?.matchup_rating || 'neutral';

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {stats.map(s => (
          <div key={s.label} className="bg-secondary/50 rounded-lg p-2.5 text-center">
            <s.icon className={cn('w-3.5 h-3.5 mx-auto mb-1', s.color)} />
            <p className="text-sm font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
          </div>
        ))}
      </div>

      {firstProp?.matchup_note && (
        <div className={cn('rounded-lg px-3 py-2 text-xs font-medium', matchupColors[matchupKey])}>
          {firstProp.matchup_note}
        </div>
      )}
    </div>
  );
}