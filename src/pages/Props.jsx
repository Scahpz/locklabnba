import React, { useState, useMemo, useEffect, useRef } from 'react';
import { fetchLiveProps, clearLiveCache } from '@/lib/liveData';
import { getAIVerdicts } from '@/lib/aiVerdicts';
import LockCards from '@/components/props/LockCards';
import RankedPropCard from '@/components/props/RankedPropCard';
import { RefreshCw, Wifi, WifiOff, Zap, SlidersHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { rankScore } from '@/lib/grading';
import { NBA_API } from '@/lib/config';

const PROP_TYPES = ['all', 'points', 'rebounds', 'assists', 'PRA', '3PM', 'steals', 'blocks'];
const SORT_OPTIONS = [
  { value: 'ai_rank', label: 'AI Rank' },
  { value: 'confidence', label: 'Confidence' },
  { value: 'edge', label: 'Edge' },
  { value: 'hit_rate', label: 'Hit Rate' },
];

function fmtTipoff(scheduledAt) {
  if (!scheduledAt) return null;
  try {
    const d = new Date(scheduledAt);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
  } catch { return null; }
}

export default function Props() {
  const [rawProps, setRawProps] = useState([]);
  const [gameDate, setGameDate] = useState(null);
  const [gamesSummary, setGamesSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [selectedGames, setSelectedGames] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState('ai_rank');
  const [verdicts, setVerdicts] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [playerAnalytics, setPlayerAnalytics] = useState({});
  const fetchedPlayers = useRef(new Set());

  const loadData = async (forceRefresh = false) => {
    setLoading(true);
    if (forceRefresh) {
      setPlayerAnalytics({});
      fetchedPlayers.current = new Set();
    }
    try {
      const data = await fetchLiveProps();
      if (data?.props?.length > 0) {
        const realProps = data.props.filter(p => p.injury_status !== 'out');
        setRawProps(realProps);
        setGameDate(data.game_date);
        setGamesSummary(data.games_summary || []);
        setIsLive(true);

        setAiLoading(true);
        const topProps = realProps.slice(0, 50);
        getAIVerdicts(topProps).then(v => {
          setVerdicts(v);
          setAiLoading(false);
        }).catch(() => setAiLoading(false));
      } else {
        setRawProps([]);
      }
    } catch {
      setRawProps([]);
    }
    setLoading(false);
  };

  // Auto-fetch game logs for every player in the background (5 at a time)
  useEffect(() => {
    if (!rawProps.length) return;
    const names = [...new Set(rawProps.map(p => p.player_name))];
    const pending = names.filter(n => !fetchedPlayers.current.has(n));
    if (!pending.length) return;

    const batchSize = 5;
    let i = 0;
    function fetchBatch() {
      const batch = pending.slice(i, i + batchSize);
      i += batchSize;
      if (!batch.length) return;
      Promise.all(batch.map(async name => {
        fetchedPlayers.current.add(name);
        try {
          const res = await fetch(`${NBA_API}/api/player-gamelogs`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ playerName: name }),
          });
          if (!res.ok) return;
          const data = await res.json();
          if (data.analytics) {
            setPlayerAnalytics(prev => ({ ...prev, [name]: data.analytics }));
          }
        } catch {}
      })).then(() => fetchBatch());
    }
    fetchBatch();
  }, [rawProps]);

  // Merge real analytics into raw props as they load
  const enrichedProps = useMemo(() => {
    return rawProps.map(prop => {
      const analytics = playerAnalytics[prop.player_name]?.[prop.prop_type];
      if (!analytics) return prop;
      const cs = analytics.confidence_score || 5;
      return {
        ...prop,
        has_analytics: true,
        avg_last_5: analytics.avg_last_5,
        avg_last_10: analytics.avg_last_10,
        hit_rate_last_10: analytics.hit_rate_last_10,
        projection: analytics.projection,
        edge: analytics.edge,
        confidence_score: cs,
        streak_info: analytics.streak_info,
        last_10_games: analytics.last_10_games,
        last_5_games: analytics.last_5_games,
        game_logs_last_10: analytics.game_logs_last_10,
        confidence_tier: cs >= 8 ? 'A' : cs >= 6 ? 'B' : 'C',
        is_lock: cs === 10,
        best_value: (analytics.edge || 0) > 8,
      };
    });
  }, [rawProps, playerAnalytics]);

  useEffect(() => { loadData(); }, []);

  const toggleGame = (g) => {
    const key = `${(g.away || '').toUpperCase()}@${(g.home || '').toUpperCase()}`;
    setSelectedGames(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  // Picks of the day: top 2 ranked picks with 100% grade confidence (requires real analytics)
  const locks = useMemo(() => {
    const calculateGradeConfidence = (p) => {
      if (!p.has_analytics) return 0;
      const l10Pass  = p.avg_last_10 != null && p.avg_last_10 > p.line;
      const l5Pass   = p.avg_last_5  != null && p.avg_last_5  > p.line;
      const hitPass  = p.hit_rate_last_10 != null && p.hit_rate_last_10 >= 60;
      const projPass = p.projection  != null && p.projection  > p.line;
      const edgePass = p.edge != null && p.edge > 0;
      const passCount = [l10Pass, l5Pass, hitPass, projPass, edgePass].filter(Boolean).length;
      return passCount * 20;
    };

    return [...enrichedProps]
      .filter(p => calculateGradeConfidence(p) === 100)
      .sort((a, b) => rankScore(b) - rankScore(a))
      .slice(0, 2);
  }, [enrichedProps]);

  const sortedGames = useMemo(() => {
    return [...gamesSummary].sort((a, b) => {
      const ta = a.scheduled_at ? new Date(a.scheduled_at).getTime() : Infinity;
      const tb = b.scheduled_at ? new Date(b.scheduled_at).getTime() : Infinity;
      return ta - tb;
    });
  }, [gamesSummary]);

  const filteredAndRanked = useMemo(() => {
    let result = enrichedProps;

    if (selectedGames.length > 0) {
      result = result.filter(p => {
        const pTeam = (p.team || '').toUpperCase();
        const pOpp = (p.opponent || '').toUpperCase();
        return selectedGames.some(key => {
          const [away, home] = key.split('@');
          return (pTeam === away || pTeam === home) && (pOpp === away || pOpp === home);
        });
      });
    }

    if (selectedType !== 'all') {
      result = result.filter(p => p.prop_type === selectedType);
    }

    result = [...result].sort((a, b) => {
      if (sortBy === 'ai_rank') return rankScore(b) - rankScore(a);
      if (sortBy === 'confidence') return (b.confidence_score || 0) - (a.confidence_score || 0);
      if (sortBy === 'edge') return (b.edge || 0) - (a.edge || 0);
      if (sortBy === 'hit_rate') return (b.hit_rate_last_10 || 0) - (a.hit_rate_last_10 || 0);
      return 0;
    });

    return result;
  }, [enrichedProps, selectedGames, selectedType, sortBy]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Fetching today's props…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
            <Zap className="w-7 h-7 text-primary" />
            Props
          </h1>
          <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            {isLive ? (
              <><Wifi className="w-3.5 h-3.5 text-primary" /><span className="text-primary font-medium">Live</span>{gameDate && <span className="text-muted-foreground">· {gameDate}</span>}</>
            ) : (
              <><WifiOff className="w-3.5 h-3.5" />No live data available</>
            )}
            {aiLoading && <span className="text-muted-foreground flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" />AI analyzing…</span>}
          </p>
        </div>
        <button
          onClick={() => loadData(true)}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-border text-foreground bg-secondary hover:bg-secondary/80 transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Game filter */}
      {sortedGames.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {sortedGames.map((g, i) => {
            const key = `${(g.away || '').toUpperCase()}@${(g.home || '').toUpperCase()}`;
            const active = selectedGames.includes(key);
            const tipoff = fmtTipoff(g.scheduled_at) || g.tipoff;
            return (
              <button
                key={i}
                onClick={() => toggleGame(g)}
                className={cn(
                  "flex items-center gap-2 border rounded-lg px-3 py-1.5 text-xs transition-all",
                  active ? "bg-primary/15 border-primary/50 text-foreground" : "bg-secondary/60 border-border text-foreground hover:border-primary/30"
                )}
              >
                <span className="font-bold">{g.away} @ {g.home}</span>
                {tipoff && <span className="text-muted-foreground">{tipoff}</span>}
              </button>
            );
          })}
          {selectedGames.length > 0 && (
            <button onClick={() => setSelectedGames([])} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1.5 transition-colors">
              Clear
            </button>
          )}
        </div>
      )}

      {/* Empty state */}
      {enrichedProps.length === 0 && (
        <div className="text-center py-20 text-muted-foreground">
          <Zap className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-lg font-medium">No props available today</p>
          <p className="text-sm mt-1">Check back closer to game time once props are posted.</p>
        </div>
      )}

      {enrichedProps.length > 0 && (
        <>
          {/* Locks of the Day */}
          <LockCards locks={locks} verdicts={verdicts} aiLoading={aiLoading} />

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="flex items-center gap-1.5 flex-wrap">
              <SlidersHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
              {PROP_TYPES.map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedType(t)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-lg border transition-all capitalize",
                    selectedType === t
                      ? "bg-primary/20 border-primary/40 text-primary font-medium"
                      : "bg-secondary/60 border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {t === 'all' ? 'All Props' : t.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-xs text-muted-foreground">Sort:</span>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="text-xs bg-secondary border border-border text-foreground rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          {/* Ranked props list */}
          <div>
            <p className="text-xs text-muted-foreground mb-3">{filteredAndRanked.length} props · ranked by {SORT_OPTIONS.find(o => o.value === sortBy)?.label}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndRanked.map((prop, i) => {
                const key = `${prop.player_name}__${prop.prop_type}__${prop.line}`;
                return (
                  <RankedPropCard
                    key={key}
                    prop={prop}
                    rank={i + 1}
                    aiVerdict={verdicts[key]}
                    aiLoading={aiLoading}
                  />
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}