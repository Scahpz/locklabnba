import React from 'react';
import { Flame, TrendingUp, Zap, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import TeamLogo from '@/components/common/TeamLogo';
import { useParlay } from '@/lib/ParlayContext';
import { Link } from 'react-router-dom';

function fmtOdds(n) {
  if (n == null) return '—';
  return n > 0 ? `+${n}` : `${n}`;
}

const propTypeLabels = {
  points: 'PTS', rebounds: 'REB', assists: 'AST', PRA: 'PRA',
  '3PM': '3PM', steals: 'STL', blocks: 'BLK',
  'P+R': 'P+R', 'P+A': 'P+A', 'A+R': 'A+R',
};

export default function DemonPickCard({ pick, onOpenDetail }) {
  const { addLeg, isSelected } = useParlay();
  if (!pick) return null;

  const { prop, reason, coldStreakLen, seasonAvg, boomLine, boomScore } = pick;
  const label = propTypeLabels[prop.prop_type] || prop.prop_type.toUpperCase();
  const picked = isSelected(prop.player_name, prop.prop_type, 'over');

  return (
    <div className="relative rounded-xl border border-orange-500/40 bg-card overflow-hidden shadow-[0_0_24px_hsl(25,100%,50%,0.12)]">
      {/* Gradient header bar */}
      <div className="h-1 w-full bg-gradient-to-r from-orange-600 via-red-500 to-orange-400" />

      <div className="p-4">
        {/* Title row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-orange-500/15 border border-orange-500/30">
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400">Demon Pick</p>
              <p className="text-[9px] text-muted-foreground">Explosion Alert</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-orange-400/70" />
            <span className="text-[10px] text-orange-400/80 font-medium">HIGH UPSIDE</span>
          </div>
        </div>

        {/* Player row */}
        <div className="flex items-center gap-3 mb-3">
          <TeamLogo team={prop.team} className="w-10 h-10" />
          <div className="flex-1 min-w-0">
            <Link
              to={`/trends?player=${encodeURIComponent(prop.player_name)}`}
              className="font-bold text-sm text-foreground hover:text-orange-400 transition-colors"
            >
              {prop.player_name}
            </Link>
            <p className="text-[10px] text-muted-foreground">{prop.team} vs {prop.opponent} · {prop.position}</p>
          </div>
          {/* Boom score badge */}
          <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-orange-500/10 border border-orange-500/25">
            <p className="text-base font-black text-orange-400">{boomScore}</p>
            <p className="text-[8px] text-orange-400/70 uppercase leading-none">Boom</p>
          </div>
        </div>

        {/* Demon line + bet */}
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-lg p-3 mb-3">
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-[9px] text-orange-400/80 font-bold uppercase tracking-wider mb-0.5">Demon Line</p>
              <p className="text-3xl font-black text-orange-400 leading-none">{boomLine}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] text-muted-foreground uppercase mb-0.5">Book Line</p>
              <p className="text-lg font-bold text-muted-foreground line-through">{prop.line}</p>
            </div>
          </div>
          <button
            onClick={() => addLeg({ ...prop, line: boomLine }, 'over')}
            className={cn(
              "w-full flex items-center justify-center gap-2 border rounded-lg py-2 transition-all",
              picked
                ? "bg-orange-500 border-orange-500 text-white"
                : "bg-orange-500/15 hover:bg-orange-500/25 border-orange-500/30 text-orange-400"
            )}
          >
            <span className="text-xs font-bold">OVER {boomLine}</span>
            <span className="text-sm font-black">{fmtOdds(prop.over_odds)}</span>
          </button>
        </div>

        {/* Why they'll explode */}
        <div className="bg-secondary/50 rounded-lg p-3 mb-3 space-y-1.5">
          <div className="flex items-center gap-1.5 mb-1">
            <Zap className="w-3 h-3 text-orange-400" />
            <p className="text-[10px] font-bold uppercase tracking-wider text-orange-400">Why They'll Explode</p>
          </div>
          <p className="text-xs text-foreground leading-snug">{reason}</p>
        </div>

        {/* Stat pills */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center bg-secondary/40 rounded-lg py-2">
            <p className="text-[9px] text-muted-foreground uppercase">L10 Avg</p>
            <p className={cn("text-sm font-bold", (prop.avg_last_10 || 0) > prop.line ? 'text-primary' : 'text-destructive')}>
              {prop.avg_last_10 ?? '—'}
            </p>
          </div>
          <div className="text-center bg-secondary/40 rounded-lg py-2">
            <p className="text-[9px] text-muted-foreground uppercase">Season</p>
            <p className={cn("text-sm font-bold", (seasonAvg || 0) > prop.line ? 'text-primary' : 'text-muted-foreground')}>
              {seasonAvg ?? '—'}
            </p>
          </div>
          <div className="text-center bg-orange-500/10 border border-orange-500/20 rounded-lg py-2">
            <p className="text-[9px] text-orange-400/80 uppercase">Cold Streak</p>
            <p className="text-sm font-bold text-orange-400">{coldStreakLen > 0 ? `${coldStreakLen}G Under` : 'Slumping'}</p>
          </div>
        </div>

        <button
          onClick={onOpenDetail}
          className="w-full text-xs text-orange-400/70 hover:text-orange-400 border border-orange-500/20 hover:border-orange-500/40 rounded-lg py-2 transition-all bg-orange-500/5 hover:bg-orange-500/10 font-medium flex items-center justify-center gap-1"
        >
          Full Analysis <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
