import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Lock, AlertTriangle, Award, Zap, ChevronDown, ChevronUp, Check, TrendingUp, TrendingDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import TeamLogo from '@/components/common/TeamLogo';
import { useParlay } from '@/lib/ParlayContext';
import VerdictBadge from '@/components/props/VerdictBadge';
import PropGradeChecklist from '@/components/props/PropGradeChecklist';
import { gradeProp } from '@/lib/grading';

function fmtOdds(n) {
  if (n == null) return '—';
  return n > 0 ? `+${n}` : `${n}`;
}

const propTypeLabels = {
  points: 'PTS', rebounds: 'REB', assists: 'AST', PRA: 'PRA',
  '3PM': '3PM', steals: 'STL', blocks: 'BLK', turnovers: 'TO',
  'P+R': 'P+R', 'P+A': 'P+A', 'A+R': 'A+R',
};

const tierConfig = {
  A: { label: 'Tier A', className: 'bg-primary/10 text-primary border-primary/20' },
  B: { label: 'Tier B', className: 'bg-chart-4/10 text-chart-4 border-chart-4/20' },
  C: { label: 'Tier C', className: 'bg-white/5 text-muted-foreground border-white/8' },
};

export default function RankedPropCard({ prop, rank, aiVerdict, aiLoading, onOpenDetail }) {
  const { addLeg, isSelected } = useParlay();
  const [showBooks, setShowBooks] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);

  const gradedProp = React.useMemo(() => {
    const logs = prop.last_10_games || [];
    if (logs.length === 0) return prop;
    const hitCount = logs.filter(v => v > prop.line).length;
    const dynamicHitRate = Math.round(hitCount / logs.length * 100);
    const base = prop.projection ?? prop.avg_last_10 ?? null;
    const dynamicEdge = base != null ? Math.round((base - prop.line) * 100) / 100 : prop.edge;
    return { ...prop, hit_rate_last_10: dynamicHitRate, edge: dynamicEdge };
  }, [prop]);

  const grade = gradeProp(gradedProp);
  const tier = tierConfig[prop.has_analytics ? prop.confidence_tier : 'C'] || tierConfig.C;
  const isOverFavorable = grade.lean === 'OVER';
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

  const rankStyle = rank <= 3
    ? 'text-chart-4 bg-chart-4/10 border-chart-4/25'
    : rank <= 10
    ? 'text-primary bg-primary/10 border-primary/15'
    : 'text-muted-foreground bg-white/5 border-white/8';

  const overSelected = isSelected(prop.player_name, prop.prop_type, 'over');
  const underSelected = isSelected(prop.player_name, prop.prop_type, 'under');

  return (
    <div className={cn(
      "rounded-2xl border bg-[hsl(222,47%,9%)] transition-all duration-200 overflow-hidden",
      "hover:border-white/12 hover:shadow-[0_4px_24px_rgba(0,0,0,0.3)]",
      prop.is_lock ? "border-primary/20 shadow-[0_0_20px_hsl(142,71%,45%,0.06)]" : "border-white/6"
    )}>
      {/* Top accent bar for locks */}
      {prop.is_lock && <div className="h-0.5 w-full bg-gradient-to-r from-primary/0 via-primary to-primary/0" />}

      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold border flex-shrink-0", rankStyle)}>
              {rank}
            </div>
            <TeamLogo team={prop.team} className="w-9 h-9" />
            <div>
              <Link to={`/trends?player=${encodeURIComponent(prop.player_name)}`}
                className="font-semibold text-sm text-foreground hover:text-primary transition-colors">
                {prop.player_name}
              </Link>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5">{prop.team} vs {prop.opponent} · {prop.position}</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {prop.is_lock && <Lock className="w-3.5 h-3.5 text-primary" />}
            {prop.trap_warning && <AlertTriangle className="w-3.5 h-3.5 text-destructive" />}
            {prop.best_value && <Award className="w-3.5 h-3.5 text-chart-4" />}
            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-lg border", tier.className)}>
              {tier.label}
            </span>
          </div>
        </div>

        {/* Verdict */}
        <div className="mb-3">
          <VerdictBadge
            verdict={grade.verdict}
            ai_confidence={grade.confidence}
            dataQuality={grade.dataQuality}
            loading={false}
          />
          {grade.dataQuality === 'full' && aiVerdict?.reason && (
            <p className="text-[11px] text-muted-foreground/70 mt-2 leading-snug">{aiVerdict.reason}</p>
          )}
        </div>

        {/* Line + Bet buttons */}
        <div className="flex items-center justify-between bg-white/4 rounded-xl p-3 border border-white/5">
          <div>
            <p className="text-[10px] text-muted-foreground/60 font-semibold uppercase tracking-wider">
              {propTypeLabels[prop.prop_type] || prop.prop_type}
            </p>
            <p className="text-2xl font-bold text-foreground mt-0.5 leading-none">{displayLine}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handlePick('over')} className={cn(
              "flex flex-col items-center border rounded-xl px-4 py-2.5 transition-all min-w-[62px] active:scale-95",
              overSelected
                ? "bg-primary border-primary text-primary-foreground shadow-[0_0_12px_hsl(142,71%,45%,0.3)]"
                : isOverFavorable
                ? "bg-primary/10 hover:bg-primary/15 border-primary/25 text-primary"
                : "bg-white/5 hover:bg-white/8 border-white/8 text-muted-foreground"
            )}>
              <span className="text-[10px] font-bold">OVER</span>
              <span className="text-sm font-bold">{fmtOdds(displayOverOdds)}</span>
            </button>
            <button onClick={() => handlePick('under')} className={cn(
              "flex flex-col items-center border rounded-xl px-4 py-2.5 transition-all min-w-[62px] active:scale-95",
              underSelected
                ? "bg-destructive border-destructive text-destructive-foreground shadow-[0_0_12px_hsl(0,84%,60%,0.3)]"
                : !isOverFavorable
                ? "bg-destructive/10 hover:bg-destructive/15 border-destructive/25 text-destructive"
                : "bg-white/5 hover:bg-white/8 border-white/8 text-muted-foreground"
            )}>
              <span className="text-[10px] font-bold">UNDER</span>
              <span className="text-sm font-bold">{fmtOdds(displayUnderOdds)}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-4 pb-3 grid grid-cols-3 gap-2">
        <div className="bg-white/3 rounded-xl p-2.5 text-center">
          <p className="text-[9px] text-muted-foreground/60 uppercase font-semibold tracking-wider">Projection</p>
          <p className="text-sm font-bold text-foreground mt-0.5">{prop.projection ?? '—'}</p>
        </div>
        <div className="bg-white/3 rounded-xl p-2.5 text-center">
          <p className="text-[9px] text-muted-foreground/60 uppercase font-semibold tracking-wider">Edge</p>
          <p className={cn("text-sm font-bold flex items-center justify-center gap-0.5 mt-0.5", isOverFavorable ? 'text-primary' : 'text-destructive')}>
            {isOverFavorable ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {prop.edge != null ? `${prop.edge > 0 ? '+' : ''}${prop.edge}%` : '—'}
          </p>
        </div>
        <div className="bg-white/3 rounded-xl p-2.5 text-center">
          <p className="text-[9px] text-muted-foreground/60 uppercase font-semibold tracking-wider">Hit Rate</p>
          <p className="text-sm font-bold text-foreground mt-0.5">{prop.hit_rate_last_10 != null ? `${prop.hit_rate_last_10}%` : '—'}</p>
        </div>
      </div>

      {/* Streak */}
      {prop.streak_info && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-1.5 bg-chart-4/8 border border-chart-4/15 rounded-xl px-3 py-1.5">
            <Zap className="w-3 h-3 text-chart-4 flex-shrink-0" />
            <p className="text-[11px] text-chart-4 font-medium">{prop.streak_info}</p>
          </div>
        </div>
      )}

      {/* Grade Checklist */}
      <PropGradeChecklist prop={prop} />

      {/* Deep Dive */}
      <div className="px-4 pb-4">
        <button onClick={onOpenDetail}
          className="w-full text-xs font-semibold text-muted-foreground hover:text-primary border border-white/8 hover:border-primary/25 rounded-xl py-2.5 transition-all bg-white/3 hover:bg-primary/5">
          Full Analysis + Line Adjuster →
        </button>
      </div>

      {/* Book comparison */}
      {hasBooks && (
        <div className="border-t border-white/5">
          <button onClick={() => setShowBooks(s => !s)}
            className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[11px] text-muted-foreground/60 hover:text-muted-foreground transition-colors">
            {showBooks ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            {showBooks ? 'Hide' : 'Compare'} {prop.all_books.length} books
          </button>
          {showBooks && (
            <div className="px-4 pb-4 space-y-1.5">
              <div className="grid grid-cols-5 text-[9px] text-muted-foreground/50 uppercase tracking-wider mb-2 px-1">
                <span className="col-span-2">Book</span>
                <span className="text-center">Line</span>
                <span className="text-center">Over</span>
                <span className="text-center">Under</span>
              </div>
              {prop.all_books.map(b => {
                const isActive = selectedBook === b.key || (!selectedBook && b.key === prop.all_books[0]?.key);
                return (
                  <button key={b.key} onClick={() => setSelectedBook(selectedBook === b.key ? null : b.key)}
                    className={cn(
                      "w-full grid grid-cols-5 text-xs rounded-xl px-3 py-2 items-center transition-all",
                      isActive ? "bg-primary/10 border border-primary/20" : "bg-white/3 hover:bg-white/6 border border-transparent"
                    )}>
                    <span className={cn("col-span-2 text-[10px] truncate font-semibold", isActive ? "text-primary" : "text-muted-foreground")}>
                      {isActive && <Check className="w-2.5 h-2.5 inline mr-1" />}
                      {b.title}
                    </span>
                    <span className="text-center font-mono text-foreground">{b.line ?? '—'}</span>
                    <span className={cn("text-center font-mono font-bold",
                      b.over_odds === bestOverOdds ? "text-primary" : b.over_odds === worstOverOdds ? "text-destructive" : "text-foreground")}>
                      {fmtOdds(b.over_odds)}
                    </span>
                    <span className={cn("text-center font-mono font-bold",
                      b.under_odds === bestUnderOdds ? "text-primary" : b.under_odds === worstUnderOdds ? "text-destructive" : "text-foreground")}>
                      {fmtOdds(b.under_odds)}
                    </span>
                  </button>
                );
              })}
              <p className="text-[9px] text-muted-foreground/40 text-center pt-1">Tap a book to use its odds in your parlay</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
