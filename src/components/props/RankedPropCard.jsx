import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Lock, AlertTriangle, Award, Zap, ChevronDown, ChevronUp, Check, TrendingUp, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import TeamLogo from '@/components/common/TeamLogo';
import { useParlay } from '@/lib/ParlayContext';
import VerdictBadge from '@/components/props/VerdictBadge';
import PropGradeChecklist from '@/components/props/PropGradeChecklist';

function fmtOdds(n) {
  if (n == null) return '—';
  return n > 0 ? `+${n}` : `${n}`;
}

const propTypeLabels = {
  points: 'PTS', rebounds: 'REB', assists: 'AST', PRA: 'PRA',
  '3PM': '3PM', steals: 'STL', blocks: 'BLK', turnovers: 'TO',
};

const tierConfig = {
  A: { label: 'Tier A', color: 'bg-primary/20 text-primary border-primary/30' },
  B: { label: 'Tier B', color: 'bg-accent/20 text-accent border-accent/30' },
  C: { label: 'Tier C', color: 'bg-muted text-muted-foreground border-border' },
};

export default function RankedPropCard({ prop, rank, aiVerdict, aiLoading }) {
  const { addLeg, isSelected } = useParlay();
  const [showBooks, setShowBooks] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  // Grade confidence — only meaningful when real game-log analytics are loaded
  function calculateGradeConfidence(p) {
    if (!p.has_analytics) return null; // no data yet
    const l10Pass   = p.avg_last_10 != null && p.avg_last_10 > p.line;
    const l5Pass    = p.avg_last_5  != null && p.avg_last_5  > p.line;
    const hitPass   = p.hit_rate_last_10 != null && p.hit_rate_last_10 >= 60;
    const projPass  = p.projection  != null && p.projection  > p.line;
    const edgePass  = p.edge != null && p.edge > 0;
    const passCount = [l10Pass, l5Pass, hitPass, projPass, edgePass].filter(Boolean).length;
    return passCount * 20;
  }

  const gradeConfidence = calculateGradeConfidence(prop);
  const tier = tierConfig[prop.confidence_tier] || tierConfig.C;
  const isPositiveEdge = prop.edge > 0;
  const hasBooks = prop.all_books?.length > 1;

  const activeBook = selectedBook ? prop.all_books?.find(b => b.key === selectedBook) : null;
  const displayOverOdds = activeBook?.over_odds ?? prop.over_odds;
  const displayUnderOdds = activeBook?.under_odds ?? prop.under_odds;
  const displayLine = activeBook?.line ?? prop.line;

  const overOddsValues = (prop.all_books || []).map(b => b.over_odds).filter(v => v != null);
  const underOddsValues = (prop.all_books || []).map(b => b.under_odds).filter(v => v != null);
  const bestOverOdds = overOddsValues.length ? Math.max(...overOddsValues) : null;
  const worstOverOdds = overOddsValues.length ? Math.min(...overOddsValues) : null;
  const bestUnderOdds = underOddsValues.length ? Math.max(...underOddsValues) : null;
  const worstUnderOdds = underOddsValues.length ? Math.min(...underOddsValues) : null;

  const handlePick = (pick) => {
    addLeg({ ...prop, over_odds: displayOverOdds, under_odds: displayUnderOdds, line: displayLine, bookmaker: activeBook?.title ?? prop.bookmaker }, pick);
  };

  // Rank color
  const rankColor = rank <= 3 ? 'text-chart-4 bg-chart-4/10 border-chart-4/30' :
    rank <= 10 ? 'text-primary bg-primary/10 border-primary/20' :
    'text-muted-foreground bg-secondary border-border';

  return (
    <div className={cn(
      "group rounded-xl border bg-card hover:border-primary/30 transition-all duration-300 hover:shadow-[0_0_20px_hsl(142,71%,45%,0.08)] overflow-hidden",
      prop.is_lock ? "border-primary/30" : "border-border"
    )}>
      {/* Rank + Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Rank badge */}
            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border flex-shrink-0", rankColor)}>
              #{rank}
            </div>
            <TeamLogo team={prop.team} className="w-9 h-9" />
            <div>
              <Link to={`/trends?player=${encodeURIComponent(prop.player_name)}`} className="font-semibold text-sm text-foreground hover:text-primary transition-colors">
                {prop.player_name}
              </Link>
              <p className="text-xs text-muted-foreground">{prop.team} vs {prop.opponent} · {prop.position}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {prop.is_lock && <Lock className="w-3.5 h-3.5 text-primary" />}
            {prop.trap_warning && <AlertTriangle className="w-3.5 h-3.5 text-destructive" />}
            {prop.best_value && <Award className="w-3.5 h-3.5 text-chart-4" />}
            <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", tier.color)}>
              {tier.label}
            </Badge>
          </div>
        </div>

        {/* AI Verdict */}
        <div className="mb-3">
          {gradeConfidence === null ? (
            <Link
              to={`/trends?player=${encodeURIComponent(prop.player_name)}`}
              className="flex items-center gap-1.5 bg-secondary/60 rounded-lg px-3 py-1.5 text-xs text-muted-foreground hover:text-primary transition-colors w-fit"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Click to load game history &amp; grade
            </Link>
          ) : (
            <VerdictBadge
              verdict={gradeConfidence >= 60 ? (prop.edge > 0 ? 'OVER' : 'UNDER') : gradeConfidence >= 40 ? 'UNSAFE' : 'UNDER'}
              ai_confidence={gradeConfidence}
              loading={aiLoading && !aiVerdict}
            />
          )}
          {aiVerdict?.reason && (
            <p className="text-[11px] text-muted-foreground mt-1.5 leading-snug">{aiVerdict.reason}</p>
          )}
        </div>

        {/* Prop Line + Bet Buttons */}
        <div className="flex items-center justify-between bg-secondary/50 rounded-lg p-3">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{propTypeLabels[prop.prop_type] || prop.prop_type}</p>
            <p className="text-2xl font-bold text-foreground mt-0.5">{displayLine}</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handlePick('over')}
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
              onClick={() => handlePick('under')}
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

      {/* Stats */}
      <div className="px-4 pb-3 grid grid-cols-4 gap-3">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase">Projection</p>
          <p className="text-sm font-semibold text-foreground">{prop.projection}</p>
        </div>
        <div>
          <p className="text-[10px] text-muted-foreground uppercase">Edge</p>
          <p className={cn("text-sm font-semibold flex items-center gap-0.5", isPositiveEdge ? 'text-primary' : 'text-destructive')}>
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

      {/* Grade Checklist */}
      <PropGradeChecklist prop={prop} />

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
                    <span className={cn("text-center font-mono font-bold", b.over_odds === bestOverOdds ? "text-primary" : b.over_odds === worstOverOdds ? "text-destructive" : "text-foreground")}>{fmtOdds(b.over_odds)}</span>
                    <span className={cn("text-center font-mono font-bold", b.under_odds === bestUnderOdds ? "text-primary" : b.under_odds === worstUnderOdds ? "text-destructive" : "text-foreground")}>{fmtOdds(b.under_odds)}</span>
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