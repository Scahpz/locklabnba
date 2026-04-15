import React, { useState, useMemo, useEffect } from 'react';
import { getAllProps } from '@/lib/mockData';
import { fetchLiveProps } from '@/lib/liveData';
import StatsOverview from '@/components/dashboard/StatsOverview';
import PropFilters from '@/components/dashboard/PropFilters';
import PropCard from '@/components/dashboard/PropCard';
import LockOfTheDay from '@/components/dashboard/LockOfTheDay';
import { Wifi, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('edge');
  const [selectedGames, setSelectedGames] = useState([]);
  const [gameDate, setGameDate] = useState(null);
  const [gamesSummary, setGamesSummary] = useState([]);

  useEffect(() => {
    fetchLiveProps().then(data => {
      setGameDate(data.game_date);
      setGamesSummary(data.games_summary || []);
    });
  }, []);

  const allProps = getAllProps();

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
            <Wifi className="w-3.5 h-3.5 text-primary" />
            <span>Today's Props</span>
            {gameDate && <span>· {gameDate}</span>}
          </p>
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



      <StatsOverview />
      <LockOfTheDay props={allProps} />

      <div>
        <PropFilters
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
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
    </div>
  );
}