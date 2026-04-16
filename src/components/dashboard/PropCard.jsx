import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, Lock, AlertTriangle, Award, Zap, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { Link } from 'react-router-dom';
import TeamLogo from '@/components/common/TeamLogo';
import { useParlay } from '@/lib/ParlayContext';

function fmtOdds(n) {
  if (n == null) return '—';
  return n > 0 ? `+${n}` : `${n}`;
}

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

export default function PropCard({ prop }) {
  const { addLeg, isSelected } = useParlay();
  const [showBooks, setShowBooks] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null); // null = use primary

  const tier = tierConfig[prop.confidence_tier] || tierConfig.C;
  const isPositiveEdge = prop.edge > 0;
  const hasBooks = prop.all_books?.length > 1;

  // Active book for odds display
  const activeBook = selectedBook
    ? prop.all_books?.find(b => b.key === selectedBook)
    : null;

  const displayOverOdds = activeBook?.over_odds ?? prop.over_odds;
  const displayUnderOdds = activeBook?.under_odds ?? prop.under_odds;
  const displayLine = activeBook?.line ?? prop.line;

  // Best/worst over odds among books (higher = better for bettor)
  const overOddsValues = (prop.all_books || []).map(b => b.over_odds).filter(v => v != null);
  const underOddsValues = (prop.all_books || []).map(b => b.under_odds).filter(v => v != null);
  const bestOverOdds = overOddsValues.length ? Math.max(...overOddsValues) : null;
  const worstOverOdds = overOddsValues.length ? Math.min(...overOddsValues) : null;
  const bestUnderOdds = underOddsValues.length ? Math.max(...underOddsValues) : null;
  const worstUnderOdds = underOddsValues.length ? Math.min(...underOddsValues) : null;

  const handlePick = (pick) => {
    // Build enriched prop with active book's odds
    const enrichedProp = {
      ...prop,
      over_odds: displayOverOdds,
      under_odds: displayUnderOdds,
      line: displayLine,
      bookmaker: activeBook?.title ?? prop.bookmaker,
    };
    addLeg(enrichedProp, pick);
  };

  return (
    <div className="group rounded-xl border border-border bg-card hover:border-primary/30 transition-all duration-300 hover:shadow-[0_0_20px_hsl(142,71%,45%,0.08)] overflow-hidden">
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <TeamLogo team={prop.team} className="w-10 h-10" />
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

        {/* Data source badge */}
        {prop.data_source && (
          <div className={cn(
            "mb-2 flex items-center gap-1.5 text-[10px] rounded-md px-2 py-1 w-fit",
            prop.data_source === 'real'
              ? "text-primary bg-primary/10"
              : "text-muted-foreground bg-secondary/60"
          )}>
            <span className={cn("w-1.5 h-1.5 rounded-full", prop.data_source === 'real' ? "bg-primary" : "bg-muted-foreground")} />
            {prop.data_source === 'real' ? 'Real stats' : 'Estimated stats'}
          </div>
        )}

        {/* Active book indicator */}
        {activeBook && (
          <div className="mb-2 flex items-center gap-1.5 text-[10px] text-primary bg-primary/10 rounded-md px-2 py-1 w-fit">
            <Check className="w-3 h-3" />
            Using {activeBook.title}
          </div>
        )}

        {/* Prop Line */}
        <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-3">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{propTypeLabels[prop.prop_type] || prop.prop_type}</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{displayLine}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={(e) => { e.preventDefault(); handlePick('over'); }}
              className={cn(
                "flex flex-col items-center border rounded-lg px-3 py-1.5 transition-all",
                isSelected(prop.player_name, prop.prop_type, 'over')
                  ? "bg-primary border-primary text-primary-foreground"
                  : isPositiveEdge
                  ? "bg-primary/10 hover:bg-primary/20 border-primary/20"
                  : "bg-secondary hover:bg-secondary/80 border-border"
              )}
            >
              <span className={cn("text-[10px] font-medium", isSelected(prop.player_name, prop.prop_type, 'over') ? 'text-primary-foreground' : isPositiveEdge ? 'text-primary' : 'text-muted-foreground')}>OVER</span>
              <span className={cn("text-sm font-bold", isSelected(prop.player_name, prop.prop_type, 'over') ? 'text-primary-foreground' : isPositiveEdge ? 'text-primary' : 'text-muted-foreground')}>{fmtOdds(displayOverOdds)}</span>
            </button>
            <button
              onClick={(e) => { e.preventDefault(); handlePick('under'); }}
              className={cn(
                "flex flex-col items-center border rounded-lg px-3 py-1.5 transition-all",
                isSelected(prop.player_name, prop.prop_type, 'under')
                  ? "bg-destructive border-destructive text-destructive-foreground"
                  : !isPositiveEdge
                  ? "bg-destructive/10 hover:bg-destructive/20 border-destructive/20"
                  : "bg-secondary hover:bg-secondary/80 border-border"
              )}
            >
              <span className={cn("text-[10px] font-medium", isSelected(prop.player_name, prop.prop_type, 'under') ? 'text-destructive-foreground' : !isPositiveEdge ? 'text-destructive' : 'text-muted-foreground')}>UNDER</span>
              <span className={cn("text-sm font-bold", isSelected(prop.player_name, prop.prop_type, 'under') ? 'text-destructive-foreground' : !isPositiveEdge ? 'text-destructive' : 'text-muted-foreground')}>{fmtOdds(displayUnderOdds)}</span>
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

      {/* Book comparison */}
      {hasBooks && (
        <div className="border-t border-border">
          <button
            onClick={() => setShowBooks(s => !s)}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {showBooks ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showBooks ? 'Hide' : 'Compare'} {prop.all_books.length} books
          </button>
          {showBooks && (
            <div className="px-4 pb-3 space-y-1.5">
              <div className="grid grid-cols-5 text-[9px] text-muted-foreground uppercase tracking-wider mb-1 px-1">
                <span className="col-span-2">Book</span>
                <span className="text-center">Line</span>
                <span className="text-center">Over</span>
                <span className="text-center">Under</span>
              </div>
              {prop.all_books.map(b => {
                const isActive = selectedBook === b.key || (!selectedBook && b.key === prop.all_books[0]?.key);
                const isBestOver = b.over_odds === bestOverOdds;
                const isWorstOver = b.over_odds === worstOverOdds && worstOverOdds !== bestOverOdds;
                const isBestUnder = b.under_odds === bestUnderOdds;
                const isWorstUnder = b.under_odds === worstUnderOdds && worstUnderOdds !== bestUnderOdds;

                return (
                  <button
                    key={b.key}
                    onClick={() => setSelectedBook(selectedBook === b.key ? null : b.key)}
                    className={cn(
                      "w-full grid grid-cols-5 text-xs rounded-lg px-3 py-1.5 items-center transition-all text-left",
                      isActive ? "bg-primary/15 border border-primary/30" : "bg-secondary/40 hover:bg-secondary/70"
                    )}
                  >
                    <span className={cn("col-span-2 text-[10px] truncate font-medium", isActive ? "text-primary" : "text-muted-foreground")}>
                      {isActive && <Check className="w-2.5 h-2.5 inline mr-1" />}
                      {b.title}
                    </span>
                    <span className="text-center font-mono text-foreground">{b.line ?? '—'}</span>
                    <span className={cn("text-center font-mono font-bold",
                      isBestOver ? "text-primary" : isWorstOver ? "text-destructive" : "text-foreground"
                    )}>{fmtOdds(b.over_odds)}</span>
                    <span className={cn("text-center font-mono font-bold",
                      isBestUnder ? "text-primary" : isWorstUnder ? "text-destructive" : "text-foreground"
                    )}>{fmtOdds(b.under_odds)}</span>
                  </button>
                );
              })}
              <p className="text-[9px] text-muted-foreground text-center pt-1">Tap a book to use its odds in your parlay</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}