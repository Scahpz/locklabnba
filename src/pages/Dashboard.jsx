import React, { useState, useMemo, useEffect } from 'react';
import { fetchLiveProps, clearLiveCache } from '@/lib/liveData';
import ApiKeyPrompt from '@/components/dashboard/ApiKeyPrompt';
import StatsOverview from '@/components/dashboard/StatsOverview';
import PropFilters from '@/components/dashboard/PropFilters';
import PropCard from '@/components/dashboard/PropCard';
import LockOfTheDay from '@/components/dashboard/LockOfTheDay';
import { RefreshCw, Wifi, WifiOff, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('edge');
  const [selectedGames, setSelectedGames] = useState([]);
  const [liveProps, setLiveProps] = useState(null); // null = not yet loaded
  const [loadingLive, setLoadingLive] = useState(true);
  const [liveError, setLiveError] = useState(false);
  const [gameDate, setGameDate] = useState(null);
  const [gamesSummary, setGamesSummary] = useState([]);
  const [needsApiKey, setNeedsApiKey] = useState(false);

  const loadLive = async (forceRefresh = false) => {
    setLoadingLive(true);
    setLiveError(false);
    if (forceRefresh) clearLiveCache();
    try {
      const data = await fetchLiveProps();
      if (data?.needsApiKey) {
        setNeedsApiKey(true);
        setLiveProps([]);
      } else if (data?.props?.length > 0) {
        setLiveProps(data.props);
        setGameDate(data.game_date);
        setGamesSummary(data.games_summary || []);
        setNeedsApiKey(false);
      } else {
        setLiveProps([]);
      }
    } catch (e) {
      setLiveError(true);
      setLiveProps([]);
    } finally {
      setLoadingLive(false);
    }
  };

  useEffect(() => { loadLive(); }, []);

  const allProps = liveProps ?? [];

  const toggleGame = (g) => {
    const key = `${(g.away || '').toUpperCase().trim()}@${(g.home || '').toUpperCase().trim()}`;
    setSelectedGames(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  const filtered = useMemo(() => {
    let result = selectedType === 'all' ? allProps : allProps.filter(p => p.prop_type === selectedType);
    if (selectedGames.length > 0) {
      result = result.filter(p => {
        const pTeam = (p.team || '').toUpperCase().trim();
        const pOpp = (p.opponent || '').toUpperCase().trim();
        return selectedGames.some(key => {
          const [away, home] = key.split('@').map(t => t.toUpperCase().trim());
          return (pTeam === away || pTeam === home) && (pOpp === away || pOpp === home);
        });
      });
    }
    result = [...result].sort((a, b) => {
      if (sortBy === 'edge') return b.edge - a.edge;
      if (sortBy === 'hit_rate') return b.hit_rate_last_10 - a.hit_rate_last_10;
      if (sortBy === 'confidence') return b.confidence_score - a.confidence_score;
      if (sortBy === 'line') return b.line - a.line;
      return 0;
    });
    return result;
  }, [allProps, selectedType, sortBy]);

  if (loadingLive) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Fetching today's lines…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Player Props</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            {allProps.length > 0 ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-primary" />
                <span className="text-primary font-medium">Live</span>
                {gameDate && <span>· {gameDate}</span>}
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />
                No live data available
              </>
            )}
          </p>
        </div>
        <button
          onClick={() => loadLive(true)}
          disabled={loadingLive}
          className={cn(
            "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all border border-border",
            "text-foreground bg-secondary hover:bg-secondary/80"
          )}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Lines
        </button>
      </div>

      {/* Today's Games Bar */}
      {gamesSummary.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {gamesSummary.map((g, i) => {
            const key = `${(g.away || '').toUpperCase().trim()}@${(g.home || '').toUpperCase().trim()}`;
            const active = selectedGames.includes(key);
            return (
              <button
                key={i}
                onClick={() => toggleGame(g)}
                className={cn(
                  "flex items-center gap-2 border rounded-lg px-3 py-1.5 text-xs transition-all",
                  active
                    ? "bg-primary/15 border-primary/50 text-foreground"
                    : "bg-secondary/60 border-border text-foreground hover:border-primary/30"
                )}
              >
                <span className="font-bold">{g.away} @ {g.home}</span>
                {g.tipoff && <span className="text-muted-foreground">{g.tipoff}</span>}
                {g.total && <span className={active ? "text-primary font-medium" : "text-primary/70 font-medium"}>O/U {g.total}</span>}
              </button>
            );
          })}
          {selectedGames.length > 0 && (
            <button
              onClick={() => setSelectedGames([])}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 transition-colors"
            >
              Clear filter
            </button>
          )}
        </div>
      )}

      {liveError && (
        <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center gap-2">
          <WifiOff className="w-4 h-4" />
          Could not fetch live lines. Check your API key and try refreshing.
        </div>
      )}

      {needsApiKey && (
        <ApiKeyPrompt onKeySet={() => { setNeedsApiKey(false); loadLive(true); }} />
      )}

      {allProps.length > 0 && (
        <>
          <StatsOverview props={allProps} />
          <LockOfTheDay props={allProps} />
        </>
      )}

      {!needsApiKey && allProps.length === 0 && !liveError && (
        <div className="text-center py-20 text-muted-foreground">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">No props available today</p>
          <p className="text-sm mt-1">There are no player props available right now. Check back closer to game time.</p>
        </div>
      )}

      {allProps.length > 0 && (
        <div>
          <PropFilters
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            sortBy={sortBy}
            setSortBy={setSortBy}
          />
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No props found for this filter.</p>
            </div>
          ) : (
            <div className="space-y-6 mt-4">
              {['A', 'B', 'C'].map(tier => {
                const tierProps = filtered.filter(p => p.confidence_tier === tier);
                if (tierProps.length === 0) return null;
                const tierLabels = { A: 'Tier A — High Confidence', B: 'Tier B — Solid Value', C: 'Tier C — Speculative' };
                return (
                  <div key={tier}>
                    <h3 className="text-sm font-bold text-foreground mb-3 uppercase tracking-wider">{tierLabels[tier]} ({tierProps.length})</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {tierProps.map((prop, i) => (
                        <PropCard key={`${prop.player_name}-${prop.prop_type}-${i}`} prop={prop} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}