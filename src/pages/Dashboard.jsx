import React, { useState, useMemo, useEffect } from 'react';
import { getAllProps } from '@/lib/mockData';
import { fetchLiveProps, clearLiveCache, isCacheValid } from '@/lib/liveData';
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
  const [liveProps, setLiveProps] = useState(null);
  const [loadingLive, setLoadingLive] = useState(false);
  const [liveError, setLiveError] = useState(false);
  const [gameDate, setGameDate] = useState(null);
  const [gamesSummary, setGamesSummary] = useState([]);
  const [useLive, setUseLive] = useState(isCacheValid()); // auto-on if cached

  const staticProps = getAllProps();

  const loadLive = async (forceRefresh = false) => {
    setLoadingLive(true);
    setLiveError(false);
    if (forceRefresh) clearLiveCache();
    try {
      const data = await fetchLiveProps();
      if (data?.props?.length > 0) {
        setLiveProps(data.props);
        setGameDate(data.game_date);
        setGamesSummary(data.games_summary || []);
        setUseLive(true);
      } else {
        setLiveError(true);
      }
    } catch {
      setLiveError(true);
    } finally {
      setLoadingLive(false);
    }
  };

  useEffect(() => {
    loadLive();
  }, []);

  const allProps = useLive && liveProps ? liveProps : staticProps;

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Player Props</h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            {useLive ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-primary" />
                <span className="text-primary font-medium">Live</span>
                {gameDate && <span>· {gameDate}</span>}
              </>
            ) : loadingLive ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                Fetching today's lines…
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-muted-foreground" />
                Showing sample data
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {useLive && (
            <button
              onClick={() => setUseLive(false)}
              className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg bg-secondary transition-colors"
            >
              Sample data
            </button>
          )}
          {!useLive && liveProps && (
            <button
              onClick={() => setUseLive(true)}
              className="text-xs text-primary hover:text-primary/80 px-3 py-1.5 rounded-lg bg-primary/10 transition-colors"
            >
              Use live data
            </button>
          )}
          <button
            onClick={() => loadLive(true)}
            disabled={loadingLive}
            className={cn(
              "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all border border-border",
              loadingLive ? "text-muted-foreground bg-secondary/50" : "text-foreground bg-secondary hover:bg-secondary/80"
            )}
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loadingLive && "animate-spin")} />
            {loadingLive ? "Fetching…" : "Refresh Lines"}
          </button>
        </div>
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
          Could not fetch live lines. Showing sample data. Try refreshing.
        </div>
      )}

      <StatsOverview />
      <LockOfTheDay props={allProps} />

      <div>
        <PropFilters
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {[...filtered].sort((a, b) => {
            const tierOrder = { A: 0, B: 1, C: 2 };
            return (tierOrder[a.confidence_tier] || 2) - (tierOrder[b.confidence_tier] || 2);
          }).map((prop, i) => (
            <PropCard key={`${prop.player_name}-${prop.prop_type}-${i}`} prop={prop} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No props found for this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}