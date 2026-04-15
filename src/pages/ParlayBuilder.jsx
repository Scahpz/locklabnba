import React, { useState } from 'react';
import { getAllProps } from '@/lib/mockData';
import { Layers, Plus, X, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import TeamLogo from '@/components/common/TeamLogo';
import { useParlay } from '@/lib/ParlayContext';

function calculateCombinedOdds(legs) {
  if (legs.length === 0) return 0;
  let decimal = 1;
  legs.forEach(leg => {
    const odds = leg.odds;
    if (odds > 0) decimal *= (1 + odds / 100);
    else decimal *= (1 + 100 / Math.abs(odds));
  });
  return decimal > 2 ? `+${Math.round((decimal - 1) * 100)}` : `-${Math.round(100 / (decimal - 1))}`;
}

function getRiskLevel(legs) {
  if (legs.length <= 2) return 'low';
  if (legs.length <= 4) return 'medium';
  if (legs.length <= 6) return 'high';
  return 'extreme';
}

const riskColors = {
  low: 'text-primary bg-primary/10 border-primary/20',
  medium: 'text-chart-3 bg-chart-3/10 border-chart-3/20',
  high: 'text-chart-4 bg-chart-4/10 border-chart-4/20',
  extreme: 'text-destructive bg-destructive/10 border-destructive/20',
};

export default function ParlayBuilder() {
  const { legs, addLeg: contextAddLeg, removeLeg: contextRemoveLeg, clearLegs } = useParlay();
  const [wager, setWager] = useState(10);
  const allProps = getAllProps();

  const addLeg = (prop, pick) => {
    contextAddLeg(prop, pick);
  };

  const removeLeg = (index) => {
    const leg = legs[index];
    if (leg) contextRemoveLeg(leg.player_name, leg.prop_type);
  };

  const combinedOdds = calculateCombinedOdds(legs);
  const riskLevel = getRiskLevel(legs);
  const payout = (() => {
    if (legs.length === 0) return 0;
    const odds = typeof combinedOdds === 'string' ? parseInt(combinedOdds) : combinedOdds;
    if (odds > 0) return (wager * odds / 100 + wager).toFixed(2);
    return (wager * 100 / Math.abs(odds) + wager).toFixed(2);
  })();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
          <Layers className="w-7 h-7 text-accent" />
          Parlay Builder
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Build custom parlays and track risk</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Parlay Slip */}
        <div className="lg:col-span-1">
          <div className="rounded-xl border border-border bg-card p-4 sticky top-4">
            <h3 className="font-bold text-foreground mb-3">Your Parlay</h3>
            
            {legs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Layers className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Add props to build your parlay</p>
              </div>
            ) : (
              <div className="space-y-2 mb-4">
                {legs.map((leg, i) => (
                  <div key={i} className="flex items-center justify-between bg-secondary/50 rounded-lg p-2.5">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <TeamLogo team={leg.team} className="w-7 h-7" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-foreground truncate">{leg.player_name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {leg.pick.toUpperCase()} {leg.line} {leg.prop_type.toUpperCase()} ({leg.odds > 0 ? '+' : ''}{leg.odds})
                        </p>
                      </div>
                    </div>
                    <button onClick={() => removeLeg(i)} className="text-muted-foreground hover:text-destructive transition-colors ml-2">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {legs.length > 0 && (
              <>
                <div className="border-t border-border pt-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Combined Odds</span>
                    <span className="font-bold text-foreground">{combinedOdds}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Risk Level</span>
                    <Badge variant="outline" className={cn("text-[10px]", riskColors[riskLevel])}>
                      {riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground block mb-1">Wager ($)</label>
                    <Input
                      type="number"
                      value={wager}
                      onChange={(e) => setWager(parseFloat(e.target.value) || 0)}
                      className="h-8 bg-secondary border-border text-sm"
                    />
                  </div>
                  <div className="flex items-center justify-between bg-primary/10 rounded-lg p-3">
                    <span className="text-xs text-primary font-medium">Potential Payout</span>
                    <span className="text-lg font-bold text-primary">${payout}</span>
                  </div>
                </div>
              </>
            )}

            <Button
              className="w-full mt-3 bg-accent hover:bg-accent/80 text-accent-foreground"
              onClick={() => {}}
            >
              <Plus className="w-4 h-4 mr-2" /> Add Prop
            </Button>
          </div>
        </div>

        {/* Prop Picker */}
        <div className="lg:col-span-2">
          <h3 className="font-bold text-foreground mb-3">Available Props</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {allProps.map((prop, i) => {
              const isInParlay = legs.some(l => l.player_name === prop.player_name && l.prop_type === prop.prop_type);
              return (
                <div key={i} className={cn(
                  "rounded-xl border bg-card p-3 transition-all",
                  isInParlay ? "border-primary/40 bg-primary/5" : "border-border hover:border-primary/20"
                )}>
                  <div className="flex items-center gap-2 mb-2">
                    <TeamLogo team={prop.team} className="w-8 h-8" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{prop.player_name}</p>
                      <p className="text-[10px] text-muted-foreground">{prop.team} vs {prop.opponent} · {prop.prop_type.toUpperCase()}</p>
                    </div>
                    {isInParlay && <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground flex-1">Line: {prop.line}</span>
                    <button
                      onClick={() => addLeg(prop, 'over')}
                      disabled={isInParlay}
                      className="text-xs bg-primary/10 hover:bg-primary/20 text-primary px-2.5 py-1 rounded-md transition-all disabled:opacity-30"
                    >
                      O {prop.over_odds > 0 ? '+' : ''}{prop.over_odds}
                    </button>
                    <button
                      onClick={() => addLeg(prop, 'under')}
                      disabled={isInParlay}
                      className="text-xs bg-secondary hover:bg-secondary/80 text-foreground px-2.5 py-1 rounded-md transition-all disabled:opacity-30"
                    >
                      U {prop.under_odds > 0 ? '+' : ''}{prop.under_odds}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}