import React from 'react';
import { Lock, Zap, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import TeamLogo from '@/components/common/TeamLogo';

export default function LockOfTheDay({ props }) {
  const locks = props.filter(p => p.is_lock);
  if (locks.length === 0) return null;
  const lock = locks[0];

  return (
    <div className="relative rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 via-card to-primary/5 p-5 overflow-hidden">
      {/* Glow effect */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-accent/10 rounded-full blur-3xl" />
      
      <div className="relative">
        <div className="flex items-center gap-2 mb-3">
          <Lock className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-bold text-primary uppercase tracking-wider">Lock of the Day</h3>
        </div>

        <div className="flex items-center gap-4">
          <TeamLogo team={lock.team} className="w-14 h-14" />
          <div className="flex-1">
            <h4 className="text-lg font-bold text-foreground">{lock.player_name}</h4>
            <p className="text-sm text-muted-foreground">{lock.team} vs {lock.opponent}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground uppercase">{lock.prop_type}</p>
            <p className="text-2xl font-bold text-foreground">O {lock.line}</p>
            <p className="text-xs text-primary font-semibold">{lock.over_odds > 0 ? '+' : ''}{lock.over_odds}</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-secondary/50 rounded-lg p-2.5 text-center">
            <p className="text-xs text-muted-foreground">Confidence</p>
            <p className="text-lg font-bold text-primary">{lock.confidence_score}/10</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-2.5 text-center">
            <p className="text-xs text-muted-foreground">Avg L5</p>
            <p className="text-lg font-bold text-foreground">{lock.avg_last_5}</p>
          </div>
          <div className="bg-secondary/50 rounded-lg p-2.5 text-center">
            <p className="text-xs text-muted-foreground">Hit Rate</p>
            <p className="text-lg font-bold text-foreground">{lock.hit_rate_last_10}%</p>
          </div>
        </div>

        {lock.streak_info && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-primary font-medium">
            <Zap className="w-3.5 h-3.5" />
            {lock.streak_info}
          </div>
        )}
      </div>
    </div>
  );
}