import React, { useState, useEffect } from 'react';
import { getAllProps } from '@/lib/mockData';
import { fetchLiveProps } from '@/lib/liveData';
import { Badge } from '@/components/ui/badge';
import { Lock, Zap, Shield, AlertTriangle, Award, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import TeamLogo from '@/components/common/TeamLogo';

const tierConfig = {
  A: { label: 'Tier A — High Confidence', emoji: '🔒', color: 'border-primary/40 bg-primary/5', badge: 'bg-primary/20 text-primary border-primary/30', glow: 'shadow-[0_0_15px_hsl(142,71%,45%,0.1)]' },
  B: { label: 'Tier B — Solid Value', emoji: '📊', color: 'border-accent/40 bg-accent/5', badge: 'bg-accent/20 text-accent border-accent/30', glow: 'shadow-[0_0_15px_hsl(263,70%,58%,0.1)]' },
  C: { label: 'Tier C — Speculative', emoji: '📋', color: 'border-border bg-card', badge: 'bg-muted text-muted-foreground border-border', glow: '' },
};

function PickCard({ prop }) {
  const tier = tierConfig[prop.confidence_tier] || tierConfig.C;
  const oddsDisplay = (odds) => odds > 0 ? `+${odds}` : odds;

  return (
    <div className={cn("rounded-xl border p-4 transition-all duration-300 hover:scale-[1.01]", tier.color, tier.glow)}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <TeamLogo team={prop.team} className="w-10 h-10" />
          <div>
            <Link to={`/trends?player=${encodeURIComponent(prop.player_name)}`} className="font-semibold text-sm text-foreground hover:text-primary transition-colors">
              {prop.player_name}
            </Link>
            <p className="text-xs text-muted-foreground">{prop.team} vs {prop.opponent}</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {prop.is_lock && <Lock className="w-3.5 h-3.5 text-primary" />}
          {prop.best_value && <Award className="w-3.5 h-3.5 text-chart-4" />}
          {prop.trap_warning && <AlertTriangle className="w-3.5 h-3.5 text-destructive" />}
        </div>
      </div>

      <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-3 mb-3">
        <div>
          <p className="text-xs text-muted-foreground uppercase">{prop.prop_type}</p>
          <p className="text-xl font-bold text-foreground">Over {prop.line}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-primary">{oddsDisplay(prop.over_odds)}</p>
          <div className="flex items-center gap-1 mt-1">
            <div className="flex gap-0.5">
              {Array.from({ length: 10 }, (_, i) => (
                <div key={i} className={cn("w-1.5 h-4 rounded-sm", i < prop.confidence_score ? "bg-primary" : "bg-secondary")} />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground ml-1">{prop.confidence_score}/10</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-secondary/30 rounded-lg p-2">
          <p className="text-[10px] text-muted-foreground">Projection</p>
          <p className="text-sm font-bold text-foreground">{prop.projection}</p>
        </div>
        <div className="bg-secondary/30 rounded-lg p-2">
          <p className="text-[10px] text-muted-foreground">Edge</p>
          <p className="text-sm font-bold text-primary">+{prop.edge}%</p>
        </div>
        <div className="bg-secondary/30 rounded-lg p-2">
          <p className="text-[10px] text-muted-foreground">Hit Rate</p>
          <p className="text-sm font-bold text-foreground">{prop.hit_rate_last_10}%</p>
        </div>
      </div>

      {prop.matchup_note && (
        <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1.5">
          <Shield className="w-3 h-3 text-chart-3" />
          {prop.matchup_note}
        </p>
      )}
    </div>
  );
}

export default function AIPicks() {
  const [allProps, setAllProps] = useState(getAllProps());
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchLiveProps();
        if (data?.props?.length > 0) {
          setAllProps(data.props);
          setIsLive(true);
        }
      } catch {}
    }
    load();
  }, []);

  const tiers = { A: [], B: [], C: [] };
  allProps
    .filter(p => p.injury_status !== 'out' && (p.is_top_pick || p.confidence_score >= 6))
    .sort((a, b) => b.confidence_score - a.confidence_score)
    .forEach(p => {
      if (tiers[p.confidence_tier]) tiers[p.confidence_tier].push(p);
    });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Zap className="w-7 h-7 text-primary" />
            AI Pick Recommendations
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            {isLive ? <><Wifi className="w-3.5 h-3.5 text-primary" /><span className="text-primary font-medium">Live — today's players only</span></> : <><WifiOff className="w-3.5 h-3.5" />Sample data</>}
          </p>
        </div>
      </div>

      {Object.entries(tiers).map(([tier, props]) => {
        if (props.length === 0) return null;
        const config = tierConfig[tier];
        return (
          <div key={tier}>
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className={cn("text-xs", config.badge)}>
                {config.emoji} {config.label}
              </Badge>
              <span className="text-xs text-muted-foreground">({props.length} picks)</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {props.map((prop, i) => (
                <PickCard key={`${prop.player_name}-${prop.prop_type}-${i}`} prop={prop} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}