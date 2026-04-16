import React, { useState } from 'react';
import { useParlay } from '@/lib/ParlayContext';
import { useNavigate } from 'react-router-dom';
import { Layers, X, ChevronUp, ChevronDown, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import TeamLogo from '@/components/common/TeamLogo';

export default function MiniParlayBar() {
  const { legs, removeLeg, removeGameLeg, clearLegs } = useParlay();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  if (legs.length === 0) return null;

  function goToParlay() {
    navigate('/parlay');
  }

  return (
    <div className="fixed bottom-16 md:bottom-0 left-0 right-0 z-40 transition-all duration-300">
      {/* Expanded legs list */}
      {expanded && (
        <div className="bg-card border-t border-x border-border mx-2 md:mx-0 rounded-t-xl overflow-hidden shadow-2xl">
          <div className="p-3 max-h-56 overflow-y-auto space-y-1.5">
            {legs.map((leg, i) => (
              <div key={i} className="flex items-center gap-2 bg-secondary/60 rounded-lg px-3 py-2">
                <TeamLogo team={leg.team} className="w-6 h-6 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-foreground truncate">{leg.player_name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {leg.is_game_bet ? (
                      <span className="font-bold text-primary">{leg.prop_type.toUpperCase()} · {leg.odds > 0 ? '+' : ''}{leg.odds}</span>
                    ) : (
                      <>
                        <span className={cn("font-bold", leg.pick === 'over' ? 'text-primary' : 'text-foreground')}>
                          {leg.pick.toUpperCase()}
                        </span>
                        {' '}{leg.line} {leg.prop_type.toUpperCase()} · {leg.odds > 0 ? '+' : ''}{leg.odds}
                      </>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => leg.is_game_bet ? removeGameLeg(leg.leg_id) : removeLeg(leg.player_name, leg.prop_type)}
                  className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div
        className="bg-card border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.3)] flex items-center gap-3 px-4 py-3 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="flex items-center gap-2 flex-1">
          <div className="relative">
            <Layers className="w-5 h-5 text-accent" />
            <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {legs.length}
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-foreground leading-tight">My Parlay</p>
            <p className="text-[10px] text-muted-foreground">{legs.length} leg{legs.length !== 1 ? 's' : ''} selected</p>
          </div>
        </div>

        {/* Leg previews */}
        <div className="hidden sm:flex items-center gap-1.5 flex-1 overflow-hidden">
          {legs.slice(0, 3).map((leg, i) => (
            <div key={i} className="bg-secondary rounded-md px-2 py-1 text-[10px] text-muted-foreground whitespace-nowrap">
              {leg.is_game_bet ? (
                <span className="font-bold text-primary">{leg.player_name}</span>
              ) : (
                <>
                  <span className={cn("font-bold", leg.pick === 'over' ? 'text-primary' : 'text-foreground')}>
                    {leg.pick === 'over' ? 'O' : 'U'}
                  </span>
                  {' '}{leg.player_name.split(' ').pop()} {leg.line}
                </>
              )}
            </div>
          ))}
          {legs.length > 3 && <span className="text-[10px] text-muted-foreground">+{legs.length - 3} more</span>}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onPointerDown={(e) => { e.stopPropagation(); e.preventDefault(); clearLegs(); }}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1"
          >
            Clear
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); goToParlay(); }}
            className="flex items-center gap-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
          >
            Build <ArrowRight className="w-3.5 h-3.5" />
          </button>
          {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronUp className="w-4 h-4 text-muted-foreground" />}
        </div>
      </div>
    </div>
  );
}