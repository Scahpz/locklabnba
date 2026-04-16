import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import TeamLogo from '@/components/common/TeamLogo';
import { fmtOdds } from '@/lib/oddsData';

function OddsCell({ label, value, sub, highlight }) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center rounded-lg px-2 py-2 min-w-[60px]",
      highlight ? "bg-primary/10 border border-primary/20" : "bg-secondary/50"
    )}>
      <p className="text-[9px] text-muted-foreground uppercase tracking-wider mb-0.5">{label}</p>
      <p className={cn("text-sm font-bold", highlight ? "text-primary" : "text-foreground")}>{value}</p>
      {sub && <p className="text-[9px] text-muted-foreground">{sub}</p>}
    </div>
  );
}

function TeamRow({ teamAbv, teamName, ml, spread, spreadOdds, isHome }) {
  const fav = ml != null && ml < 0;
  return (
    <div className="flex items-center gap-3">
      <TeamLogo team={teamAbv} className="w-9 h-9 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-foreground">{teamAbv}</p>
        <p className="text-[10px] text-muted-foreground truncate">{isHome ? 'Home' : 'Away'}</p>
      </div>
      <div className="flex items-center gap-1.5">
        {/* Moneyline */}
        <OddsCell label="ML" value={fmtOdds(ml)} highlight={fav} />
        {/* Spread */}
        {spread != null && (
          <OddsCell
            label="Spread"
            value={spread > 0 ? `+${spread}` : `${spread}`}
            sub={fmtOdds(spreadOdds)}
            highlight={spread < 0}
          />
        )}
      </div>
    </div>
  );
}

export default function GameOddsCard({ game }) {
  const [showBooks, setShowBooks] = useState(false);

  const tipoff = new Date(game.commence_time).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', timeZone: 'America/New_York'
  }) + ' ET';
  const dateStr = new Date(game.commence_time).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', timeZone: 'America/New_York'
  });

  const isToday = new Date(game.commence_time).toLocaleDateString() === new Date().toLocaleDateString();

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden hover:border-primary/20 transition-all">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-secondary/30 border-b border-border">
        <div className="flex items-center gap-2">
          <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", isToday ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground")}>
            {isToday ? 'TODAY' : dateStr}
          </span>
          <span className="text-xs text-muted-foreground">{tipoff}</span>
        </div>
        {game.moneyline?.bookmaker && (
          <span className="text-[10px] text-muted-foreground">{game.moneyline.bookmaker}</span>
        )}
      </div>

      {/* Teams + Odds */}
      <div className="p-4 space-y-3">
        <TeamRow
          teamAbv={game.awayAbv}
          teamName={game.away}
          ml={game.moneyline?.away}
          spread={game.spread?.away}
          spreadOdds={game.spread?.awayOdds}
          isHome={false}
        />
        <div className="border-t border-border/50" />
        <TeamRow
          teamAbv={game.homeAbv}
          teamName={game.home}
          ml={game.moneyline?.home}
          spread={game.spread?.home}
          spreadOdds={game.spread?.homeOdds}
          isHome={true}
        />
      </div>

      {/* Total */}
      {game.total?.line != null && (
        <div className="px-4 pb-3 flex items-center gap-3">
          <div className="flex-1 border-t border-border/50" />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="font-medium text-foreground">O/U {game.total.line}</span>
            <span className="text-primary">O {fmtOdds(game.total.overOdds)}</span>
            <span className="text-destructive">U {fmtOdds(game.total.underOdds)}</span>
          </div>
          <div className="flex-1 border-t border-border/50" />
        </div>
      )}

      {/* Line Shopping Toggle */}
      {game.allBooks?.length > 1 && (
        <div className="border-t border-border">
          <button
            onClick={() => setShowBooks(b => !b)}
            className="w-full flex items-center justify-center gap-1.5 py-2 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            {showBooks ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            {showBooks ? 'Hide' : 'Compare'} {game.allBooks.length} books
          </button>
          {showBooks && (() => {
            const awayMls = game.allBooks.map(b => b.ml_away).filter(v => v != null);
            const homeMls = game.allBooks.map(b => b.ml_home).filter(v => v != null);
            const bestAwayMl = awayMls.length ? Math.max(...awayMls) : null;
            const worstAwayMl = awayMls.length ? Math.min(...awayMls) : null;
            const bestHomeMl = homeMls.length ? Math.max(...homeMls) : null;
            const worstHomeMl = homeMls.length ? Math.min(...homeMls) : null;

            return (
              <div className="px-4 pb-3 space-y-1.5">
                <div className="grid grid-cols-5 text-[9px] text-muted-foreground uppercase tracking-wider mb-1 px-1">
                  <span className="col-span-2">Book</span>
                  <span className="text-center">{game.awayAbv} ML</span>
                  <span className="text-center">{game.homeAbv} ML</span>
                  <span className="text-center">O/U</span>
                </div>
                {game.allBooks.map(b => {
                  const isBestAway = b.ml_away === bestAwayMl;
                  const isWorstAway = b.ml_away === worstAwayMl && worstAwayMl !== bestAwayMl;
                  const isBestHome = b.ml_home === bestHomeMl;
                  const isWorstHome = b.ml_home === worstHomeMl && worstHomeMl !== bestHomeMl;
                  return (
                    <div key={b.key} className="grid grid-cols-5 text-xs bg-secondary/40 rounded-lg px-3 py-1.5 items-center">
                      <span className="col-span-2 text-muted-foreground text-[10px] truncate">{b.title}</span>
                      <span className={cn("text-center font-mono font-bold",
                        isBestAway ? "text-primary" : isWorstAway ? "text-destructive" : "text-foreground"
                      )}>{fmtOdds(b.ml_away)}</span>
                      <span className={cn("text-center font-mono font-bold",
                        isBestHome ? "text-primary" : isWorstHome ? "text-destructive" : "text-foreground"
                      )}>{fmtOdds(b.ml_home)}</span>
                      <span className="text-center font-mono font-medium text-foreground">{b.total_line ?? '—'}</span>
                    </div>
                  );
                })}
                <p className="text-[9px] text-muted-foreground text-center pt-0.5">
                  <span className="text-primary font-medium">Green</span> = best odds · <span className="text-destructive font-medium">Red</span> = worst odds
                </p>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}