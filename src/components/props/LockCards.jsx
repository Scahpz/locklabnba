import React from 'react';
import { Lock, TrendingUp, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import TeamLogo from '@/components/common/TeamLogo';
import { useParlay } from '@/lib/ParlayContext';
import VerdictBadge from '@/components/props/VerdictBadge';

function fmtOdds(n) {
  if (n == null) return '—';
  return n > 0 ? `+${n}` : `${n}`;
}

function LockCard({ prop, aiVerdict, aiLoading }) {
  const { addLeg } = useParlay();

  return (
    <div className="rounded-xl border border-primary/40 bg-gradient-to-br from-primary/10 via-card to-card p-4 shadow-[0_0_30px_hsl(142,71%,45%,0.12)] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-primary" />
          <span className="text-xs font-bold text-primary uppercase tracking-wider">Lock of the Day</span>
        </div>
        <span className="text-[10px] text-muted-foreground bg-secondary rounded-md px-2 py-0.5">{prop.confidence_score}/10 confidence</span>
      </div>

      <div className="flex items-center gap-3">
        <TeamLogo team={prop.team} className="w-12 h-12" bgClass="bg-secondary border border-border" />
        <div>
          <p className="font-bold text-foreground">{prop.player_name}</p>
          <p className="text-xs text-muted-foreground">{prop.team} vs {prop.opponent}</p>
        </div>
      </div>

      <VerdictBadge verdict={aiVerdict?.verdict} ai_confidence={aiVerdict?.ai_confidence} loading={aiLoading && !aiVerdict} />
      {aiVerdict?.reason && (
        <p className="text-xs text-muted-foreground leading-snug">{aiVerdict.reason}</p>
      )}

      <div className="flex items-center justify-between bg-secondary/60 rounded-lg p-3">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase">{prop.prop_type}</p>
          <p className="text-xl font-bold text-foreground">Over {prop.line}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-primary">{fmtOdds(prop.over_odds)}</p>
          <p className="text-[10px] text-muted-foreground">{prop.hit_rate_last_10}% hit rate</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-secondary/40 rounded-lg p-2">
          <p className="text-[10px] text-muted-foreground">Projection</p>
          <p className="text-sm font-bold text-primary">{prop.projection}</p>
        </div>
        <div className="bg-secondary/40 rounded-lg p-2">
          <p className="text-[10px] text-muted-foreground">Edge</p>
          <p className="text-sm font-bold text-primary">+{prop.edge}%</p>
        </div>
        <div className="bg-secondary/40 rounded-lg p-2">
          <p className="text-[10px] text-muted-foreground">Avg L5</p>
          <p className="text-sm font-bold text-foreground">{prop.avg_last_5}</p>
        </div>
      </div>

      {prop.streak_info && (
        <p className="text-xs text-primary flex items-center gap-1.5">
          <Zap className="w-3 h-3" />
          {prop.streak_info}
        </p>
      )}

      <button
        onClick={() => addLeg(prop, 'over')}
        className="w-full py-2 rounded-lg bg-primary/20 hover:bg-primary/30 border border-primary/30 text-primary text-xs font-bold transition-all flex items-center justify-center gap-1.5"
      >
        <TrendingUp className="w-3.5 h-3.5" />
        Add to Parlay
      </button>
    </div>
  );
}

export default function LockCards({ locks, verdicts, aiLoading }) {
  if (!locks || locks.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Lock className="w-4 h-4 text-primary" />
        <h2 className="text-sm font-bold text-foreground uppercase tracking-wider">Lock{locks.length > 1 ? 's' : ''} of the Day</h2>
      </div>
      <div className={cn("grid gap-4", locks.length > 1 ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-2 lg:grid-cols-3")}>
        {locks.map((prop, i) => {
          const key = `${prop.player_name}__${prop.prop_type}__${prop.line}`;
          return (
            <LockCard
              key={i}
              prop={prop}
              aiVerdict={verdicts[key]}
              aiLoading={aiLoading}
            />
          );
        })}
      </div>
    </div>
  );
}