import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Lock, AlertTriangle, Award, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const propTypeLabels = {
  points: 'PTS', rebounds: 'REB', assists: 'AST', PRA: 'PRA', '3PM': '3PM',
  steals: 'STL', blocks: 'BLK', turnovers: 'TO'
};

const tierConfig = {
  A: { label: 'Tier A', emoji: '🔒', color: 'bg-primary/20 text-primary border-primary/30' },
  B: { label: 'Tier B', emoji: '📊', color: 'bg-accent/20 text-accent border-accent/30' },
  C: { label: 'Tier C', emoji: '📋', color: 'bg-muted text-muted-foreground border-border' },
};

const matchupColors = {
  elite: 'text-primary', favorable: 'text-chart-3', neutral: 'text-muted-foreground',
  tough: 'text-chart-5', elite_defense: 'text-destructive'
};

export default function PropCard({ prop, onAddToParlay }) {
  const tier = tierConfig[prop.confidence_tier] || tierConfig.C;
  const isPositiveEdge = prop.edge > 0;
  const oddsDisplay = (odds) => odds > 0 ? `+${odds}` : odds;

  return (
    <div className="group rounded-xl border border-border bg-card hover:border-primary/30 transition-all duration-300 hover:shadow-[0_0_20px_hsl(142,71%,45%,0.08)] overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-secondary overflow-hidden flex-shrink-0">
              <img src={prop.photo_url} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <Link to={`/trends?player=${encodeURIComponent(prop.player_name)}`} className="font-semibold text-sm text-foreground hover:text-primary transition-colors">
                {prop.player_name}
              </Link>
              <p className="text-xs text-muted-foreground">{prop.team} vs {prop.opponent} · {prop.position}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {prop.is_lock && <Lock className="w-3.5 h-3.5 text-primary" />}
            {prop.trap_warning && <AlertTriangle className="w-3.5 h-3.5 text-destructive" />}
            {prop.best_value && <Award className="w-3.5 h-3.5 text-chart-4" />}
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", tier.color)}>
              {tier.emoji} {tier.label}
            </Badge>
          </div>
        </div>

        {/* Prop Line */}
        <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-3">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{propTypeLabels[prop.prop_type] || prop.prop_type}</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{prop.line}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.preventDefault(); onAddToParlay?.(prop, 'over'); }}
              className="flex flex-col items-center bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg px-3 py-1.5 transition-all"
            >
              <span className="text-[10px] text-primary font-medium">OVER</span>
              <span className="text-sm font-bold text-primary">{oddsDisplay(prop.over_odds)}</span>
            </button>
            <button
              onClick={(e) => { e.preventDefault(); onAddToParlay?.(prop, 'under'); }}
              className="flex flex-col items-center bg-secondary hover:bg-secondary/80 border border-border rounded-lg px-3 py-1.5 transition-all"
            >
              <span className="text-[10px] text-muted-foreground font-medium">UNDER</span>
              <span className="text-sm font-bold text-foreground">{oddsDisplay(prop.under_odds)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Footer */}
      <div className="px-4 pb-3 grid grid-cols-3 gap-3">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase">Projection</p>
          <p className="text-sm font-semibold text-foreground">{prop.projection}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase">Edge</p>
          <p className={cn("text-sm font-semibold flex items-center gap-1", isPositiveEdge ? 'text-primary' : 'text-destructive')}>
            {isPositiveEdge ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {prop.edge > 0 ? '+' : ''}{prop.edge}%
          </p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase">Hit Rate</p>
          <p className="text-sm font-semibold text-foreground">{prop.hit_rate_last_10}%</p>
        </div>
      </div>

      {/* Streak */}
      {prop.streak_info && (
        <div className="px-4 pb-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            <Zap className="w-3 h-3 text-chart-4" />
            {prop.streak_info}
          </p>
        </div>
      )}

      {/* Matchup */}
      {prop.matchup_note && (
        <div className="px-4 pb-3 border-t border-border pt-3">
          <p className={cn("text-xs font-medium", matchupColors[prop.matchup_rating])}>
            {prop.matchup_note}
          </p>
        </div>
      )}
    </div>
  );
}